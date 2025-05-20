const db = require('../models/db');

// Creates a new schedule
exports.createSchedule = async (req, res) => {
  const { courseId, name, startDate, endDate, createdBy } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO Schedule (CourseId, Name, StartDate, EndDate, CreatedBy, CreatedOn)
       VALUES (?, ?, ?, ?,?, NOW())`,
      [courseId, name, startDate, endDate, createdBy]
    );
    // sends the created scheduleId to the frontend (to be associated) 
    res.status(201).json({ message: 'Schedule criado com sucesso', scheduleId:result.insertId });
    
    //res.status(201).json({ message: 'Schedule criado com sucesso', scheduleId: result.insertId });
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
      SELECT b.*, s.Name as SubjectName
      FROM Block b
      LEFT JOIN Subjects s ON b.SubjectFK = s.Id
      WHERE b.ScheduleFK = ?
      ORDER BY b.StartHour
    `, [scheduleId]);

    res.json({ ...schedule, blocks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Atualizar calendário
exports.updateSchedule = async (req, res) => {
  const { name, startDate, endDate, courseId } = req.body;
  const scheduleId = req.params.id;
  try {
    await db.query(
      `UPDATE Schedule
       SET Name = ?, StartDate = ?, EndDate = ?, CourseId = ?, UpdatedOn = NOW()
       WHERE Id = ?`,
      [name, startDate, endDate, courseId, scheduleId]
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
  const { subjectId, scheduleId, startHour, endHour } = req.body;

  try {
    await db.query(
      `INSERT INTO Block (SubjectFK, StartHour, EndHour, ScheduleFK, CreatedOn)
       VALUES (?, ?, ?, ?, NOW())`,
      [subjectId, startHour, endHour, scheduleId]
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
