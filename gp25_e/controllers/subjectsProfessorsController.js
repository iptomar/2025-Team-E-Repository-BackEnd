const db = require('../models/db');


exports.getCourseByProfessorId = async (req, res) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Docente') return res.status(403).json({ message: 'Acesso negado' });
  try {
    // Mostra o(s) curso(s) a que pertence o professor
    const [rows] = await db.query(`
        SELECT c.Name, pc.CourseFK
        FROM ProfessorsCourses as pc
        JOIN Courses as c ON pc.CourseFK = c.id
        WHERE pc.PeopleFK = ?;`, [req.user.id]);
    res.json(rows);
  }
  catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET: listar professores atribuídos a cadeiras
exports.getAllSubjectsProfessors = async (req, res) => {
  if (req.user.role !== 'Admin' && req.user.role !== 'Docente') {
    return res.status(403).json({ message: 'Acesso negado' });
  }

  try {
    const [rows] = await db.query(`
      SELECT 
        sp.Id,
        s.Name AS Subject, 
        p.Name AS Professor,
        s.Tipologia,
        s.TotalHours,
        s.HoursT,
        s.HoursTP,
        s.HoursP
      FROM SubjectsProfessors sp
      JOIN Subjects s ON s.Id = sp.SubjectFK
      JOIN People p ON p.Id = sp.PeopleFK
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// POST: atribuir professor a cadeira
exports.assignProfessorToSubject = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Acesso negado' });

  const { subjectId, professorId } = req.body;
  try {
    await db.query(
      `INSERT INTO SubjectsProfessors (SubjectFK, PeopleFK, CreatedBy, CreatedOn)
       VALUES (?, ?, ?, NOW())`,
      [subjectId, professorId, req.user.email]
    );
    res.status(201).json({ message: 'Professor atribuído à cadeira com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE: remover atribuição
exports.removeProfessorFromSubject = async (req, res) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Acesso negado' });

  const id = req.params.id;
  try {
    await db.query('DELETE FROM SubjectsProfessors WHERE Id = ?', [id]);
    res.json({ message: 'Associação removida com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
