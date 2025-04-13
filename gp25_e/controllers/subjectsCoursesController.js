const db = require('../models/db');

// GET: listar todas as associações de cadeiras a cursos
exports.getAllSubjectsCourses = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Acesso negado' });

  try {
    const [rows] = await db.query(`
      SELECT sc.Id, 
      s.Name AS Subject, 
      c.Name AS Course,
      s.HoursT,
      s.HoursTP,
      s.HoursP,
      s.TotalHours
      FROM SubjectsCourses sc
      JOIN Subjects s ON s.Id = sc.SubjectFK
      JOIN Courses c ON c.Id = sc.CourseId
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: associar cadeira a curso
exports.assignSubjectToCourse = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Acesso negado' });

  const { subjectId, courseId } = req.body;
  try {
    await db.query(
      `INSERT INTO SubjectsCourses (SubjectFK, CourseId, CreatedBy, CreatedOn)
       VALUES (?, ?, ?, NOW())`,
      [subjectId, courseId, req.user.email]
    );
    res.status(201).json({ message: 'Cadeira associada ao curso com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE: remover associação
exports.removeSubjectFromCourse = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Acesso negado' });

  const id = req.params.id;
  try {
    await db.query('DELETE FROM SubjectsCourses WHERE Id = ?', [id]);
    res.json({ message: 'Associação removida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
