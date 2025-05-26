const db = require('../models/db');

// GET /api/admin/institutions
exports.getAllInstitutions = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT Id, Name FROM Institutions ORDER BY Name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
