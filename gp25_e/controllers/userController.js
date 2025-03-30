const db = require('../models/db');
const bcrypt = require('bcryptjs');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  const { idIpt, nome, email, isDocente, idUnidepart, idCategoria } = req.body;
  try {
    await db.query(
      'INSERT INTO users (idIpt, nome, email, isDocente, idUnidepart, idCategoria) VALUES (?, ?, ?, ?, ?, ?)',
      [idIpt, nome, email, isDocente, idUnidepart, idCategoria]
    );
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { idIpt, nome, email, isDocente, idUnidepart, idCategoria } = req.body;
  try {
    await db.query(
      'UPDATE users SET idIpt = ?, nome = ?, email = ?, isDocente = ?, idUnidepart = ?, idCategoria = ? WHERE id = ?',
      [idIpt, nome, email, isDocente, idUnidepart, idCategoria, id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Change user password
exports.changePassword = async (req, res) => {
    const userId = req.user.id; // Comes from JWT (authMiddleware)
    const { oldPassword, newPassword } = req.body;
  
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Fields missing' });
    }
  
    try {
      const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
      if (rows.length === 0) return res.status(404).json({ message: 'user not found' });
  
      const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
      if (!isMatch) return res.status(401).json({ message: 'Old password is incorrect' });
  
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
  
      res.json({ message: 'Password successfully updated' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
