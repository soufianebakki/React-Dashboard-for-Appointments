const express = require('express');
const router = express.Router();

// Import the pool from your shared db.js with correct relative path
const pool = require('../../../../../../../backend/db');

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM appointments');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching appointments:', error.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST new appointment
router.post('/', async (req, res) => {
  try {
    const { appointment_date, time_slot, full_name, phone_number } = req.body;

    // Basic validation
    if (!appointment_date || !time_slot || !full_name || !phone_number) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['appointment_date', 'time_slot', 'full_name', 'phone_number']
      });
    }

    const connection = await pool.getConnection();

    // Check if time slot is already booked on that date
    const [existing] = await connection.query(
      'SELECT id FROM appointments WHERE appointment_date = ? AND time_slot = ?',
      [appointment_date, time_slot]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({
        error: 'Time slot already booked',
        message: 'This time slot is already taken for the selected date'
      });
    }

    // Insert new appointment
    const [result] = await connection.query(
      'INSERT INTO appointments (appointment_date, time_slot, full_name, phone_number) VALUES (?, ?, ?, ?)',
      [appointment_date, time_slot, full_name, phone_number]
    );

    // Retrieve the newly inserted appointment (with created_at)
    const [newAppointmentRows] = await connection.query(
      'SELECT * FROM appointments WHERE id = ?',
      [result.insertId]
    );

    connection.release();

    res.status(201).json({
      success: true,
      data: newAppointmentRows[0]
    });

  } catch (error) {
    console.error('Error creating appointment:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
