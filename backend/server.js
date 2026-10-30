const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// ==================== USER MODEL ====================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
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
    req.user = user;
    next();
  });
};

// ==================== AUTH ROUTES ====================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    const existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ message: 'Mobile number already registered.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ name, phone, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, phone: user.phone, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) return res.status(400).json({ message: 'Invalid mobile number or password.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid mobile number or password.' });

    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, phone: user.phone, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const { sub: googleId, email, name } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ name, email, googleId });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Google authentication failed.' });
  }
});

// ==================== PROTECTED ROUTES (Tasks) ====================
const taskSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  date: Date,
  time: String,
  priority: String,
  category: String,
  completed: { type: Boolean, default: false }
});
const Task = mongoose.model('Task', taskSchema);

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const task = new Task({ ...req.body, userId: req.user.userId });
    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
