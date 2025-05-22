const db = require('../models/db');

// GET /api/admin/classrooms?page=1&limit=10&search=laboratorio
exports.getAllClassrooms = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : '%';

    try {
        // Total count
        const [countRows] = await db.query(
            'SELECT COUNT(*) AS total FROM Classrooms WHERE Name LIKE ? OR Allocation LIKE ?',
            [search, search]
        );
        const total = countRows[0].total;

        // Paginated results
        const [rows] = await db.query(
            'SELECT * FROM Classrooms WHERE Name LIKE ? OR Allocation LIKE ? ORDER BY Name ASC LIMIT ? OFFSET ?',
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

exports.getClassroomById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Classrooms WHERE Id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Classroom not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createClassroom = async (req, res) => {
    const { Name, SchoolFK, Allocation, CreatedBy } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO Classrooms (Name, SchoolFK, Allocation, CreatedBy, CreatedOn) VALUES (?, ?, ?, ?, NOW())',
            [Name, SchoolFK, Allocation, CreatedBy]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateClassroom = async (req, res) => {
    const { Name, SchoolFK, Allocation, UpdatedBy } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE Classrooms SET Name = ?, SchoolFK = ?, Allocation = ?, UpdatedBy = ?, UpdatedOn = NOW() WHERE Id = ?',
            [Name, SchoolFK, Allocation, UpdatedBy, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Classroom not found' });
        res.json({ message: 'Classroom updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteClassroom = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Classrooms WHERE Id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Classroom not found' });
        res.json({ message: 'Classroom deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
