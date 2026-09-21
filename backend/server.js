require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for development and demo
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Seed default users if empty (Default Admin + Demo Receiver)
const seedDefaultData = async () => {
  try {
    const adminEmail = 'admin@securepay.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new User({
        name: 'Security Admin',
        email: adminEmail,
        password: 'Admin@123',
        role: 'admin',
        balance: 100000
      });
      await admin.save();
      console.log(`[Seed] Created default admin account: ${adminEmail} / Admin@123`);
    }

    const demoReceiverEmail = 'alex.smith@example.com';
    const existingReceiver = await User.findOne({ email: demoReceiverEmail });
    if (!existingReceiver) {
      const receiver = new User({
        name: 'Alex Smith',
        email: demoReceiverEmail,
        password: 'User@123',
        role: 'user',
        balance: 2500
      });
      await receiver.save();
      console.log(`[Seed] Created demo receiver: ${demoReceiverEmail} (${receiver.accountNumber})`);
    }
  } catch (err) {
    console.error('[Seed Error]', err.message);
  }
};

setTimeout(seedDefaultData, 1000);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date(),
    service: 'SecurePay API',
    detectionEngine: 'Rule-Based Behavioural Engine'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`SecurePay Backend running on http://127.0.0.1:${PORT}`);
  console.log(`Database connected to MongoDB`);
  console.log(`Rule-Based Fraud Detection Service Active`);
  console.log(`====================================================`);
});
