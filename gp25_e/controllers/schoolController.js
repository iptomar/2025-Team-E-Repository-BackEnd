const db = require('../models/db');

// GET /api/admin/schools?page=1&limit=10&search=abc
exports.getAllSchools = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : '%';

    try {
        // Total count (não precisa de JOIN)
        const [countRows] = await db.query(
            'SELECT COUNT(*) AS total FROM Schools WHERE Name LIKE ? OR Abbreviation LIKE ?',
            [search, search]
        );
        const total = countRows[0].total;

        // Paginated results com JOIN à tabela Institutions
        const [rows] = await db.query(
            `SELECT s.*, i.Name AS InstitutionName
             FROM Schools s
             LEFT JOIN Institutions i ON s.InstitutionFK = i.Id
             WHERE s.Name LIKE ? OR s.Abbreviation LIKE ?
             ORDER BY s.Name ASC
             LIMIT ? OFFSET ?`,
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


exports.getSchoolById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Schools WHERE Id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'School not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createSchool = async (req, res) => {
    const { IdSchool, Name, Abbreviation, InstitutionFK, CreatedBy } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO Schools (IdSchool, Name, Abbreviation, InstitutionFK, CreatedBy, CreatedOn) VALUES (?, ?, ?, ?, ?, NOW())',
            [IdSchool, Name, Abbreviation, InstitutionFK, CreatedBy]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSchool = async (req, res) => {
    const { IdSchool, Name, Abbreviation, InstitutionFK, UpdatedBy } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE Schools SET IdSchool = ?, Name = ?, Abbreviation = ?, InstitutionFK = ?, UpdatedBy = ?, UpdatedOn = NOW() WHERE Id = ?',
            [IdSchool, Name, Abbreviation, InstitutionFK, UpdatedBy, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'School not found' });
        res.json({ message: 'School updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSchool = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Schools WHERE Id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'School not found' });
        res.json({ message: 'School deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
