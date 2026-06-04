const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use /app/data for Docker, otherwise use current directory
const dataDir = process.env.NODE_ENV === 'production' && fs.existsSync('/app/data')
  ? '/app/data'
  : __dirname;

const dbPath = path.join(dataDir, 'prospector.db');
console.log(`Using database path: ${dbPath}`);

const db = new sqlite3.Database(dbPath);

// Initialize database schema
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Companies table
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
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
    )
  `);

  // Add location, territory, and user_id columns if they don't exist (migration)
  db.all(`PRAGMA table_info(companies)`, (err, columns) => {
    if (!err && columns) {
      const hasLocation = columns.some(col => col.name === 'location');
      const hasTerritory = columns.some(col => col.name === 'territory');
      const hasUserId = columns.some(col => col.name === 'user_id');
      
      if (!hasLocation) {
        db.run(`ALTER TABLE companies ADD COLUMN location TEXT`, (err) => {
          if (!err) console.log('Added location column to companies table');
        });
      }
      
      if (!hasTerritory) {
        db.run(`ALTER TABLE companies ADD COLUMN territory TEXT`, (err) => {
          if (!err) console.log('Added territory column to companies table');
        });
      }
      
      if (!hasUserId) {
        db.run(`ALTER TABLE companies ADD COLUMN user_id INTEGER`, (err) => {
          if (!err) console.log('Added user_id column to companies table');
        });
      }
    }
  });

  // Contacts table
  db.run(`
    CREATE TABLE IF NOT EXISTS contacts (
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
    )
  `);

  // Add lead_status and user_id columns if they don't exist (migration)
  db.all(`PRAGMA table_info(contacts)`, (err, columns) => {
    if (!err && columns) {
      const hasLeadStatus = columns.some(col => col.name === 'lead_status');
      const hasUserId = columns.some(col => col.name === 'user_id');
      
      if (!hasLeadStatus) {
        db.run(`ALTER TABLE contacts ADD COLUMN lead_status TEXT CHECK(lead_status IN ('Potential Lead', 'Validated Lead')) DEFAULT 'Potential Lead'`, (err) => {
          if (!err) console.log('Added lead_status column to contacts table');
        });
      }
      
      if (!hasUserId) {
        db.run(`ALTER TABLE contacts ADD COLUMN user_id INTEGER`, (err) => {
          if (!err) console.log('Added user_id column to contacts table');
        });
      }
    }
  });

  // Contact relationships table (many-to-many)
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_relationships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      related_contact_id INTEGER NOT NULL,
      relationship_type TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (related_contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      UNIQUE(contact_id, related_contact_id)
    )
  `);

  // Add user_id column to contact_relationships if it doesn't exist (migration)
  db.all(`PRAGMA table_info(contact_relationships)`, (err, columns) => {
    if (!err && columns) {
      const hasUserId = columns.some(col => col.name === 'user_id');
      
      if (!hasUserId) {
        db.run(`ALTER TABLE contact_relationships ADD COLUMN user_id INTEGER`, (err) => {
          if (!err) console.log('Added user_id column to contact_relationships table');
        });
      }
    }
  });

  // Outreach history table
  db.run(`
    CREATE TABLE IF NOT EXISTS outreach_history (
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
    )
  `);

  // Add user_id column to outreach_history if it doesn't exist (migration)
  db.all(`PRAGMA table_info(outreach_history)`, (err, columns) => {
    if (!err && columns) {
      const hasUserId = columns.some(col => col.name === 'user_id');
      
      if (!hasUserId) {
        db.run(`ALTER TABLE outreach_history ADD COLUMN user_id INTEGER`, (err) => {
          if (!err) console.log('Added user_id column to outreach_history table');
        });
      }
    }
  });

  // Create Admin user and assign existing records
  const bcrypt = require('bcrypt');
  const tempPassword = 'Admin' + Math.random().toString(36).substring(2, 10) + '!';
  
  db.get(`SELECT id FROM users WHERE username = 'Admin'`, (err, row) => {
    if (!err && !row) {
      bcrypt.hash(tempPassword, 10, (err, hashedPassword) => {
        if (!err) {
          db.run(
            `INSERT INTO users (username, password, email) VALUES (?, ?, ?)`,
            ['Admin', hashedPassword, 'admin@prospector.local'],
            function(err) {
              if (!err) {
                const adminUserId = this.lastID;
                console.log('='.repeat(60));
                console.log('ADMIN USER CREATED');
                console.log('Username: Admin');
                console.log(`Temporary Password: ${tempPassword}`);
                console.log('IMPORTANT: Change this password after first login!');
                console.log('='.repeat(60));
                
                // Assign all existing records to Admin user
                db.run(`UPDATE companies SET user_id = ? WHERE user_id IS NULL`, [adminUserId]);
                db.run(`UPDATE contacts SET user_id = ? WHERE user_id IS NULL`, [adminUserId]);
                db.run(`UPDATE contact_relationships SET user_id = ? WHERE user_id IS NULL`, [adminUserId]);
                db.run(`UPDATE outreach_history SET user_id = ? WHERE user_id IS NULL`, [adminUserId], (err) => {
                  if (!err) {
                    console.log('All existing records assigned to Admin user');
                  }
                });
              }
            }
          );
        }
      });
    }
  });

  console.log('Database schema initialized successfully');
});

module.exports = db;

// Made with Bob
