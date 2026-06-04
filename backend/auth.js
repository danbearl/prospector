const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Secret key for JWT - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Helper function to promisify database queries
const dbRun = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Register new user
async function register(db, username, password, email = null) {
  try {
    // Check if user already exists
    const existingUser = await dbGet(db, 'SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const result = await dbRun(db, 
      'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
      [username, hashedPassword, email]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.lastID, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      token,
      user: {
        id: result.lastID,
        username,
        email
      }
    };
  } catch (error) {
    throw error;
  }
}

// Login user
async function login(db, username, password) {
  try {
    // Find user
    const user = await dbGet(db, 'SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    };
  } catch (error) {
    throw error;
  }
}

// Verify JWT token middleware
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Verify token without requiring authentication (for checking if logged in)
function verifyTokenOptional(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.userId = decoded.userId;
      req.username = decoded.username;
    } catch (error) {
      // Token invalid, but continue anyway
    }
  }
  next();
}

module.exports = {
  register,
  login,
  verifyToken,
  verifyTokenOptional,
  JWT_SECRET
};

// Made with Bob
