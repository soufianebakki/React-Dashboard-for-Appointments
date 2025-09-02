require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Import the shared database pool
const pool = require('./db');

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true,
}));
app.use(express.json());

// Force JSON responses for API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  console.log(`Received ${req.method} request to ${req.originalUrl}`);
  next();
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'soufiane1010';

// Initialize Super Admin
async function initializeSuperAdmin() {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', ['superadmin@gmail.com']);
    if (rows.length === 0) {
      console.log('No superadmin found, creating superadmin...');
      const hashedPassword = await bcrypt.hash('pakosof10', 10);
      const [result] = await pool.execute(
        'INSERT INTO users (name, phone, email, password, role) VALUES (?, ?, ?, ?, ?)',
        ['Super Admin', '+1234567890', 'superadmin@gmail.com', hashedPassword, 'superadmin']
      );
      console.log(`Superadmin created with ID: ${result.insertId}`);
    } else {
      console.log('Superadmin already exists');
    }
  } catch (error) {
    console.error('Error initializing superadmin:', error.stack);
  }
}

// Test database connection and initialize superadmin
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL database');
    connection.release();
    await initializeSuperAdmin();
  } catch (error) {
    console.error('❌ Database connection failed:', error.stack);
  }
}
testDbConnection();

// JWT authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.stack);
    return res.status(403).json({ success: false, error: 'INVALID_TOKEN', message: 'Invalid or expired token' });
  }
};

// Restrict to Superadmin
const restrictToSuperadmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Only superadmin can perform this action' });
  }
  next();
};

// Get all appointments
app.get('/api/appointments', async (req, res) => {
  try {
    console.log('Fetching all appointments from database');
    const [rows] = await pool.execute(
      'SELECT id, full_name, appointment_date, time_slot, phone_number, created_at, statut FROM appointments'
    );
    console.log('Appointments fetched:', rows); // Log the data
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching appointments:', error.stack);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to fetch appointments', details: error.message });
  }
});

// Update appointment status
app.put('/api/appointments/:id', async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { statut } = req.body;

    if (!appointmentId || isNaN(appointmentId)) {
      return res.status(400).json({ success: false, error: 'INVALID_ID', message: 'Invalid appointment ID' });
    }

    if (!statut || !['en attente', 'confirmé', 'annulé'].includes(statut)) {
      return res.status(400).json({ success: false, error: 'INVALID_STATUS', message: 'Status must be en attente, confirmé, or annulé' });
    }

    const [checkResult] = await pool.execute('SELECT id FROM appointments WHERE id = ?', [appointmentId]);
    if (checkResult.length === 0) {
      return res.status(404).json({ success: false, error: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found' });
    }

    await pool.execute('UPDATE appointments SET statut = ? WHERE id = ?', [statut, appointmentId]);
    console.log(`Updated status for appointment ID ${appointmentId} to ${statut}`);
    res.status(200).json({ success: true, message: 'Status updated successfully', appointmentId });
  } catch (error) {
    console.error('Error updating appointment status:', error.stack);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to update status', details: error.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'Email, password, and role are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email, password, or role' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid email, password, or role' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ success: true, message: 'Login successful', token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error.stack);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error', details: error.message });
  }
});

// Create user (no authentication required)
app.post('/api/users', async (req, res) => {
  try {
    const { name, phone, email, password, role } = req.body;
    if (!name || !phone || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'Missing required fields' });
    }

    if (!['admin', 'assistante'].includes(role)) {
      return res.status(400).json({ success: false, error: 'INVALID_ROLE', message: 'Role must be admin or assistante' });
    }

    console.log(`Creating user: ${name}, ${phone}, ${email}, ${role}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, phone, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, phone, email, hashedPassword, role]
    );

    res.status(201).json({ success: true, message: 'User created successfully', userId: result.insertId, user: { name, phone, email, role } });
  } catch (error) {
    console.error('Error creating user:', error.stack);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'DUPLICATE_EMAIL', message: 'Email already exists' });
    }
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Internal server error', details: error.message });
  }
});

// Get all users (no authentication required)
app.get('/api/users', async (req, res) => {
  try {
    console.log('Fetching all users');
    const [rows] = await pool.execute('SELECT id, name, phone, email, role FROM users');
    console.log('Users fetched:', rows);
    res.status(200).json({ success: true, users: rows });
  } catch (error) {
    console.error('Error fetching users:', error.stack);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to fetch users', details: error.message });
  }
});

// Update user (no authentication required)
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, phone, email, password, role } = req.body;
    if (!name || !phone || !email) {
      return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'Missing required fields (name, phone, email)' });
    }

    if (role && !['admin', 'assistante', 'superadmin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'INVALID_ROLE', message: 'Role must be admin, assistante, or superadmin' });
    }

    const [checkResult] = await pool.execute('SELECT id, email FROM users WHERE id = ?', [userId]);
    if (checkResult.length === 0) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User not found' });
    }

    let query = 'UPDATE users SET name = ?, phone = ?, email = ?';
    const params = [name, phone, email];

    if (password && role) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?, role = ?';
      params.push(hashedPassword, role);
    } else if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    } else if (role) {
      query += ', role = ?';
      params.push(role);
    }

    query += ' WHERE id = ?';
    params.push(userId);

    await pool.execute(query, params);
    console.log(`Updated user ID ${userId}`);
    res.status(200).json({ success: true, message: 'User updated successfully', userId });
  } catch (error) {
    console.error('Error updating user:', error.stack);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, error: 'DUPLICATE_EMAIL', message: 'Email already exists' });
    }
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to update user', details: error.message });
  }
});

// Delete user (prevent superadmin deletion by role or email)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ success: false, error: 'INVALID_ID', message: 'Invalid user ID' });
    }

    const [checkResult] = await pool.execute('SELECT id, email, role FROM users WHERE id = ?', [userId]);
    if (checkResult.length === 0) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (checkResult[0].email === 'superadmin@gmail.com' || checkResult[0].role === 'superadmin') {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Cannot delete superadmin user' });
    }

    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    console.log(`Deleted user ID ${userId}`);
    res.status(200).json({ success: true, message: 'User deleted successfully', deletedId: userId });
  } catch (error) {
    console.error('Error deleting user:', error.stack);
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: 'Failed to delete user', details: error.message });
  }
});

// 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'ENDPOINT_NOT_FOUND', message: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, error: 'UNHANDLED_ERROR', message: 'Internal server error', details: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));