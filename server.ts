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

// -----------------------------------------------------------------

const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    // We'll keep JWT verification but we won't strictly need a user from DB
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// --- API Routes ---
// Simple login for the magic path (called from frontend)
app.post('/api/auth/magic-login', (req, res) => {
  const { secret } = req.body;
  if (secret === process.env.VITE_ADMIN_ACCESS_SECRET) {
    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Invalid secret' });
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
    // Database connection error handled silently
  }
}

startServer();
