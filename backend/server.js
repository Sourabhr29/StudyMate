const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Home route (for testing)
app.get('/', (req, res) => {
  res.json({ message: 'StudyMate API is running' });
});

// --- Task Model ---
const taskSchema = new mongoose.Schema({
  userId: { type: String, default: 'defaultUser' },
  title: { type: String, required: true },
  description: String,
  date: { type: Date, default: Date.now },
  time: String,
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  category: { type: String, default: 'Study' },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// --- Task Routes ---

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.query.userId || 'defaultUser' });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a task
app.post('/api/tasks', async (req, res) => {
  try {
    const task = new Task({
      userId: req.body.userId || 'defaultUser',
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      time: req.body.time,
      priority: req.body.priority,
      category: req.body.category
    });
    const saved = await task.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a task (e.g., mark complete)
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// --- Goal Model ---
const goalSchema = new mongoose.Schema({
  userId: { type: String, default: 'defaultUser' },
  title: { type: String, required: true },
  desc: String,
  deadline: String,
  dailyTarget: Number,
  color: String,
  milestones: [{ id: String, title: String, done: Boolean }],
  createdAt: { type: Date, default: Date.now }
});
const Goal = mongoose.model('Goal', goalSchema);

// --- Routine Model ---
const routineSchema = new mongoose.Schema({
  userId: { type: String, default: 'defaultUser' },
  title: { type: String, required: true },
  start: String,
  end: String,
  icon: String,
  category: String,
  days: [Number],
  createdAt: { type: Date, default: Date.now }
});
const Routine = mongoose.model('Routine', routineSchema);

// --- Note Model ---
const noteSchema = new mongoose.Schema({
  userId: { type: String, default: 'defaultUser' },
  title: { type: String, required: true },
  content: String,
  pinned: { type: Boolean, default: false },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', noteSchema);

// ==================== GOALS ROUTES ====================
app.get('/api/goals', async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.query.userId || 'defaultUser' });
    res.json(goals);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/goals', async (req, res) => {
  try {
    const goal = new Goal({ ...req.body, userId: req.body.userId || 'defaultUser' });
    const saved = await goal.save();
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ==================== ROUTINES ROUTES ====================
app.get('/api/routines', async (req, res) => {
  try {
    const routines = await Routine.find({ userId: req.query.userId || 'defaultUser' });
    res.json(routines);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/routines', async (req, res) => {
  try {
    const routine = new Routine({ ...req.body, userId: req.body.userId || 'defaultUser' });
    const saved = await routine.save();
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// ==================== NOTES ROUTES ====================
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.query.userId || 'defaultUser' });
    res.json(notes);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/notes', async (req, res) => {
  try {
    const note = new Note({ ...req.body, userId: req.body.userId || 'defaultUser' });
    const saved = await note.save();
    res.status(201).json(saved);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
