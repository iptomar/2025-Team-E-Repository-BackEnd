const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query(`
      SELECT p.*, pr.RoleFK, r.Name as RoleName
      FROM People p
      LEFT JOIN PeopleRoles pr ON pr.PeopleFK = p.Id
      LEFT JOIN Roles r ON r.Id = pr.RoleFK
      WHERE p.Email = ?
    `, [email]);

    if (rows.length === 0) return res.status(401).json({ message: 'Email não encontrado' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) return res.status(401).json({ message: 'Palavra-passe incorreta' });

    const token = jwt.sign(
      {
        id: user.Id,
        email: user.Email,
        roleId: user.RoleFK,
        role: user.RoleName
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.Id,
        name: user.Name,
        email: user.Email,
        roleId: user.RoleFK,
        role: user.RoleName
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  const { idIpt, name, email, password, title, roleId } = req.body;

  if (!idIpt || !name || !email || !password || !roleId) {
    return res.status(400).json({ message: 'Campos obrigatórios em falta' });
  }

  try {
    const [existing] = await db.query('SELECT * FROM People WHERE Email = ?', [email]);
    if (existing.length > 0) return res.status(409).json({ message: 'Email já registado' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO People (IdIpt, Name, Email, Password, Title, CreatedOn)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [idIpt, name, email, hashedPassword, title || null]
    );

    const newUserId = result.insertId;

    await db.query(
      `INSERT INTO PeopleRoles (PeopleFK, RoleFK, CreatedOn)
       VALUES (?, ?, NOW())`,
      [newUserId, roleId]
    );

    res.status(201).json({ message: 'Utilizador registado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
