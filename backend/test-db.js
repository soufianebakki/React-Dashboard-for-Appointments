const pool = require('./db');

async function test() {
  try {
    const [rows] = await pool.execute('SELECT * FROM appointments');
    console.log('Data:', rows);
  } catch (e) {
    console.error('DB test error:', e.stack);
  }
}

test();
