import express from 'express';
import cors from 'cors';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Project, Skill, Message, Profile, Admin } from './src/models/index.js';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { UAParser } from 'ua-parser-js';
import requestIp from 'request-ip';
import crypto from 'crypto';
import validator from 'validator';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portfolio';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

app.use(cors());
app.use(express.json());
app.use(requestIp.mw());

// --- Rate Limiting Logic ---
const loginAttempts = new Map<string, { count: number, lastAttempt: number }>();
const MAX_ATTEMPTS = 3;
const BLOCK_TIME = 15 * 60 * 1000; // 15 minutes

const clearOldAttempts = () => {
  const now = Date.now();
  for (const [ip, data] of loginAttempts.entries()) {
    if (now - data.lastAttempt > BLOCK_TIME) {
      loginAttempts.delete(ip);
    }
  }
};
setInterval(clearOldAttempts, 5 * 60 * 1000); // Every 5 minutes
// ---------------------------

// -----------------------------------------------------------------
// NEW CLEAN EMAIL CONFIGURATION (RE-CONFIGURED FROM SCRATCH)
// -----------------------------------------------------------------
const getEmailConfig = () => {
  const user = (process.env.EMAIL_USER || '').trim().replace(/^['"]|['"]$/g, '');
  const pass = (process.env.EMAIL_PASS || '').trim().replace(/^['"]|['"]$/g, '').replace(/\s+/g, '');
  return { user, pass };
};

// Transporter factory that ensures we use fresh credentials
const getTransporter = () => {
  const { user, pass } = getEmailConfig();
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    // Force IPv4 as some environments (like Render) fail with ENETUNREACH on IPv6
    family: 4
  });
};

// Initial health check report
const initSMTPCheck = async () => {
  const { user, pass } = getEmailConfig();
  console.log('>>> [NEW SMTP SETUP INITIALIZED]');
  console.log('Target:', user || 'NOT CONFIGURED');
  console.log('Auth Code:', pass ? `${pass.substring(0, 2)}...${pass.slice(-2)} (Total: ${pass.length} chars)` : 'MISSING');
  
  if (user && pass) {
    try {
      const testTransport = getTransporter();
      await testTransport.verify();
      console.log('STATUS: ✅ SMTP CONNECTION SUCCESSFUL');
    } catch (err: any) {
      console.error('STATUS: ❌ SMTP CONNECTION FAILED -', err.message);
    }
  }
};

initSMTPCheck();
// -----------------------------------------------------------------

// Auth Middleware
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminSecretCheck = (req: any, res: any, next: any) => {
  const secret = req.headers['x-admin-secret'];
  const expectedSecret = process.env.VITE_ADMIN_ACCESS_SECRET;
  
  // Only enforce if secret is configured in env
  if (expectedSecret && secret !== expectedSecret) {
    return res.status(403).json({ message: 'Access denied: Invalid security token' });
  }
  next();
};

// --- API Routes ---
app.get('/api/auth/test-smtp', async (req, res) => {
  try {
    const testTransporter = getTransporter();
    await testTransporter.verify();
    const config = getEmailConfig();
    res.json({ 
      success: true, 
      message: 'SMTP is connected and working!',
      audit: {
        email: config.user || 'MISSING',
        passLength: config.pass.length
      }
    });
  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      error: err.message,
      help: 'Check Settings > Secrets. Ensure EMAIL_USER is your email and EMAIL_PASS is a 16-character App Password.'
    });
  }
});

app.get('/api/auth/check-admin', adminSecretCheck, async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    res.json({ adminExists: adminCount > 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/register', adminSecretCheck, async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({ message: 'Registration is closed' });
    }

    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Enhanced email validation using validator library
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address format' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      username,
      email,
      password: hashedPassword,
      verificationToken,
      isVerified: false
    });

    await admin.save();

    // Determine public URL dynamically
    let publicUrl = APP_URL;
    if (publicUrl.includes('localhost') || !process.env.APP_URL) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      publicUrl = `${protocol}://${host}`;
    }
    publicUrl = publicUrl.replace(/\/$/, '');

    // Send verification email
    const verificationLink = `${publicUrl}/api/auth/verify-email/${verificationToken}`;
    
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const mailer = getTransporter();
        await mailer.sendMail({
          from: `"Portfolio Admin" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Verify your Admin account',
          html: `
            <div style="font-family: sans-serif; padding: 40px; background: #f9fafb; border-radius: 20px;">
              <h1 style="color: #6366f1;">Welcome Admin!</h1>
              <p>Almost there! Click the button below to verify your email and activate your account:</p>
              <a href="${verificationLink}" style="display: inline-block; padding: 16px 32px; background: #6366f1; color: white; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px;">Verify Email Address</a>
              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">If the button doesn't work, copy this link: <br/> ${verificationLink}</p>
            </div>
          `
        });
        return res.json({ message: 'Registration successful! Please check your email inbox (and spam) to verify your account before logging in.' });
      } catch (mailErr: any) {
        console.error('Mail send error:', mailErr);
        // Delete the admin if mail fails so they can try again once they fix config
        await Admin.deleteOne({ _id: admin._id });
        let errorMessage = 'Failed to send verification email. Please check your SMTP configuration in Secrets.';
        if (mailErr.message && mailErr.message.includes('535')) {
          errorMessage = 'Authentication Failed (Error 535): Your Gmail App Password was rejected. Please verify the 16-character code in Settings > Secrets.';
        }
        return res.status(500).json({ message: errorMessage });
      }
    } else {
      // Delete the admin if secrets are missing
      await Admin.deleteOne({ _id: admin._id });
      res.status(500).json({ message: 'Email service not configured. Please add EMAIL_USER and EMAIL_PASS to your app secrets.' });
    }

  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username or Email already exists' });
    }
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/auth/verify-email/:token', async (req, res) => {
  try {
    const admin = await Admin.findOne({ verificationToken: req.params.token });
    if (!admin) {
      return res.status(400).send('<h1>Invalid or expired token</h1>');
    }

    admin.isVerified = true;
    admin.verificationToken = undefined;
    await admin.save();

    res.send(`
      <h1>Email Verified Successfully!</h1>
      <p>You can now <a href="${APP_URL.replace(/\/$/, '')}/admin/login/${process.env.VITE_ADMIN_ACCESS_SECRET}">Login</a> to your dashboard.</p>
    `);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.post('/api/auth/login-request', adminSecretCheck, async (req, res) => {
  const ip = (req as any).clientIp || 'Unknown';
  const now = Date.now();

  // Check if IP is blocked
  const attempts = loginAttempts.get(ip);
  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    const timeLeft = BLOCK_TIME - (now - attempts.lastAttempt);
    if (timeLeft > 0) {
      const minutes = Math.ceil(timeLeft / 60000);
      return res.status(429).json({ 
        message: `Too many failed attempts. Your IP is blocked for ${minutes} more minutes.` 
      });
    } else {
      // Block expired
      loginAttempts.delete(ip);
    }
  }

  try {
    const { identifier, password } = req.body; // identifier can be username or email

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    // If identifier looks like an email, validate its format
    if (identifier.includes('@') && !validator.isEmail(identifier)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const admin = await Admin.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      const current = loginAttempts.get(ip) || { count: 0, lastAttempt: now };
      current.count += 1;
      current.lastAttempt = now;
      loginAttempts.set(ip, current);

      const remaining = MAX_ATTEMPTS - current.count;
      let msg = 'Invalid credentials';
      if (remaining > 0) {
        msg += `. ${remaining} attempts remaining before 15 min block.`;
      } else {
        msg = 'Too many failed attempts. Your IP is blocked for 15 minutes.';
      }
      return res.status(401).json({ message: msg });
    }

    // Success - clear attempts
    loginAttempts.delete(ip);

    if (!admin.isVerified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    // Generate 8-digit OTP
    const otp = Math.floor(10000000 + Math.random() * 90000000).toString();
    admin.otp = otp;
    admin.otpExpires = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
    await admin.save();

    // Get Device/IP/Location Info
    const parser = new UAParser(req.headers['user-agent']);
    const device = parser.getDevice();
    const os = parser.getOS();
    const browser = parser.getBrowser();
    const timestamp = new Date().toLocaleString();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const mailer = getTransporter();
        await mailer.sendMail({
          from: `"Portfolio Security" <${process.env.EMAIL_USER}>`,
          to: admin.email,
          subject: `Login Security Code: ${otp}`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; color: #333; background: #f9fafb; border-radius: 20px; border: 1px solid #e5e7eb;">
              <h2 style="color: #6366f1;">Identity Verification</h2>
              <p>Enter this code in the login portal to access your dashboard:</p>
              <div style="background: #ffffff; padding: 30px; border-radius: 16px; font-size: 32px; font-weight: 900; text-align: center; letter-spacing: 8px; color: #111827; border: 2px solid #6366f1;">
                ${otp}
              </div>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">This code expires in exactly <strong>2 minutes</strong>.</p>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p><strong>Login Context:</strong></p>
              <ul style="list-style: none; padding: 0; font-size: 14px;">
                <li>📍 <strong>IP Address:</strong> ${ip}</li>
                <li>💻 <strong>Device:</strong> ${device.model || 'Unknown'} (${os.name})</li>
                <li>🌐 <strong>Browser:</strong> ${browser.name}</li>
              </ul>
            </div>
          `
        });
        res.json({ message: 'Security code sent! Please check your email inbox for the 8-digit MFA code.' });
      } catch (mailErr: any) {
        console.error('OTP Mail error:', mailErr);
        let errorMessage = 'Security system failure: Unable to send verification email. Please verify SMTP settings.';
        
        if (mailErr.message && mailErr.message.includes('535')) {
          errorMessage = 'SMTP Auth Failed (Error 535). Please verify your Gmail App Password in Render Environment Variables.';
        } else if (mailErr.code === 'EENVELOPE') {
          errorMessage = 'SMTP Error: Invalid sender or recipient address.';
        } else if (mailErr.code === 'ETIMEDOUT') {
          errorMessage = 'SMTP Error: Connection timed out. Please check if port 465/587 is allowed or use a different service.';
        }
        
        res.status(500).json({ 
          message: errorMessage,
          hint: 'Check your Render dashboard logs for more details.'
        });
      }
    } else {
      res.status(500).json({ message: 'Security system offline: Email service not configured.' });
    }

  } catch (err) {
    console.error('Login request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login-verify', adminSecretCheck, async (req, res) => {
  const ip = (req as any).clientIp || 'Unknown';
  const now = Date.now();

  // Check if IP is blocked
  const attempts = loginAttempts.get(ip);
  if (attempts && attempts.count >= MAX_ATTEMPTS) {
    const timeLeft = BLOCK_TIME - (now - attempts.lastAttempt);
    if (timeLeft > 0) {
      const minutes = Math.ceil(timeLeft / 60000);
      return res.status(429).json({ 
        message: `Too many failed attempts. Your IP is blocked for ${minutes} more minutes.` 
      });
    }
  }

  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Identifier and OTP are required' });
    }

    // Validation for email format if identifier is an email
    if (identifier.includes('@') && !validator.isEmail(identifier)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const admin = await Admin.findOne({
      $or: [{ username: identifier }, { email: identifier }]
    });

    if (!admin) {
      return res.status(401).json({ message: 'Admin not found' });
    }

    if (admin.otp !== otp || !admin.otpExpires || admin.otpExpires < new Date()) {
      const current = loginAttempts.get(ip) || { count: 0, lastAttempt: now };
      current.count += 1;
      current.lastAttempt = now;
      loginAttempts.set(ip, current);

      const remaining = MAX_ATTEMPTS - current.count;
      let msg = 'Invalid or expired OTP';
      if (remaining > 0) {
        msg += `. ${remaining} attempts remaining before 15 min block.`;
      } else {
        msg = 'Too many failed attempts. Your IP is blocked for 15 minutes.';
      }
      return res.status(401).json({ message: msg });
    }

    // Clear OTP
    admin.otp = undefined;
    admin.otpExpires = undefined;
    await admin.save();

    // Success - clear attempts
    loginAttempts.delete(ip);

    const token = jwt.sign({ username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password
app.post('/api/auth/forgot-password', adminSecretCheck, async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: 'A valid email address is required.' });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      // Don't reveal that the email doesn't exist for security
      return res.json({ message: 'If this email exists in our records, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await admin.save();

    // Determine public URL dynamically if APP_URL is default/localhost
    let publicUrl = APP_URL;
    if (publicUrl.includes('localhost') || !process.env.APP_URL) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      publicUrl = `${protocol}://${host}`;
    }
    // Remove trailing slash if exists
    publicUrl = publicUrl.replace(/\/$/, '');

    const resetLink = `${publicUrl}/admin/reset-password/${resetToken}/${process.env.VITE_ADMIN_ACCESS_SECRET}`;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const mailer = getTransporter();
        await mailer.sendMail({
          from: `"Portfolio Security" <${process.env.EMAIL_USER}>`,
          to: admin.email,
          subject: 'Reset Your Admin Password',
          html: `
            <div style="font-family: sans-serif; padding: 40px; background: #f9fafb; border-radius: 20px;">
              <h1 style="color: #ef4444;">Password Reset Request</h1>
              <p>We received a request to reset your admin password. Click the button below to proceed:</p>
              <div style="margin: 30px 0;">
                <a href="${resetLink}" style="display: inline-block; padding: 16px 32px; background: #ef4444; color: white; text-decoration: none; border-radius: 12px; font-weight: bold;">Reset Password</a>
              </div>
              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">This link will expire in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <p style="color: #9ca3af; font-size: 12px;">Copy this link if the button doesn't work: <br/> ${resetLink}</p>
            </div>
          `
        });
        res.json({ message: 'If this email exists in our records, a reset link has been sent.' });
      } catch (mailErr: any) {
        console.error('Reset Password Mail error:', mailErr);
        res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
      }
    } else {
      res.status(500).json({ message: 'Email service not configured.' });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!admin) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    admin.password = await bcrypt.hash(password, 10);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects.map(p => ({ ...p.toObject(), id: p._id })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/projects', authenticate, async (req, res) => {
  try {
    const newProject = new Project(req.body);
    await newProject.save();
    res.status(201).json({ ...newProject.toObject(), id: newProject._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/projects/:id', authenticate, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/projects/:id', authenticate, async (req, res) => {
  try {
    const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedProject) {
      res.json({ ...updatedProject.toObject(), id: updatedProject._id });
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Skills
app.get('/api/skills', async (req, res) => {
  try {
    const skills = await Skill.find();
    res.json(skills.map(s => ({ ...s.toObject(), id: s._id })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/skills', authenticate, async (req, res) => {
  try {
    const newSkill = new Skill(req.body);
    await newSkill.save();
    res.status(201).json({ ...newSkill.toObject(), id: newSkill._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/skills/:id', authenticate, async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/skills/:id', authenticate, async (req, res) => {
  try {
    const updatedSkill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (updatedSkill) {
      res.json({ ...updatedSkill.toObject(), id: updatedSkill._id });
    } else {
      res.status(404).json({ message: 'Skill not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Messages
app.post('/api/messages', async (req, res) => {
  try {
    const { email } = req.body;
    if (email && !validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.status(201).json({ message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/messages', authenticate, async (req, res) => {
  try {
    const messages = await Message.find().sort({ date: -1 });
    res.json(messages.map(m => ({ ...m.toObject(), id: m._id })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/messages/:id', authenticate, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Profile
app.get('/api/profile', async (req, res) => {
  try {
    const profile = await Profile.findOne();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/profile', authenticate, async (req, res) => {
  try {
    const profile = await Profile.findOne();
    if (profile) {
      Object.assign(profile, req.body);
      await profile.save();
    } else {
      const newProfile = new Profile(req.body);
      await newProfile.save();
    }
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Vite Integration
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const profileCount = await Profile.countDocuments();
    if (profileCount === 0) {
      console.log('No profile found. Please create one in the admin dashboard.');
    }

    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Database connection error:', error);
  }
}

startServer();
