const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { register, verifyToken } = require('../auth');

// Helper to create test database
const createTestDatabase = () => {
  const db = new sqlite3.Database(':memory:');
  
  // Initialize schema
  db.serialize(() => {
    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      industry TEXT,
      website TEXT,
      location TEXT,
      territory TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      position TEXT,
      influence_level TEXT CHECK(influence_level IN ('Low', 'Medium', 'High', 'Executive')),
      lead_status TEXT CHECK(lead_status IN ('Potential Lead', 'Validated Lead')) DEFAULT 'Potential Lead',
      email TEXT,
      phone TEXT,
      linkedin TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE outreach_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      outreach_type TEXT CHECK(outreach_type IN ('Email', 'Phone', 'Meeting', 'LinkedIn', 'Other')),
      outreach_date DATETIME NOT NULL,
      subject TEXT,
      notes TEXT,
      outcome TEXT,
      follow_up_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    )`);
  });

  return db;
};

// Helper functions for database operations
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

const dbAll = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Create test app with routes
const createTestApp = (db) => {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // Companies routes
  app.get('/api/companies', verifyToken, async (req, res) => {
    try {
      const companies = await dbAll(db, 'SELECT * FROM companies WHERE user_id = ? ORDER BY name', [req.userId]);
      res.json(companies);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/companies', verifyToken, async (req, res) => {
    try {
      const { name, industry, website, location, territory, notes } = req.body;
      const result = await dbRun(db,
        'INSERT INTO companies (user_id, name, industry, website, location, territory, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.userId, name, industry, website, location, territory, notes]
      );
      const company = await dbGet(db, 'SELECT * FROM companies WHERE id = ?', [result.lastID]);
      res.status(201).json(company);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/companies/:id', verifyToken, async (req, res) => {
    try {
      const { name, industry, website, location, territory, notes } = req.body;
      await dbRun(db,
        'UPDATE companies SET name = ?, industry = ?, website = ?, location = ?, territory = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [name, industry, website, location, territory, notes, req.params.id, req.userId]
      );
      const company = await dbGet(db, 'SELECT * FROM companies WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
      res.json(company);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/companies/:id', verifyToken, async (req, res) => {
    try {
      const result = await dbRun(db, 'DELETE FROM companies WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Company not found' });
      }
      res.json({ message: 'Company deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Contacts routes
  app.get('/api/contacts', verifyToken, async (req, res) => {
    try {
      const contacts = await dbAll(db, `
        SELECT c.*, co.name as company_name 
        FROM contacts c 
        LEFT JOIN companies co ON c.company_id = co.id 
        WHERE c.user_id = ?
        ORDER BY c.last_name, c.first_name
      `, [req.userId]);
      res.json(contacts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/contacts', verifyToken, async (req, res) => {
    try {
      const { company_id, first_name, last_name, position, influence_level, lead_status, email, phone, linkedin, notes } = req.body;
      const result = await dbRun(db,
        'INSERT INTO contacts (user_id, company_id, first_name, last_name, position, influence_level, lead_status, email, phone, linkedin, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [req.userId, company_id, first_name, last_name, position, influence_level, lead_status || 'Potential Lead', email, phone, linkedin, notes]
      );
      const contact = await dbGet(db, 'SELECT * FROM contacts WHERE id = ?', [result.lastID]);
      res.status(201).json(contact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
};

describe('API Endpoint Tests', () => {
  let db;
  let app;
  let token;
  let userId;

  beforeAll(async () => {
    db = createTestDatabase();
    app = createTestApp(db);

    // Register and login a test user
    const result = await register(db, 'testuser', 'password123', 'test@example.com');
    token = result.token;
    userId = result.user.id;
  });

  afterAll((done) => {
    db.close(done);
  });

  describe('Companies API', () => {
    let companyId;

    test('should create a new company', async () => {
      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Company',
          industry: 'Technology',
          website: 'https://test.com',
          location: 'New York',
          territory: 'Northeast',
          notes: 'Test notes'
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Company');
      expect(response.body.industry).toBe('Technology');
      expect(response.body.user_id).toBe(userId);
      companyId = response.body.id;
    });

    test('should get all companies for user', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toBe('Test Company');
    });

    test('should update a company', async () => {
      const response = await request(app)
        .put(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Company',
          industry: 'Software',
          website: 'https://updated.com',
          location: 'Boston',
          territory: 'Northeast',
          notes: 'Updated notes'
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Company');
      expect(response.body.industry).toBe('Software');
    });

    test('should delete a company', async () => {
      const response = await request(app)
        .delete(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Company deleted successfully');
    });

    test('should return 404 for non-existent company', async () => {
      const response = await request(app)
        .put('/api/companies/99999')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test',
          industry: 'Test'
        });

      expect(response.status).toBe(404);
    });

    test('should reject request without authentication', async () => {
      const response = await request(app)
        .get('/api/companies');

      expect(response.status).toBe(401);
    });
  });

  describe('Contacts API', () => {
    let companyId;
    let contactId;

    beforeAll(async () => {
      // Create a company first
      const result = await dbRun(db,
        'INSERT INTO companies (user_id, name, industry) VALUES (?, ?, ?)',
        [userId, 'Contact Test Company', 'Technology']
      );
      companyId = result.lastID;
    });

    test('should create a new contact', async () => {
      const response = await request(app)
        .post('/api/contacts')
        .set('Authorization', `Bearer ${token}`)
        .send({
          company_id: companyId,
          first_name: 'John',
          last_name: 'Doe',
          position: 'CEO',
          influence_level: 'Executive',
          lead_status: 'Validated Lead',
          email: 'john@example.com',
          phone: '555-1234',
          linkedin: 'linkedin.com/in/johndoe',
          notes: 'Test contact'
        });

      expect(response.status).toBe(201);
      expect(response.body.first_name).toBe('John');
      expect(response.body.last_name).toBe('Doe');
      expect(response.body.user_id).toBe(userId);
      contactId = response.body.id;
    });

    test('should get all contacts for user', async () => {
      const response = await request(app)
        .get('/api/contacts')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].first_name).toBe('John');
    });

    test('should reject contact creation without authentication', async () => {
      const response = await request(app)
        .post('/api/contacts')
        .send({
          company_id: companyId,
          first_name: 'Jane',
          last_name: 'Doe'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('User Isolation', () => {
    let user2Token;
    let user2Id;
    let user1CompanyId;

    beforeAll(async () => {
      // Create second user
      const result = await register(db, 'testuser2', 'password123', 'test2@example.com');
      user2Token = result.token;
      user2Id = result.user.id;

      // Create company for user 1
      const companyResult = await dbRun(db,
        'INSERT INTO companies (user_id, name, industry) VALUES (?, ?, ?)',
        [userId, 'User 1 Company', 'Technology']
      );
      user1CompanyId = companyResult.lastID;
    });

    test('user 2 should not see user 1 companies', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    });

    test('user 2 should not be able to update user 1 company', async () => {
      const response = await request(app)
        .put(`/api/companies/${user1CompanyId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'Hacked Company',
          industry: 'Hacking'
        });

      expect(response.status).toBe(404);
    });

    test('user 2 should not be able to delete user 1 company', async () => {
      const response = await request(app)
        .delete(`/api/companies/${user1CompanyId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(404);
    });
  });
});

// Made with Bob