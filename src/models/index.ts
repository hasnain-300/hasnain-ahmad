import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: String,
  tags: [String],
  link: String,
  github: String,
}, { timestamps: true });

export const Project = mongoose.model('Project', projectSchema);

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Frontend', 'Backend', 'Database', 'Tools'] 
  },
  icon: { type: String, default: "" },
}, { timestamps: true });

export const Skill = mongoose.model('Skill', skillSchema);

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema);

const profileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  bio: { type: String, required: true },
  aboutText: { type: String, default: "" },
  experienceYears: { type: String, default: "" },
  projectsCompleted: { type: String, default: "" },
  clientSatisfaction: { type: String, default: "" },
  aboutImage1: { type: String, default: "" },
  aboutImage2: { type: String, default: "" },
  image: String,
  github: String,
  linkedin: String,
  email: String,
  twitter: String,
  facebook: String,
  instagram: String,
  whatsapp: String,
}, { timestamps: true });

export const Profile = mongoose.model('Profile', profileSchema);

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  otp: { type: String },
  otpExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

export const Admin = mongoose.model('Admin', adminSchema);
