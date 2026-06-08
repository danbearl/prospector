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

    // Get the created user with is_admin field
    const user = await dbGet(db, 'SELECT id, username, email, is_admin FROM users WHERE id = ?', [result.lastID]);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: user.is_admin === 1 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin === 1
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
      { userId: user.id, username: user.username, isAdmin: user.is_admin === 1 },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin === 1
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
    req.isAdmin = decoded.isAdmin || false;
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
      req.isAdmin = decoded.isAdmin || false;
    } catch (error) {
      // Token invalid, but continue anyway
    }
  }
  next();
}

// Verify admin role middleware
function verifyAdmin(req, res, next) {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
}

module.exports = {
  register,
  login,
  verifyToken,
  verifyTokenOptional,
  verifyAdmin,
  JWT_SECRET
};

// Made with Bob
