import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import 'express-async-errors';
import path from 'path';
import { connectDB } from './db.js';

// Import routes
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import messageRoutes from './routes/messages.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);

// Simple Message APIs (for testing)
app.post('/send-message', async (req, res) => {
  try {
    const db = await connectDB();
    const messages = db.collection('messages');

    const { sender, text } = req.body;

    const result = await messages.insertOne({
      sender,
      text,
      time: new Date()
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const db = await connectDB();
    const messages = db.collection('messages');

    const data = await messages.find().toArray();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'TheOpptyTeam Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
