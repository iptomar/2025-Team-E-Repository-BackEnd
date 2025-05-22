const db = require('../models/db');
const bcrypt = require('bcryptjs');

// Obter lista paginada de utilizadores com filtro de pesquisa
exports.getAllPeople = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : '%';

    try {
        const [countRows] = await db.query(
            'SELECT COUNT(*) AS total FROM People WHERE Name LIKE ? OR Email LIKE ?',
            [search, search]
        );
        const total = countRows[0].total;

        const [rows] = await db.query(
            'SELECT * FROM People WHERE Name LIKE ? OR Email LIKE ? ORDER BY Name ASC LIMIT ? OFFSET ?',
            [search, search, limit, offset]
        );

        res.json({
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Obter um utilizador por ID (inclui roles)
exports.getPersonById = async (req, res) => {
    try {
        const [userRows] = await db.query('SELECT * FROM People WHERE Id = ?', [req.params.id]);
        if (userRows.length === 0) return res.status(404).json({ message: 'User not found' });

        const [rolesRows] = await db.query(
            'SELECT RoleFK FROM PeopleRoles WHERE PeopleFK = ?',
            [req.params.id]
        );

        const roleIds = rolesRows.map(r => r.RoleFK);

        res.json({ ...userRows[0], Roles: roleIds });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Criar novo utilizador com roles
exports.createPerson = async (req, res) => {
    const { IdIpt, Name, Email, Title, Password, Roles = [], CreatedBy } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(Password, 10);

        const [result] = await db.query(
            'INSERT INTO People (IdIpt, Name, Email, Title, Password, CreatedBy, CreatedOn) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [IdIpt, Name, Email, Title, hashedPassword, CreatedBy]
        );
        const personId = result.insertId;

        for (const roleId of Roles) {
            await db.query(
                'INSERT INTO PeopleRoles (PeopleFK, RoleFK, CreatedBy, CreatedOn) VALUES (?, ?, ?, NOW())',
                [personId, roleId, CreatedBy]
            );
        }

        res.status(201).json({ id: personId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Atualizar utilizador e seus roles
exports.updatePerson = async (req, res) => {
    const { IdIpt, Name, Email, Title, Password, Roles = [], UpdatedBy } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(Password, 10);

        const [result] = await db.query(
            'UPDATE People SET IdIpt = ?, Name = ?, Email = ?, Title = ?, Password = ?, UpdatedBy = ?, UpdatedOn = NOW() WHERE Id = ?',
            [IdIpt, Name, Email, Title, hashedPassword, UpdatedBy, req.params.id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });

        // Apagar roles antigos
        await db.query('DELETE FROM PeopleRoles WHERE PeopleFK = ?', [req.params.id]);

        // Inserir novos roles
        for (const roleId of Roles) {
            await db.query(
                'INSERT INTO PeopleRoles (PeopleFK, RoleFK, CreatedBy, CreatedOn) VALUES (?, ?, ?, NOW())',
                [req.params.id, roleId, UpdatedBy]
            );
        }

        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Apagar utilizador
exports.deletePerson = async (req, res) => {
    try {
        await db.query('DELETE FROM PeopleRoles WHERE PeopleFK = ?', [req.params.id]);
        const [result] = await db.query('DELETE FROM People WHERE Id = ?', [req.params.id]);

        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
