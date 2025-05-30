const db = require('../models/db');

// GET /api/admin/subjects?page=1&limit=10&search=programacao
exports.getAllSubjects = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : '%';

    try {
        const [countRows] = await db.query(
            'SELECT COUNT(*) AS total FROM Subjects WHERE Name LIKE ? OR Description LIKE ?',
            [search, search]
        );
        const total = countRows[0].total;

        const [rows] = await db.query(
            'SELECT * FROM Subjects WHERE Name LIKE ? OR Description LIKE ? ORDER BY Name ASC LIMIT ? OFFSET ?',
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

// Obter por ID
exports.getSubjectById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Subjects WHERE Id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Subject not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Criar nova cadeira
exports.createSubject = async (req, res) => {
    const {
        IdSubject, Name, Description, Tipologia,
        HoursT, HoursTP, HoursP, TotalHours,
        CurricularYear, CreatedBy
    } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO Subjects 
        (IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CurricularYear, CreatedBy, CreatedOn)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CurricularYear, CreatedBy]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Atualizar cadeira
exports.updateSubject = async (req, res) => {
    const {
        IdSubject, Name, Description, Tipologia,
        HoursT, HoursTP, HoursP, TotalHours,
        CurricularYear, UpdatedBy
    } = req.body;

    try {
        const [result] = await db.query(
            `UPDATE Subjects SET
        IdSubject = ?, Name = ?, Description = ?, Tipologia = ?,
        HoursT = ?, HoursTP = ?, HoursP = ?, TotalHours = ?,
        CurricularYear = ?, UpdatedBy = ?, UpdatedOn = NOW()
       WHERE Id = ?`,
            [IdSubject, Name, Description, Tipologia, HoursT, HoursTP, HoursP, TotalHours, CurricularYear, UpdatedBy, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json({ message: 'Subject updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Eliminar
exports.deleteSubject = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Subjects WHERE Id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Subject not found' });
        res.json({ message: 'Subject deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
