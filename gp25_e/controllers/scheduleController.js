const db = require('../models/db');

// Creates a new schedule
exports.createSchedule = async (req, res) => {
  const {
    courseId,
    name,
    startDate,
    endDate,
    curricularYear,
    class: className,
    createdBy
  } = req.body;

  if (new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({ error: 'A data de fim deve ser posterior à data de início.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Schedule (CourseId, Name, StartDate, EndDate, CurricularYear, Class, CreatedBy, CreatedOn)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [courseId, name, startDate, endDate, curricularYear, className, createdBy]
    );

    res.status(201).json({ message: 'Schedule criado com sucesso', scheduleId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Listar todos os calendários
exports.getAllSchedules = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, c.Name as CourseName
      FROM Schedule s
      LEFT JOIN Courses c ON s.CourseId = c.Id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obter calendário com os seus blocks
exports.getScheduleById = async (req, res) => {
  const scheduleId = req.params.id;
  try {
    const [[schedule]] = await db.query('SELECT * FROM Schedule WHERE Id = ?', [scheduleId]);
    if (!schedule) return res.status(404).json({ message: 'Schedule não encontrado' });

    const [blocks] = await db.query(`
      SELECT 
        b.*, 
        s.Name AS SubjectName, 
        c.Name AS ClassroomName 
      FROM Block b
      LEFT JOIN Subjects s ON b.SubjectFK = s.Id
      LEFT JOIN Classrooms c ON b.ClassroomFK = c.Id
      WHERE b.ScheduleFK = ?
      ORDER BY b.DayOfWeek, b.StartHour
    `, [scheduleId]);

    res.json({ ...schedule, blocks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Atualizar calendário
exports.updateSchedule = async (req, res) => {
  const {
    name,
    startDate,
    endDate,
    courseId,
    curricularYear,
    class: className,
    updatedBy
  } = req.body;
  const scheduleId = req.params.id;

  if (new Date(endDate) <= new Date(startDate)) {
    return res.status(400).json({ error: 'A data de fim deve ser posterior à data de início.' });
  }

  try {
    await db.query(
      `UPDATE Schedule
       SET Name = ?, StartDate = ?, EndDate = ?, CourseId = ?, CurricularYear = ?, Class = ?, UpdatedBy = ?, UpdatedOn = NOW()
       WHERE Id = ?`,
      [name, startDate, endDate, courseId, curricularYear, className, updatedBy, scheduleId]
    );

    res.json({ message: 'Schedule atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Apagar calendário + seus blocks
exports.deleteSchedule = async (req, res) => {
  const scheduleId = req.params.id;
  try {
    await db.query('DELETE FROM Block WHERE ScheduleFK = ?', [scheduleId]);
    await db.query('DELETE FROM Schedule WHERE Id = ?', [scheduleId]);
    res.json({ message: 'Schedule e blocks apagados' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Adicionar bloco ao calendário
exports.addBlock = async (req, res) => {
  const { subjectId, scheduleId, classroomId, startHour, endHour, dayOfWeek, createdBy } = req.body;

  console.log(req.body);

  // Validação lógica
  if (!subjectId || !scheduleId || !classroomId || !startHour || !endHour || !dayOfWeek) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  if (new Date(`1970-01-01T${endHour}`) <= new Date(`1970-01-01T${startHour}`)) {
    return res.status(400).json({ message: 'Hora de fim tem de ser posterior à hora de início.' });
  }

  if (dayOfWeek < 1 || dayOfWeek > 6) {
    return res.status(400).json({ message: 'O dia da semana tem de estar entre 1 (segunda) e 6 (sábado).' });
  }

  try {
    await db.query(
      `INSERT INTO Block (SubjectFK, StartHour, EndHour, DayOfWeek, ScheduleFK, ClassroomFK, CreatedBy, CreatedOn)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [subjectId, startHour, endHour, dayOfWeek, scheduleId, classroomId, createdBy]
    );
    res.status(201).json({ message: 'Bloco adicionado ao calendário' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remover bloco
exports.deleteBlock = async (req, res) => {
  const blockId = req.params.blockId;
  try {
    await db.query('DELETE FROM Block WHERE Id = ?', [blockId]);
    res.json({ message: 'Bloco removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obter calendários do utilizador
exports.getUserSchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(`
      SELECT s.*, c.Name as CourseName
      FROM Schedule s
      LEFT JOIN Courses c ON s.CourseId = c.Id
      WHERE s.CreatedBy = ?
      ORDER BY s.CreatedOn DESC
    `, [userId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
