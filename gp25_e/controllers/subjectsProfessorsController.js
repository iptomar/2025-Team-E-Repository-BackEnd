const db = require("../models/db");

exports.getCourseByProfessorId = async (req, res) => {
  if (req.user.role !== "Admin" && req.user.role !== "Docente")
    return res.status(403).json({ message: "Acesso negado" });
  try {
    // Mostra o(s) curso(s) a que pertence o professor
    const [rows] = await db.query(
      `
        SELECT c.Name, pc.CourseFK
        FROM ProfessorsCourses as pc
        JOIN Courses as c ON pc.CourseFK = c.id
        WHERE pc.PeopleFK = ?;`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/subjects-professors?year=1
exports.getAllSubjectsProfessors = async (req, res) => {
  if (req.user.role !== "Admin" && req.user.role !== "Docente") {
    return res.status(403).json({ message: "Acesso negado" });
  }

  const year = req.query.year || "";

  try {
    let sql = `
      SELECT 
        sp.Id,
        s.Id AS IdSubject,
        s.Name AS Subject,
        p.Id AS professorId,      -- <--- adiciona esta linha
        p.Name AS Professor,
        s.Tipologia,
        s.TotalHours,
        s.HoursT,
        s.HoursTP,
        s.HoursP,
        s.CurricularYear
      FROM SubjectsProfessors sp
      JOIN Subjects s ON s.Id = sp.SubjectFK
      JOIN People p ON p.Id = sp.PeopleFK
    `;

    const params = [];

    if (year) {
      sql += " WHERE s.CurricularYear = ? ";
      params.push(year);
    }

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar subjects-professors:", err);
    res.status(500).json({ error: err.message });
  }
};


// POST: atribuir professor a cadeira e garantir que também está no curso
exports.assignProfessorToSubject = async (req, res) => {
  if (req.user.role !== "Admin")
    return res.status(403).json({ message: "Acesso negado" });

  const { subjectId, professorId } = req.body;

  const connection = await db.getConnection(); // usar transação para segurança
  await connection.beginTransaction();

  try {
    // 1. Inserir associação com a cadeira
    await connection.query(
      `INSERT INTO SubjectsProfessors (SubjectFK, PeopleFK, CreatedBy, CreatedOn)
       VALUES (?, ?, ?, NOW())`,
      [subjectId, professorId, req.user.email]
    );

    // 2. Obter os cursos associados a essa cadeira
    const [courseRows] = await connection.query(
      `SELECT CourseId FROM SubjectsCourses WHERE SubjectFK = ?`,
      [subjectId]
    );

    // 3. Para cada curso, verificar se já existe associação com o professor
    for (const row of courseRows) {
      const [existing] = await connection.query(
        `SELECT * FROM ProfessorsCourses WHERE PeopleFK = ? AND CourseFK = ?`,
        [professorId, row.CourseId]
      );

      if (existing.length === 0) {
        await connection.query(
          `INSERT INTO ProfessorsCourses (PeopleFK, CourseFK) VALUES (?, ?)`,
          [professorId, row.CourseId]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: "Professor atribuído com sucesso à cadeira e curso(s)" });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
};


// DELETE: remover atribuição
exports.removeProfessorFromSubject = async (req, res) => {
  if (req.user.role !== "Admin")
    return res.status(403).json({ message: "Acesso negado" });

  const id = req.params.id;
  try {
    await db.query("DELETE FROM SubjectsProfessors WHERE Id = ?", [id]);
    res.json({ message: "Associação removida com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
