const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email not found' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, isDocente: user.isDocente },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
    const { idIpt, nome, email, password, isDocente, idUnidepart, idCategoria } = req.body;
  
    if (!idIpt || !nome || !email || !password) {
      return res.status(400).json({ message: 'Campos obrigatórios em falta' });
    }
  
    try {
      // Verificar se já existe user com este email
      const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Email já registado' });
      }
  
      // Encriptar a password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Inserir novo user
      await db.query(
        `INSERT INTO users (idIpt, nome, email, password, isDocente, idUnidepart, idCategoria)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          idIpt,
          nome,
          email,
          hashedPassword,
          isDocente || false,
          isDocente ? idUnidepart : null,
          isDocente ? idCategoria : null
        ]
      );
  
      res.status(201).json({ message: 'Utilizador registado com sucesso' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
