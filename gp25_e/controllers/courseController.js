const db = require('../models/db');

// GET /api/admin/courses?page=1&limit=10&search=engenharia
exports.getAllCourses = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : '%';

    try {
        // Contar normalmente
        const [countRows] = await db.query(
            'SELECT COUNT(*) AS total FROM Courses WHERE Name LIKE ? OR IdCourse LIKE ?',
            [search, search]
        );
        const total = countRows[0].total;

        // Incluir nome da escola no resultado
        const [rows] = await db.query(
            `SELECT c.*, s.Name AS SchoolName
             FROM Courses c
             LEFT JOIN Schools s ON c.SchoolFK = s.Id
             WHERE c.Name LIKE ? OR c.IdCourse LIKE ?
             ORDER BY c.Name ASC
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


// Obter curso por ID
exports.getCourseById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM Courses WHERE Id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Course not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Criar curso
exports.createCourse = async (req, res) => {
    const { IdCourse, Name, SchoolFK, CreatedBy } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO Courses (IdCourse, Name, SchoolFK, CreatedBy, CreatedOn) VALUES (?, ?, ?, ?, NOW())',
            [IdCourse, Name, SchoolFK, CreatedBy]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Atualizar curso
exports.updateCourse = async (req, res) => {
    const { IdCourse, Name, SchoolFK, UpdatedBy } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE Courses SET IdCourse = ?, Name = ?, SchoolFK = ?, UpdatedBy = ?, UpdatedOn = NOW() WHERE Id = ?',
            [IdCourse, Name, SchoolFK, UpdatedBy, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Course not found' });
        res.json({ message: 'Course updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Eliminar curso
exports.deleteCourse = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM Courses WHERE Id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Course not found' });
        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
