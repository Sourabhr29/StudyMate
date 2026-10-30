const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// ==================== USER MODEL (AUTH) ====================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String }, // Will be hashed
  googleId: { type: String },
  avatar: { type: String, default: '🎓' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ==================== AUTH MIDDLEWARE ====================
const JWT_SECRET = process.env.JWT_SECRET || 'studymate_super_secret_key_2026';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
    req.user = user; // Attach user info to request
    next();
  });
};

// ==================== AUTH ROUTES ====================

// 1. Register (Phone + Password)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ message: 'Mobile number already registered.' });

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = new User({ name, phone, password: hashedPassword });
    await user.save();

    // Generate JWT Token
    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, user: { id: user._id, name: user.name, phone: user.phone, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Login (Phone + Password)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Find User
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'Invalid mobile number or password.' });

    // Check Password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid mobile number or password.' });

    // Generate JWT Token
    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { id: user._id, name: user.name, phone: user.phone, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Google Login
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;

    // Verify Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user if doesn't exist
      user = new User({ name, email, googleId });
      await user.save();
    }

    // Generate JWT Token
    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Google authentication failed.' });
  }
});

// ==================== PROTECTED DATA MODELS ====================
// (Har data ab ek specific User ID se link hoga)

const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Now linked to Auth User
  title: { type: String, required: true },
  description: String,
  date: Date,
  time: String,
  priority: String,
  category: String,
  completed: { type: Boolean, default: false }
});
const Task = mongoose.model('Task', taskSchema);

// ==================== PROTECTED ROUTES ====================
// Notice the 'authenticateToken' middleware. Ab bina login kiye data nahi milega.

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }); // Only fetch MY tasks
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const task = new Task({ ...req.body, userId: req.user.userId }); // Attach MY user ID
    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// (Note: Agar aapko Goals, Notes, Routines bhi protect karne hain, toh unme bhi 'authenticateToken' aur 'req.user.userId' use karein)

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
