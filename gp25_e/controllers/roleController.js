const db = require('../models/db');

// GET /api/admin/roles
exports.getAllRoles = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT Id, Name FROM Roles ORDER BY Name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
