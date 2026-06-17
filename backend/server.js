const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const { register, login, verifyToken, verifyAdmin } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Helper function to promisify database queries
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const normalizeTagName = (name = '') => name.trim().replace(/\s+/g, ' ');

const getTagsForCompany = async (companyId) => {
  return dbAll(`
    SELECT t.id, t.name
    FROM tags t
    JOIN company_tags ct ON t.id = ct.tag_id
    WHERE ct.company_id = ?
    ORDER BY t.name
  `, [companyId]);
};

const getTagsForContact = async (contactId) => {
  return dbAll(`
    SELECT t.id, t.name
    FROM tags t
    JOIN contact_tags ct ON t.id = ct.tag_id
    WHERE ct.contact_id = ?
    ORDER BY t.name
  `, [contactId]);
};

const ensureTagsExist = async (userId, tagIds = [], newTags = []) => {
  const resolvedTagIds = new Set();

  for (const tagId of tagIds || []) {
    const existingTag = await dbGet('SELECT id FROM tags WHERE id = ? AND user_id = ?', [tagId, userId]);
    if (existingTag) {
      resolvedTagIds.add(existingTag.id);
    }
  }

  for (const rawName of newTags || []) {
    const normalizedName = normalizeTagName(rawName);
    if (!normalizedName) continue;

    let tag = await dbGet('SELECT id FROM tags WHERE user_id = ? AND LOWER(name) = LOWER(?)', [userId, normalizedName]);

    if (!tag) {
      const result = await dbRun(
        'INSERT INTO tags (user_id, name, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [userId, normalizedName]
      );
      tag = { id: result.lastID };
    }

    resolvedTagIds.add(tag.id);
  }

  return Array.from(resolvedTagIds);
};

const assignTagsToCompany = async (companyId, userId, tagIds = [], newTags = []) => {
  const resolvedTagIds = await ensureTagsExist(userId, tagIds, newTags);

  await dbRun('DELETE FROM company_tags WHERE company_id = ?', [companyId]);

  for (const tagId of resolvedTagIds) {
    await dbRun(
      'INSERT INTO company_tags (company_id, tag_id) VALUES (?, ?)',
      [companyId, tagId]
    );
  }

  return getTagsForCompany(companyId);
};

const assignTagsToContact = async (contactId, userId, tagIds = [], newTags = []) => {
  const resolvedTagIds = await ensureTagsExist(userId, tagIds, newTags);

  await dbRun('DELETE FROM contact_tags WHERE contact_id = ?', [contactId]);

  for (const tagId of resolvedTagIds) {
    await dbRun(
      'INSERT INTO contact_tags (contact_id, tag_id) VALUES (?, ?)',
      [contactId, tagId]
    );
  }

  return getTagsForContact(contactId);
};

// ==================== AUTHENTICATION ROUTES ====================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await register(db, username, password, email);
    res.status(201).json(result);
  } catch (err) {
    if (err.message === 'Username already exists') {
      res.status(409).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await login(db, username, password);
    res.json(result);
  } catch (err) {
    if (err.message === 'Invalid username or password') {
      res.status(401).json({ error: err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Verify token (check if user is authenticated)
app.get('/api/auth/verify', verifyToken, async (req, res) => {
  try {
    // Get user details including is_admin
    const user = await dbGet(
      'SELECT id, username, email, is_admin FROM users WHERE id = ?',
      [req.userId]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin === 1
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout (client-side token removal, but endpoint for consistency)
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get user profile
app.get('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [req.userId]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile (requires current password)
app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const { currentPassword, username, email } = req.body;
    
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }

    // Verify current password
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update user information
    await dbRun(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [username || user.username, email, req.userId]
    );

    const updatedUser = await dbGet(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [req.userId]
    );
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// Change password (requires current password)
app.post('/api/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await dbRun(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.userId]
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user account (requires current password)
app.delete('/api/auth/account', verifyToken, async (req, res) => {
  try {
    const { currentPassword } = req.body;
    
    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required to delete account' });
    }

    // Verify current password
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Delete user (CASCADE will delete all associated data)
    await dbRun('DELETE FROM users WHERE id = ?', [req.userId]);

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Promote user to admin (admin only)
app.post('/api/admin/promote-user', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Verify user exists
    const user = await dbGet('SELECT id, username, is_admin FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.is_admin === 1) {
      return res.status(400).json({ error: 'User is already an admin' });
    }
    
    // Promote user to admin
    await dbRun('UPDATE users SET is_admin = 1 WHERE id = ?', [userId]);
    
    console.log(`Admin promotion: User ${user.username} (ID: ${userId}) promoted to admin by ${req.username} (ID: ${req.userId})`);
    
    res.json({
      success: true,
      message: `User ${user.username} has been promoted to admin`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Demote user from admin (admin only)
app.post('/api/admin/demote-user', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Prevent demoting yourself
    if (userId === req.userId) {
      return res.status(400).json({ error: 'You cannot demote yourself' });
    }
    
    // Verify user exists
    const user = await dbGet('SELECT id, username, is_admin FROM users WHERE id = ?', [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.is_admin !== 1) {
      return res.status(400).json({ error: 'User is not an admin' });
    }
    
    // Check if this is the last admin
    const adminCount = await dbGet('SELECT COUNT(*) as count FROM users WHERE is_admin = 1');
    if (adminCount.count <= 1) {
      return res.status(400).json({ error: 'Cannot demote the last admin. Promote another user first.' });
    }
    
    // Demote user from admin
    await dbRun('UPDATE users SET is_admin = 0 WHERE id = ?', [userId]);
    
    console.log(`Admin demotion: User ${user.username} (ID: ${userId}) demoted from admin by ${req.username} (ID: ${req.userId})`);
    
    res.json({
      success: true,
      message: `User ${user.username} has been demoted from admin`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Emergency admin promotion (requires super admin key, NO admin auth required)
// This endpoint can be used even when no admins exist in the system
app.post('/api/admin/emergency-promote', async (req, res) => {
  try {
    const { username, superAdminKey } = req.body;
    
    if (!username || !superAdminKey) {
      return res.status(400).json({ error: 'Username and super admin key are required' });
    }
    
    // Verify super admin key
    const expectedKey = process.env.SUPER_ADMIN_KEY;
    if (!expectedKey) {
      return res.status(500).json({ error: 'Super admin key not configured on server' });
    }
    
    if (superAdminKey !== expectedKey) {
      console.warn(`⚠️  FAILED EMERGENCY PROMOTION ATTEMPT for username: ${username} - Invalid super admin key`);
      return res.status(403).json({ error: 'Invalid super admin key' });
    }
    
    // Verify user exists
    const user = await dbGet('SELECT id, username, is_admin FROM users WHERE username = ?', [username]);
    
    if (!user) {
      console.warn(`⚠️  FAILED EMERGENCY PROMOTION ATTEMPT - User not found: ${username}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.is_admin === 1) {
      return res.status(400).json({ error: 'User is already an admin' });
    }
    
    // Promote user to admin
    await dbRun('UPDATE users SET is_admin = 1 WHERE id = ?', [user.id]);
    
    console.log(`🚨 EMERGENCY PROMOTION: User ${user.username} (ID: ${user.id}) promoted to admin using super admin key`);
    
    res.json({
      success: true,
      message: `User ${user.username} has been promoted to admin via emergency procedure`
    });
  } catch (err) {
    console.error('Emergency promotion error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all users with statistics (admin only)
app.get('/api/admin/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await dbAll(
      'SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC'
    );
    
    // Get statistics for each user
    for (let i = 0; i < users.length; i++) {
      const userId = users[i].id;
      
      // Count companies
      const companyCount = await dbGet(
        'SELECT COUNT(*) as count FROM companies WHERE user_id = ?',
        [userId]
      );
      
      // Count contacts
      const contactCount = await dbGet(
        'SELECT COUNT(*) as count FROM contacts WHERE user_id = ?',
        [userId]
      );
      
      // Count outreach
      const outreachCount = await dbGet(
        'SELECT COUNT(*) as count FROM outreach_history WHERE user_id = ?',
        [userId]
      );
      
      // Count campaigns
      const campaignCount = await dbGet(
        'SELECT COUNT(*) as count FROM campaigns WHERE user_id = ?',
        [userId]
      );
      
      users[i].stats = {
        companies: companyCount.count,
        contacts: contactCount.count,
        outreach: outreachCount.count,
        campaigns: campaignCount.count
      };
    }
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reassign user data (admin only)
app.post('/api/admin/reassign-user-data', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    
    if (!fromUserId || !toUserId) {
      return res.status(400).json({ error: 'Both fromUserId and toUserId are required' });
    }
    
    if (fromUserId === toUserId) {
      return res.status(400).json({ error: 'Cannot reassign to the same user' });
    }
    
    // Verify both users exist
    const fromUser = await dbGet('SELECT id, username FROM users WHERE id = ?', [fromUserId]);
    const toUser = await dbGet('SELECT id, username FROM users WHERE id = ?', [toUserId]);
    
    if (!fromUser) {
      return res.status(404).json({ error: 'Source user not found' });
    }
    
    if (!toUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }
    
    // Reassign all data
    await dbRun('UPDATE companies SET user_id = ? WHERE user_id = ?', [toUserId, fromUserId]);
    await dbRun('UPDATE contacts SET user_id = ? WHERE user_id = ?', [toUserId, fromUserId]);
    await dbRun('UPDATE contact_relationships SET user_id = ? WHERE user_id = ?', [toUserId, fromUserId]);
    await dbRun('UPDATE outreach_history SET user_id = ? WHERE user_id = ?', [toUserId, fromUserId]);
    await dbRun('UPDATE campaigns SET user_id = ? WHERE user_id = ?', [toUserId, fromUserId]);
    
    res.json({
      success: true,
      message: `Successfully reassigned all data from ${fromUser.username} to ${toUser.username}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== TAGS ROUTES ====================

const buildContactsQuery = (userId, query = {}) => {
  const {
    search = '',
    company_id = '',
    tag_ids = '',
    tag_mode = 'any',
    outreach_start = '',
    outreach_end = '',
    outreach_presence = 'any',
    sort_by = 'name',
    sort_order = 'asc'
  } = query;

  const params = [userId];
  const whereClauses = ['c.user_id = ?'];

  if (search.trim()) {
    whereClauses.push('(LOWER(c.first_name) LIKE ? OR LOWER(c.last_name) LIKE ? OR LOWER(c.first_name || " " || c.last_name) LIKE ?)');
    const searchValue = `%${search.trim().toLowerCase()}%`;
    params.push(searchValue, searchValue, searchValue);
  }

  if (company_id) {
    whereClauses.push('c.company_id = ?');
    params.push(company_id);
  }

  const parsedTagIds = String(tag_ids)
    .split(',')
    .map((id) => parseInt(id, 10))
    .filter((id) => !Number.isNaN(id));

  if (parsedTagIds.length > 0) {
    const placeholders = parsedTagIds.map(() => '?').join(', ');
    if (tag_mode === 'all') {
      whereClauses.push(`
        c.id IN (
          SELECT ct.contact_id
          FROM contact_tags ct
          JOIN tags t ON t.id = ct.tag_id
          WHERE t.user_id = ? AND ct.tag_id IN (${placeholders})
          GROUP BY ct.contact_id
          HAVING COUNT(DISTINCT ct.tag_id) = ?
        )
      `);
      params.push(userId, ...parsedTagIds, parsedTagIds.length);
    } else {
      whereClauses.push(`
        c.id IN (
          SELECT ct.contact_id
          FROM contact_tags ct
          JOIN tags t ON t.id = ct.tag_id
          WHERE t.user_id = ? AND ct.tag_id IN (${placeholders})
        )
      `);
      params.push(userId, ...parsedTagIds);
    }
  }

  const outreachDateClauses = [];
  const outreachDateParams = [];

  if (outreach_start) {
    outreachDateClauses.push('DATE(oh.outreach_date) >= DATE(?)');
    outreachDateParams.push(outreach_start);
  }

  if (outreach_end) {
    outreachDateClauses.push('DATE(oh.outreach_date) <= DATE(?)');
    outreachDateParams.push(outreach_end);
  }

  if (outreach_presence === 'has') {
    whereClauses.push(`
      EXISTS (
        SELECT 1
        FROM outreach_history oh
        WHERE oh.contact_id = c.id
          AND oh.user_id = c.user_id
          ${outreachDateClauses.length ? `AND ${outreachDateClauses.join(' AND ')}` : ''}
      )
    `);
    params.push(...outreachDateParams);
  } else if (outreach_presence === 'none') {
    whereClauses.push(`
      NOT EXISTS (
        SELECT 1
        FROM outreach_history oh
        WHERE oh.contact_id = c.id
          AND oh.user_id = c.user_id
          ${outreachDateClauses.length ? `AND ${outreachDateClauses.join(' AND ')}` : ''}
      )
    `);
    params.push(...outreachDateParams);
  }

  const sortMap = {
    name: 'LOWER(c.last_name) ASC, LOWER(c.first_name) ASC',
    company: 'LOWER(COALESCE(co.name, "")) ASC, LOWER(c.last_name) ASC, LOWER(c.first_name) ASC',
    created_at: 'c.created_at ASC',
    last_outreach: 'last_outreach_date ASC NULLS FIRST, LOWER(c.last_name) ASC, LOWER(c.first_name) ASC'
  };

  const descendingSortMap = {
    name: 'LOWER(c.last_name) DESC, LOWER(c.first_name) DESC',
    company: 'LOWER(COALESCE(co.name, "")) DESC, LOWER(c.last_name) DESC, LOWER(c.first_name) DESC',
    created_at: 'c.created_at DESC',
    last_outreach: 'last_outreach_date DESC NULLS LAST, LOWER(c.last_name) ASC, LOWER(c.first_name) ASC'
  };

  const normalizedSortBy = Object.keys(sortMap).includes(sort_by) ? sort_by : 'name';
  const normalizedSortOrder = String(sort_order).toLowerCase() === 'desc' ? 'desc' : 'asc';
  const orderByClause = normalizedSortOrder === 'desc'
    ? descendingSortMap[normalizedSortBy]
    : sortMap[normalizedSortBy];

  const sql = `
    SELECT c.*,
           co.name as company_name,
           (
             SELECT MAX(oh.outreach_date)
             FROM outreach_history oh
             WHERE oh.contact_id = c.id AND oh.user_id = c.user_id
           ) as last_outreach_date
    FROM contacts c
    LEFT JOIN companies co ON c.company_id = co.id
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY ${orderByClause}
  `;

  return { sql, params };
};

// Get all tags (filtered by user)
app.get('/api/tags', verifyToken, async (req, res) => {
  try {
    const tags = await dbAll(`
      SELECT t.*,
             (SELECT COUNT(*) FROM company_tags ct WHERE ct.tag_id = t.id) as company_count,
             (SELECT COUNT(*) FROM contact_tags ct WHERE ct.tag_id = t.id) as contact_count
      FROM tags t
      WHERE t.user_id = ?
      ORDER BY t.name
    `, [req.userId]);
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create tag (filtered by user)
app.post('/api/tags', verifyToken, async (req, res) => {
  try {
    const normalizedName = normalizeTagName(req.body.name);

    if (!normalizedName) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const existingTag = await dbGet(
      'SELECT * FROM tags WHERE user_id = ? AND LOWER(name) = LOWER(?)',
      [req.userId, normalizedName]
    );

    if (existingTag) {
      return res.json(existingTag);
    }

    const result = await dbRun(
      'INSERT INTO tags (user_id, name, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [req.userId, normalizedName]
    );
    const tag = await dbGet('SELECT * FROM tags WHERE id = ?', [result.lastID]);
    res.status(201).json(tag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update tag (filtered by user)
app.put('/api/tags/:id', verifyToken, async (req, res) => {
  try {
    const normalizedName = normalizeTagName(req.body.name);

    if (!normalizedName) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const duplicateTag = await dbGet(
      'SELECT id FROM tags WHERE user_id = ? AND LOWER(name) = LOWER(?) AND id != ?',
      [req.userId, normalizedName, req.params.id]
    );

    if (duplicateTag) {
      return res.status(409).json({ error: 'A tag with this name already exists' });
    }

    await dbRun(
      'UPDATE tags SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [normalizedName, req.params.id, req.userId]
    );

    const tag = await dbGet('SELECT * FROM tags WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(tag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete tag (filtered by user)
app.delete('/api/tags/:id', verifyToken, async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM tags WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json({ message: 'Tag deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== COMPANIES ROUTES ====================

// Get all companies (filtered by user)
app.get('/api/companies', verifyToken, async (req, res) => {
  try {
    const companies = await dbAll('SELECT * FROM companies WHERE user_id = ? ORDER BY name', [req.userId]);

    for (let i = 0; i < companies.length; i++) {
      companies[i].tags = await getTagsForCompany(companies[i].id);
    }

    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single company (filtered by user)
app.get('/api/companies/:id', verifyToken, async (req, res) => {
  try {
    const company = await dbGet('SELECT * FROM companies WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    company.tags = await getTagsForCompany(company.id);
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create company (with user_id)
app.post('/api/companies', verifyToken, async (req, res) => {
  try {
    const { name, industry, website, location, territory, notes, tag_ids, new_tags } = req.body;
    const result = await dbRun(
      'INSERT INTO companies (user_id, name, industry, website, location, territory, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, name, industry, website, location, territory, notes]
    );
    const company = await dbGet('SELECT * FROM companies WHERE id = ?', [result.lastID]);
    company.tags = await assignTagsToCompany(company.id, req.userId, tag_ids, new_tags);
    res.status(201).json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update company (filtered by user)
app.put('/api/companies/:id', verifyToken, async (req, res) => {
  try {
    const { name, industry, website, location, territory, notes, tag_ids, new_tags } = req.body;
    await dbRun(
      'UPDATE companies SET name = ?, industry = ?, website = ?, location = ?, territory = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [name, industry, website, location, territory, notes, req.params.id, req.userId]
    );
    const company = await dbGet('SELECT * FROM companies WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    company.tags = await assignTagsToCompany(company.id, req.userId, tag_ids, new_tags);
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete company (filtered by user)
app.delete('/api/companies/:id', verifyToken, async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM companies WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json({ message: 'Company deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CONTACTS ROUTES ====================

// Get all contacts with company info (filtered by user)
app.get('/api/contacts', verifyToken, async (req, res) => {
  try {
    const { sql, params } = buildContactsQuery(req.userId, req.query);
    const contacts = await dbAll(sql, params);

    for (let i = 0; i < contacts.length; i++) {
      contacts[i].tags = await getTagsForContact(contacts[i].id);
    }

    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get contacts by company (filtered by user)
app.get('/api/companies/:id/contacts', verifyToken, async (req, res) => {
  try {
    const contacts = await dbAll(
      'SELECT * FROM contacts WHERE company_id = ? AND user_id = ? ORDER BY last_name, first_name',
      [req.params.id, req.userId]
    );
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single contact (filtered by user)
app.get('/api/contacts/:id', verifyToken, async (req, res) => {
  try {
    const contact = await dbGet(`
      SELECT c.*, co.name as company_name
      FROM contacts c
      LEFT JOIN companies co ON c.company_id = co.id
      WHERE c.id = ? AND c.user_id = ?
    `, [req.params.id, req.userId]);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    contact.tags = await getTagsForContact(contact.id);
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create contact (with user_id)
app.post('/api/contacts', verifyToken, async (req, res) => {
  try {
    const { company_id, first_name, last_name, position, influence_level, lead_status, email, phone, linkedin, notes, tag_ids, new_tags } = req.body;
    const result = await dbRun(
      'INSERT INTO contacts (user_id, company_id, first_name, last_name, position, influence_level, lead_status, email, phone, linkedin, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, company_id, first_name, last_name, position, influence_level, lead_status || 'Potential Lead', email, phone, linkedin, notes]
    );
    const contact = await dbGet('SELECT * FROM contacts WHERE id = ?', [result.lastID]);
    contact.tags = await assignTagsToContact(contact.id, req.userId, tag_ids, new_tags);
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update contact (filtered by user)
app.put('/api/contacts/:id', verifyToken, async (req, res) => {
  try {
    const { company_id, first_name, last_name, position, influence_level, lead_status, email, phone, linkedin, notes, tag_ids, new_tags } = req.body;
    await dbRun(
      'UPDATE contacts SET company_id = ?, first_name = ?, last_name = ?, position = ?, influence_level = ?, lead_status = ?, email = ?, phone = ?, linkedin = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [company_id, first_name, last_name, position, influence_level, lead_status, email, phone, linkedin, notes, req.params.id, req.userId]
    );
    const contact = await dbGet('SELECT * FROM contacts WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    contact.tags = await assignTagsToContact(contact.id, req.userId, tag_ids, new_tags);
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete contact (filtered by user)
app.delete('/api/contacts/:id', verifyToken, async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM contacts WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CONTACT RELATIONSHIPS ROUTES ====================

// Get relationships for a contact (filtered by user)
app.get('/api/contacts/:id/relationships', verifyToken, async (req, res) => {
  try {
    const relationships = await dbAll(`
      SELECT cr.*,
             c.first_name as related_first_name,
             c.last_name as related_last_name,
             c.position as related_position,
             co.name as related_company_name
      FROM contact_relationships cr
      JOIN contacts c ON cr.related_contact_id = c.id
      LEFT JOIN companies co ON c.company_id = co.id
      WHERE cr.contact_id = ? AND cr.user_id = ?
    `, [req.params.id, req.userId]);
    res.json(relationships);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create relationship (with user_id)
app.post('/api/contacts/:id/relationships', verifyToken, async (req, res) => {
  try {
    const { related_contact_id, relationship_type, notes } = req.body;
    const result = await dbRun(
      'INSERT INTO contact_relationships (user_id, contact_id, related_contact_id, relationship_type, notes) VALUES (?, ?, ?, ?, ?)',
      [req.userId, req.params.id, related_contact_id, relationship_type, notes]
    );
    const relationship = await dbGet('SELECT * FROM contact_relationships WHERE id = ?', [result.lastID]);
    res.status(201).json(relationship);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete relationship (filtered by user)
app.delete('/api/relationships/:id', verifyToken, async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM contact_relationships WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    res.json({ message: 'Relationship deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== CAMPAIGNS ROUTES ====================

// Get all campaigns (filtered by user)
app.get('/api/campaigns', verifyToken, async (req, res) => {
  try {
    const campaigns = await dbAll('SELECT * FROM campaigns WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single campaign (filtered by user)
app.get('/api/campaigns/:id', verifyToken, async (req, res) => {
  try {
    const campaign = await dbGet('SELECT * FROM campaigns WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create campaign (with user_id)
app.post('/api/campaigns', verifyToken, async (req, res) => {
  try {
    const { name, description, start_date, end_date, status } = req.body;
    const result = await dbRun(
      'INSERT INTO campaigns (user_id, name, description, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, name, description, start_date, end_date, status || 'Active']
    );
    const campaign = await dbGet('SELECT * FROM campaigns WHERE id = ?', [result.lastID]);
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update campaign (filtered by user)
app.put('/api/campaigns/:id', verifyToken, async (req, res) => {
  try {
    const { name, description, start_date, end_date, status } = req.body;
    await dbRun(
      'UPDATE campaigns SET name = ?, description = ?, start_date = ?, end_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [name, description, start_date, end_date, status, req.params.id, req.userId]
    );
    const campaign = await dbGet('SELECT * FROM campaigns WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete campaign (filtered by user)
app.delete('/api/campaigns/:id', verifyToken, async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM campaigns WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get campaigns for an outreach record
app.get('/api/outreach/:id/campaigns', verifyToken, async (req, res) => {
  try {
    const campaigns = await dbAll(`
      SELECT c.*
      FROM campaigns c
      JOIN outreach_campaigns oc ON c.id = oc.campaign_id
      JOIN outreach_history oh ON oc.outreach_id = oh.id
      WHERE oh.id = ? AND oh.user_id = ?
    `, [req.params.id, req.userId]);
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all outreach for a specific campaign
app.get('/api/campaigns/:id/outreach', verifyToken, async (req, res) => {
  try {
    const outreach = await dbAll(`
      SELECT 
        oh.*,
        co.first_name,
        co.last_name,
        co.email,
        comp.name as company_name
      FROM outreach_history oh
      JOIN outreach_campaigns oc ON oh.id = oc.outreach_id
      JOIN campaigns c ON oc.campaign_id = c.id
      JOIN contacts co ON oh.contact_id = co.id
      LEFT JOIN companies comp ON co.company_id = comp.id
      WHERE c.id = ? AND c.user_id = ?
      ORDER BY oh.outreach_date DESC
    `, [req.params.id, req.userId]);
    res.json(outreach);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== OUTREACH HISTORY ROUTES ====================

// Get outreach history for a contact (filtered by user)
app.get('/api/contacts/:id/outreach', verifyToken, async (req, res) => {
  try {
    const outreach = await dbAll(
      'SELECT * FROM outreach_history WHERE contact_id = ? AND user_id = ? ORDER BY outreach_date DESC',
      [req.params.id, req.userId]
    );
    res.json(outreach);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all outreach history (filtered by user) with campaigns
app.get('/api/outreach', verifyToken, async (req, res) => {
  try {
    const outreach = await dbAll(`
      SELECT oh.*,
             c.first_name,
             c.last_name,
             co.name as company_name
      FROM outreach_history oh
      JOIN contacts c ON oh.contact_id = c.id
      LEFT JOIN companies co ON c.company_id = co.id
      WHERE oh.user_id = ?
      ORDER BY oh.outreach_date DESC
    `, [req.userId]);
    
    // Get campaigns for each outreach
    for (let i = 0; i < outreach.length; i++) {
      const campaigns = await dbAll(`
        SELECT c.id, c.name
        FROM campaigns c
        JOIN outreach_campaigns oc ON c.id = oc.campaign_id
        WHERE oc.outreach_id = ?
      `, [outreach[i].id]);
      outreach[i].campaigns = campaigns;
    }
    
    res.json(outreach);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard follow-up feed (filtered by user)
app.get('/api/dashboard/follow-ups', verifyToken, async (req, res) => {
  try {
    const followUps = await dbAll(`
      SELECT oh.id,
             oh.contact_id,
             oh.outreach_type,
             oh.outreach_date,
             oh.subject,
             oh.outcome,
             oh.follow_up_date,
             c.first_name,
             c.last_name,
             co.name as company_name
      FROM outreach_history oh
      JOIN contacts c ON oh.contact_id = c.id
      LEFT JOIN companies co ON c.company_id = co.id
      WHERE oh.user_id = ?
        AND oh.follow_up_date IS NOT NULL
      ORDER BY oh.follow_up_date ASC, oh.outreach_date DESC
    `, [req.userId]);

    const today = new Date().toISOString().split('T')[0];
    const upcoming = [];
    const pastDue = [];

    followUps.forEach((followUp) => {
      const followUpDate = String(followUp.follow_up_date).split('T')[0];

      if (followUpDate < today) {
        pastDue.push(followUp);
      } else {
        upcoming.push(followUp);
      }
    });

    res.json({ upcoming, pastDue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Close a follow-up without deleting outreach history
app.put('/api/outreach/:id/close-follow-up', verifyToken, async (req, res) => {
  try {
    await dbRun(
      'UPDATE outreach_history SET follow_up_date = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );

    const outreach = await dbGet('SELECT * FROM outreach_history WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!outreach) {
      return res.status(404).json({ error: 'Outreach record not found' });
    }

    res.json({ success: true, outreach });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create outreach record (with user_id and campaign assignments)
app.post('/api/contacts/:id/outreach', verifyToken, async (req, res) => {
  try {
    const { outreach_type, outreach_date, subject, notes, outcome, follow_up_date, campaign_ids, new_campaign } = req.body;
    
    // Create the outreach record
    const result = await dbRun(
      'INSERT INTO outreach_history (user_id, contact_id, outreach_type, outreach_date, subject, notes, outcome, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, req.params.id, outreach_type, outreach_date, subject, notes, outcome, follow_up_date]
    );
    const outreachId = result.lastID;
    
    // Handle new campaign creation if provided
    let newCampaignId = null;
    if (new_campaign && new_campaign.name) {
      const campaignResult = await dbRun(
        'INSERT INTO campaigns (user_id, name, description, status) VALUES (?, ?, ?, ?)',
        [req.userId, new_campaign.name, new_campaign.description || '', 'Active']
      );
      newCampaignId = campaignResult.lastID;
    }
    
    // Link outreach to campaigns
    const campaignIdsToLink = [...(campaign_ids || [])];
    if (newCampaignId) {
      campaignIdsToLink.push(newCampaignId);
    }
    
    for (const campaignId of campaignIdsToLink) {
      await dbRun(
        'INSERT INTO outreach_campaigns (outreach_id, campaign_id) VALUES (?, ?)',
        [outreachId, campaignId]
      );
    }
    
    // Get the created outreach with campaigns
    const outreach = await dbGet('SELECT * FROM outreach_history WHERE id = ?', [outreachId]);
    const campaigns = await dbAll(`
      SELECT c.*
      FROM campaigns c
      JOIN outreach_campaigns oc ON c.id = oc.campaign_id
      WHERE oc.outreach_id = ?
    `, [outreachId]);
    
    res.status(201).json({ ...outreach, campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update outreach record (filtered by user)
app.put('/api/outreach/:id', verifyToken, async (req, res) => {
  try {
    const { outreach_type, outreach_date, subject, notes, outcome, follow_up_date } = req.body;
    await dbRun(
      'UPDATE outreach_history SET outreach_type = ?, outreach_date = ?, subject = ?, notes = ?, outcome = ?, follow_up_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [outreach_type, outreach_date, subject, notes, outcome, follow_up_date, req.params.id, req.userId]
    );
    const outreach = await dbGet('SELECT * FROM outreach_history WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (!outreach) {
      return res.status(404).json({ error: 'Outreach record not found' });
    }
    res.json(outreach);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete outreach record (filtered by user)
app.delete('/api/outreach/:id', verifyToken, async (req, res) => {
  try {
    const result = await dbRun('DELETE FROM outreach_history WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Outreach record not found' });
    }
    res.json({ message: 'Outreach record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SERVER START ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// Made with Bob
