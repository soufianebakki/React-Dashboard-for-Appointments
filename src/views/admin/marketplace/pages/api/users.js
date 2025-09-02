import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  // Set response headers
  res.setHeader('Content-Type', 'application/json');

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      error: `Method ${req.method} not allowed`,
      allowedMethods: ['POST']
    });
  }

  console.log('[API] Received request to create user:', req.body);

  try {
    // Validate request body
    const { name, phone, email } = req.body;
    
    if (!name || !phone || !email) {
      console.error('[API] Validation failed - missing fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['name', 'phone', 'email'],
        received: { name, phone, email }
      });
    }

    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'sounny',
      connectTimeout: 10000
    });

    console.log('[API] Database connection established');

    // Execute insert query
    const [result] = await connection.execute(
      'INSERT INTO users (name, phone, email) VALUES (?, ?, ?)',
      [name, phone, email]
    );

    // Close connection
    await connection.end();
    console.log('[API] User created with ID:', result.insertId);

    // Successful response
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: result.insertId,
      user: { name, phone, email },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API] Error:', error);

    // Handle specific errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Email already exists',
        suggestion: 'Please use a different emaila address'
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Database connection failed',
        message: 'Could not connect to MySQL server'
      });
    }

    // Generic error response
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}