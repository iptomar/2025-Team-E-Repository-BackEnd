const db = require('../models/db');
const bcrypt = require('bcryptjs');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, pr.RoleFK, r.Name as RoleName
      FROM People p
      LEFT JOIN PeopleRoles pr ON pr.PeopleFK = p.Id
      LEFT JOIN Roles r ON r.Id = pr.RoleFK
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, pr.RoleFK, r.Name as RoleName
      FROM People p
      LEFT JOIN PeopleRoles pr ON pr.PeopleFK = p.Id
      LEFT JOIN Roles r ON r.Id = pr.RoleFK
      WHERE p.Id = ?
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Utilizador não encontrado' });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  const { idIpt, name, email, password, title, roleId } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO People (IdIpt, Name, Email, Password, Title, CreatedOn) VALUES (?, ?, ?, ?, ?, NOW())',
      [idIpt, name, email, hashedPassword, title || null]
    );

    const newUserId = result.insertId;

    if (roleId) {
      await db.query(
        'INSERT INTO PeopleRoles (PeopleFK, RoleFK, CreatedOn) VALUES (?, ?, NOW())',
        [newUserId, roleId]
      );
    }

    res.status(201).json({ message: 'Utilizador criado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { idIpt, name, email, title, roleId } = req.body;
  try {
    await db.query(
      'UPDATE People SET IdIpt = ?, Name = ?, Email = ?, Title = ?, UpdatedOn = NOW() WHERE Id = ?',
      [idIpt, name, email, title, id]
    );

    if (roleId) {
      const [existing] = await db.query('SELECT Id FROM PeopleRoles WHERE PeopleFK = ?', [id]);

      if (existing.length > 0) {
        await db.query(
          'UPDATE PeopleRoles SET RoleFK = ?, UpdatedOn = NOW() WHERE PeopleFK = ?',
          [roleId, id]
        );
      } else {
        await db.query(
          'INSERT INTO PeopleRoles (PeopleFK, RoleFK, CreatedOn) VALUES (?, ?, NOW())',
          [id, roleId]
        );
      }
    }

    res.json({ message: 'Utilizador atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    await db.query('DELETE FROM People WHERE Id = ?', [req.params.id]);
    res.json({ message: 'Utilizador removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Change user password
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta' });
  }

  try {
    const [rows] = await db.query('SELECT Password FROM People WHERE Id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Utilizador não encontrado' });

    const isMatch = await bcrypt.compare(oldPassword, rows[0].Password);
    if (!isMatch) return res.status(401).json({ message: 'Palavra-passe atual incorreta' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE People SET Password = ?, UpdatedOn = NOW() WHERE Id = ?', [hashedNewPassword, userId]);

    res.json({ message: 'Palavra-passe atualizada com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
