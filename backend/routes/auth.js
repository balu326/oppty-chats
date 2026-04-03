import express from 'express';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee.js';
import Message from '../models/Message.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

const requireRole = (...roles) => (req, res, next) => {
  if (!req.employee || !roles.includes(req.employee.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  next();
};

// Generate JWT Token
const generateToken = (employee) => {
  return jwt.sign(
    { 
      id: employee._id, 
      email: employee.email,
      role: employee.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/login - Employee Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find employee by email
    const employee = await Employee.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!employee) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await employee.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(employee);

    // Send response
    res.json({
      success: true,
      token,
      employee: {
        id: employee._id,
        email: employee.email,
        name: employee.name,
        role: employee.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/forgot-password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const employee = await Employee.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!employee) {
      return res.status(404).json({ message: 'Email not found in employee records' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    
    // Save OTP with expiry (10 minutes)
    employee.otp = {
      value: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };
    await employee.save();

    // In production, send email here
    // For now, log OTP to console (remove in production)
    console.log(`OTP for ${email}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP has been sent successfully to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/verify-otp - Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const employee = await Employee.findOne({ 
      email: email.toLowerCase().trim(),
      'otp.value': otp,
      'otp.expiresAt': { $gt: new Date() } // OTP not expired
    });

    if (!employee) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password - Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const employee = await Employee.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update password (will be hashed by pre-save hook)
    employee.password = newPassword;
    employee.otp = undefined; // Clear OTP
    await employee.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/employees - Get all employees (for admin)
router.get('/employees', authMiddleware, async (req, res) => {
  try {
    const employees = await Employee.find()
      .select('-password -otp')
      .populate('group', 'name');
    
    res.json({
      success: true,
      employees
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/employees - Create new employee (Admin/Superadmin only)
router.post('/employees', authMiddleware, requireRole('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase().trim() });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Only admin or superadmin can create employees
    if (role && !['employee', 'admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Create new employee (password will be hashed by pre-save hook)
    const employee = new Employee({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      role: role || 'employee'
    });

    await employee.save();

    res.json({
      success: true,
      message: 'Employee created successfully',
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/all-messages - Get all messages (Superadmin only)
router.get('/all-messages', authMiddleware, requireRole('superadmin'), async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(1000);
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Get all messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
