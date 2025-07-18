const db = require('../models/db');

function toMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// POST /api/schedules
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
    return res.status(400).json({
      error: "A data de fim deve ser posterior à data de início."
    });
  }

  try {
    const [conflicts] = await db.query(
      `SELECT Id, Name FROM Schedule
       WHERE CourseId = ? AND Class = ? AND CurricularYear = ?
         AND ? <= EndDate AND ? >= StartDate
       LIMIT 1`,
      [courseId, className, curricularYear, startDate, endDate]
    );

    if (conflicts.length) {
      return res.status(409).json({
        error: `Conflito com o horário existente: ${conflicts[0].Name}`
      });
    }

    const [result] = await db.query(
      `INSERT INTO Schedule
       (CourseId, Name, StartDate, EndDate,
        CurricularYear, Class, CreatedBy, CreatedOn)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [courseId, name, startDate, endDate, curricularYear, className, createdBy]
    );

    return res.status(201).json({
      message: "Schedule criado com sucesso",
      scheduleId: result.insertId
    });
  } catch (err) {
    console.error("Erro ao criar schedule:", err);
    return res.status(500).json({ error: err.message });
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

// Adicionar bloco ao calendário (sem validações)
exports.addBlock = async (req, res) => {
  const { subjectId, scheduleId, classroomId, startHour, endHour, dayOfWeek, createdBy } = req.body;

  try {
    await db.query(
      `INSERT INTO Block 
         (SubjectFK, StartHour, EndHour, DayOfWeek, ScheduleFK, ClassroomFK, CreatedBy, CreatedOn)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [subjectId, startHour, endHour, dayOfWeek, scheduleId, classroomId, createdBy]
    );

    res.status(201).json({ message: 'Bloco adicionado com sucesso.' });
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

// Atualizar bloco
exports.updateBlock = async (req, res) => {
  const { subjectId, classroomId, startHour, endHour, dayOfWeek } = req.body;
  const blockId = req.params.blockId;

  // Add detailed logging
  console.log("=== UPDATE BLOCK DEBUG ===");
  console.log("Block ID:", blockId);
  console.log("Request body:", req.body);
  console.log("Parsed values:");
  console.log("- subjectId:", subjectId, typeof subjectId);
  console.log("- classroomId:", classroomId, typeof classroomId);
  console.log("- startHour:", startHour, typeof startHour);
  console.log("- endHour:", endHour, typeof endHour);
  console.log("- dayOfWeek:", dayOfWeek, typeof dayOfWeek);

  // Validação dos campos obrigatórios
  if (!subjectId || !classroomId || !startHour || !endHour || dayOfWeek === undefined) {
    console.log("Validation failed - missing required fields");
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  // Convert startHour and endHour to proper format for comparison
  const startTime = new Date(`1970-01-01 ${startHour}`);
  const endTime = new Date(`1970-01-01 ${endHour}`);

  // Validação das horas
  if (endTime <= startTime) {
    console.log("Validation failed - end time before start time");
    console.log("Start time:", startTime);
    console.log("End time:", endTime);
    return res.status(400).json({ message: 'Hora de fim tem de ser posterior à hora de início.' });
  }

  // Validação do dia da semana
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    console.log("Validation failed - invalid day of week:", dayOfWeek);
    return res.status(400).json({ message: 'O dia da semana tem de estar entre 0 e 6.' });
  }

  try {
    // Verificar se o bloco existe
    console.log("Checking if block exists...");
    const [existingBlock] = await db.query('SELECT * FROM Block WHERE Id = ?', [blockId]);
    if (existingBlock.length === 0) {
      console.log("Block not found:", blockId);
      return res.status(404).json({ message: 'Bloco não encontrado.' });
    }

    console.log("Existing block found:", existingBlock[0]);
    const scheduleId = existingBlock[0].ScheduleFK;

    // Skip conflict checking for now to isolate the issue
    console.log("Skipping conflict checks for debugging...");

    // Atualizar o bloco
    console.log("Updating block with values:", [subjectId, classroomId, startHour, endHour, dayOfWeek, blockId]);

    const updateResult = await db.query(
        `UPDATE Block 
       SET SubjectFK = ?, ClassroomFK = ?, StartHour = ?, EndHour = ?, DayOfWeek = ?, UpdatedOn = NOW()
       WHERE Id = ?`,
        [subjectId, classroomId, startHour, endHour, dayOfWeek, blockId]
    );

    console.log("Update result:", updateResult);
    console.log("Block updated successfully");
    res.json({ message: 'Bloco atualizado com sucesso.' });
  } catch (err) {
    console.error("Detailed error updating block:", err);
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    res.status(500).json({ error: err.message, details: err.toString() });
  }
};



// Obter calendários do utilizador
exports.getUserSchedules = async (req, res) => {
  try {
    const userId         = req.user.id;
    const page           = parseInt(req.query.page) || 1;
    const limit          = parseInt(req.query.limit) || 5;
    const search         = req.query.search || '';
    const classFilter    = req.query.class || '';
    const curricularYear = req.query.curricularYear || '';
    const courseId       = req.query.course || ''; // <--- novo
    const offset         = (page - 1) * limit;

    // ---------------- SQL base ----------------
    let baseQuery = `
      SELECT s.*, c.Name AS CourseName
      FROM Schedule s
      LEFT JOIN Courses c ON s.CourseId = c.Id
      WHERE s.CreatedBy = ?
    `;

    let countQuery = `
      SELECT COUNT(*) AS total
      FROM Schedule s
      WHERE s.CreatedBy = ?
    `;

    const params      = [userId];
    const countParams = [userId];

    // ---------------- filtros dinâmicos ----------------
    if (search) {
      baseQuery  += ' AND s.Name LIKE ?';
      countQuery += ' AND s.Name LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    if (classFilter) {
      baseQuery  += ' AND s.Class = ?';
      countQuery += ' AND s.Class = ?';
      params.push(classFilter);
      countParams.push(classFilter);
    }

    if (curricularYear) {
      baseQuery  += ' AND s.CurricularYear = ?';
      countQuery += ' AND s.CurricularYear = ?';
      params.push(curricularYear);
      countParams.push(curricularYear);
    }

    if (courseId) {
      baseQuery  += ' AND s.CourseId = ?';
      countQuery += ' AND s.CourseId = ?';
      params.push(courseId);
      countParams.push(courseId);
    }

    // paginação e ordenação
    baseQuery += ' ORDER BY s.CreatedOn DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // ---------------- execuções ----------------
    const [[{ total }]] = await db.query(countQuery, countParams);
    const [items]       = await db.query(baseQuery, params);

    res.json({ items, totalCount: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Check if a block conflicts with existing blocks in a schedule
 */

// Helper function to get the day of Week
const getDayOfWeek = (dateStr) => {
  const date = new Date(dateStr)
  let day = date.getDay();
  return day === 0 ? 7 : day;
};

exports.checkBlockConflict = async (req, res) => {
  console.log(req.body);
  const { startHour, endHour, date, roomId, subjectId } = req.body;
  console.log(startHour, endHour, date, roomId);
  if (!startHour || !endHour || !date || !roomId || !subjectId) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  const dayOfWeek = getDayOfWeek(date);

  try {
    const [roomConflicts] = await db.query(`
      SELECT * FROM Block
      WHERE ClassroomFK = ? AND DayOfWeek = ?
      AND (
        (StartHour < ? AND EndHour > ?) 
      )
    `, [roomId, dayOfWeek, 
        endHour, startHour]);
  

    // Check for professor conflicts. O mesmo professor não pode estar em dois sitios ao mesmo tempoo
    const [professorConflicts] = await db.query(`
      SELECT b.* 
      FROM Block b
      JOIN SubjectsProfessors sp_new ON sp_new.SubjectFK = ?
      JOIN SubjectsProfessors sp_existing ON sp_existing.SubjectFK = b.SubjectFK
      WHERE b.DayOfWeek = ?
        AND sp_existing.PeopleFK = sp_new.PeopleFK
        AND ((b.StartHour < ? AND b.EndHour > ?))
    `, [subjectId, dayOfWeek, endHour, startHour]);

    const conflicts = [];

    if (roomConflicts.length > 0) {
      conflicts.push({ type: 'room', conflicts: roomConflicts });
    }

    if (professorConflicts.length > 0) {
      conflicts.push({ type: 'professor', conflicts: professorConflicts });
    }

    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Conflito de blocos encontrado', conflicts });
    }

    res.json({ message: 'Nenhum conflito encontrado' });
  }catch (err) {
    res.status(500).json({ error: err.message });
  }


}

