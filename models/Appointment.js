const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient_name: { type: String, required: true },
  appointment_date: { type: Date, required: true },
  duration: { type: Number, required: true },
  doctor_name: { type: String, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled']
  },
  location: { type: String, required: true },
  notes: { type: String }
});

module.exports = mongoose.model('Appointment', appointmentSchema);