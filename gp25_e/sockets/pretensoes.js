let calendarioBuffer = [];
const db = require("../models/db");

// Verifica se há sobreposição entre dois intervalos de tempo (HH:mm:ss)
const isTimeOverlapping = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`WebSocket: Cliente conectado - ${socket.id}`);

   socket.on("adicionarSala", (novaAula) => {
  const {
    roomId,
    startHour,
    endHour,
    dayOfWeek,
    professorName,
    professorId,
    userEmail,
    blockId,
  } = novaAula;

  // Cria uma visão do buffer sem o próprio bloco
  const bufferSemProprio = calendarioBuffer.filter(
    (aula) => String(aula.blockId) !== String(blockId)
  );

  // Agora verifica conflitos apenas contra os outros blocos
  const conflito = bufferSemProprio.find((aula) => {
    return (
      aula.roomId    === roomId    &&
      aula.dayOfWeek === dayOfWeek &&
      isTimeOverlapping(
        aula.startHour,
        aula.endHour,
        startHour,
        endHour
      )
    );
  });

  if (conflito) {
    socket.emit("respostaBuffer", {
      status: "erro",
      motivo: "Já existe uma aula marcada nessa sala para esse horário.",
    });
    return;
  }

  // ✅ Adiciona (ou re‐insere) ao buffer, sem duplicar
  //    (se já havia uma entrada com este blockId, foi filtrada acima)
  calendarioBuffer = bufferSemProprio.concat({
    roomId,
    dayOfWeek,
    startHour,
    endHour,
    professorName,
    professorId,
    userEmail,
    blockId,
  });

  console.log("Buffer atualizado (upsert):", calendarioBuffer);
  io.emit("bufferAtualizado", calendarioBuffer);
  socket.emit("respostaBuffer", { status: "ok" });
});


    // ➖ Remover aula do buffer
    socket.on("removerSala", (dadosRemover) => {
      const { roomId, startHour, endHour, dayOfWeek } = dadosRemover;

      const novaLista = calendarioBuffer.filter((aula) => {
        return !(
          aula.roomId === roomId &&
          aula.dayOfWeek === dayOfWeek &&
          aula.startHour === startHour &&
          aula.endHour === endHour
        );
      });

      calendarioBuffer.length = 0;
      calendarioBuffer.push(...novaLista);
      console.log("Buffer atualizado após remoção:", calendarioBuffer);
      io.emit("bufferAtualizado", calendarioBuffer);
    });

    socket.on("limparBufferPorEmail", ({ email }) => {
      const antes = calendarioBuffer.length;
      // Remove do buffer todos os blocos criados por este email
      calendarioBuffer = calendarioBuffer.filter(
        (bloco) => bloco.userEmail !== email
      );
      const depois = calendarioBuffer.length;

      console.log(
        `Buffer limpo para ${email}: ${antes} -> ${depois} blocos restantes`
      );

      // Emite para todos os clientes que o buffer foi atualizado
      io.emit("bufferAtualizado", calendarioBuffer);
    });

    // Verificar conflitos para professor
    socket.on(
      "verificarConflitosProfessor",
      async ({
        professorId,
        eventStart,
        eventEnd,
        scheduleStartDate,
        scheduleEndDate,
        excludeBlockId,
        subjectId
      }) => {
        try {
          const dayOfWeek = new Date(eventStart).getDay() || 7;
          const startHour = new Date(eventStart).toTimeString().slice(0, 8);
          const endHour = new Date(eventEnd).toTimeString().slice(0, 8);

          console.log(
            "🟡 Verificar professor ocupado entre datas:",
            scheduleStartDate,
            scheduleEndDate
          );
          console.log(
            "Detalhes da requisição - Professor ID:",
            professorId,
            "Início evento:",
            eventStart,
            "Fim evento:",
            eventEnd,
            "Excluir bloco ID:",
            excludeBlockId
          );
          console.log(
            "Dia da semana:",
            dayOfWeek,
            "Horário início:",
            startHour,
            "Horário fim:",
            endHour
          );


          console.log("blocobuffer ", calendarioBuffer.blockId, " + ", excludeBlockId)
// ─── **Passo A: remover do buffer o próprio bloco** ────────
    const bufferSemProprio = calendarioBuffer.filter(b =>
      // compara strings para abranger both number e 'new-...'
      excludeBlockId != null &&
      String(b.blockId) === String(excludeBlockId)
        ? false    // ignora o próprio
        : true     // mantém todos os outros
    );

    console.log("tem que ser",bufferSemProprio)

          // 1. Buscar blocos da BD para o professor
          // FIXED: Changed Subject to Subjects
          let query = `
        SELECT b.*
        FROM Block b
        JOIN Schedule s ON b.ScheduleFK = s.Id
        JOIN SubjectsProfessors sp ON b.SubjectFK = sp.SubjectFK
        WHERE sp.PeopleFK = ?
          AND s.StartDate <= ?
          AND s.EndDate >= ?
      `;

          let queryParams = [professorId, scheduleEndDate, scheduleStartDate];

          // Add exclusion for current block if provided
          if (excludeBlockId && !isNaN(parseInt(excludeBlockId, 10))) {
            query += ` AND b.Id != ?`;
            queryParams.push(excludeBlockId);
            console.log(
              "Excluding block ID from professor check:",
              excludeBlockId
            );
          }

          const [todosOsBlocosProfessor] = await db.query(query, queryParams);

          console.log(
            `Total de blocos encontrados para o professor ${professorId}: ${todosOsBlocosProfessor.length}`
          );
          console.table(todosOsBlocosProfessor, [
            "Id",
            "SubjectFK",
            "StartHour",
            "EndHour",
            "DayOfWeek",
            "ScheduleFK",
          ]);

          // 2. Filtrar blocos do buffer para este professor e horário
          const blocosBuffer = bufferSemProprio.filter(
            (bloco) =>
              bloco.professorId === professorId &&
              bloco.dayOfWeek === dayOfWeek &&
              isTimeOverlapping(
                bloco.startHour,
                bloco.endHour,
                startHour,
                endHour
              )
          );

          // 3. Identificar blocos conflitantes da BD
          const blocosConflitantesBd = todosOsBlocosProfessor.filter(
            (b) =>
              b.DayOfWeek === dayOfWeek &&
              b.SubjectFK !== subjectId && 
              isTimeOverlapping(b.StartHour, b.EndHour, startHour, endHour)
              
          );

          console.log(
            `Blocos conflitantes BD encontrados: ${blocosConflitantesBd.length}`
          );
          console.table(blocosConflitantesBd, [
            "Id",
            "SubjectFK",
            "StartHour",
            "EndHour",
            "DayOfWeek",
            "ScheduleFK",
          ]);

          // 4. Marcar blocos BD como conflito se colidirem com BD ou buffer
          const blocosFinal = todosOsBlocosProfessor.map((b) => ({
            ...b,
            IsConflict:
              blocosConflitantesBd.some((conf) => conf.Id === b.Id) ||
              blocosBuffer.some(
                (conf) =>
                  conf.dayOfWeek === b.DayOfWeek &&
                  conf.startHour === b.StartHour &&
                  conf.endHour === b.EndHour
              ),
          }));

          // Formata blocos do buffer para o mesmo formato que blocosFinal, incluindo IsConflict = true
          const blocosBufferFormatados = blocosBuffer.map((b, idx) => ({
            Id: `buffer-${idx}`, // id fictício para o buffer
            SubjectFK: null,
            StartHour: b.startHour,
            EndHour: b.endHour,
            DayOfWeek: b.dayOfWeek,
            ScheduleFK: null,
            IsConflict: true,
          }));

          // Junta blocos BD com blocos do buffer
          const blocosParaEnviar = blocosFinal.concat(blocosBufferFormatados);

          // Verifica se algum bloco tem conflito
          const temConflito = blocosParaEnviar.some(
            (b) => b.IsConflict === true
          );

          if (temConflito) {
            console.log(
              "Enviando todos os blocos com flags de conflito para o frontend"
            );
            console.table(blocosParaEnviar);
            socket.emit("respostaConflitosProfessor", {
              professorId,
              blocos: blocosParaEnviar,
              total: blocosParaEnviar.filter((b) => b.IsConflict).length,
            });
          } else {
            console.log(
              `Nenhum conflito detectado para professor ${professorId}, enviando lista vazia.`
            );
            socket.emit("respostaConflitosProfessor", {
              professorId,
              blocos: [],
              total: 0,
            });
          }
        } catch (err) {
          console.error("❌ Erro ao verificar conflitos de professor:", err);
          socket.emit("respostaConflitosProfessor", {
            professorId,
            erro: "Erro ao verificar conflitos de professor",
            blocos: [],
            total: 0,
          });
        }
      }
    );


// Verificar conflitos para sala
socket.on("verificarConflitosSala", async ({
  roomId,
  eventStart,
  eventEnd,
  scheduleStartDate,
  scheduleEndDate,
  excludeBlockId,
}) => {
  try {
    // 0️⃣ cálculo de dia e horas
    const dayOfWeek = new Date(eventStart).getDay() || 7;
    const startHour = new Date(eventStart).toTimeString().slice(0, 8);
    const endHour   = new Date(eventEnd).toTimeString().slice(0, 8);

    console.log("🟡 Verificar sala ocupada entre datas:",
      scheduleStartDate, scheduleEndDate);
    console.log("Detalhes da requisição - Sala:", roomId,
      "Início evento:", eventStart,
      "Fim evento:", eventEnd,
      "Excluir bloco ID:", excludeBlockId);
    console.log("Dia da semana:", dayOfWeek,
      "Horário início:", startHour,
      "Horário fim:", endHour);

    // ─── Passo A: remover do buffer o próprio bloco ───────────
    const bufferSemProprio = calendarioBuffer.filter(b =>
      excludeBlockId != null && String(b.blockId) === String(excludeBlockId)
        ? false
        : true
    );
    console.log("➖ Buffer sem o próprio bloco:", bufferSemProprio);

    // 1️⃣ Buscar blocos da BD para a sala
    let query = `
      SELECT *
      FROM Block
      WHERE ClassroomFK = ?
        AND EXISTS (
          SELECT 1
          FROM Schedule s
          WHERE s.Id = Block.ScheduleFK
            AND s.StartDate <= ?
            AND s.EndDate >= ?
        )
    `;
    const queryParams = [roomId, scheduleEndDate, scheduleStartDate];
    if (excludeBlockId && !isNaN(parseInt(excludeBlockId, 10))) {
      query += ` AND Id != ?`;
      queryParams.push(parseInt(excludeBlockId, 10));
      console.log("➖ Excluindo da BD o bloco:", excludeBlockId);
    }
    const [todosOsBlocosSala] = await db.query(query, queryParams);

    // 2️⃣ Filtrar blocos do bufferSemProprio para a sala
    const blocosBuffer = bufferSemProprio.filter(b =>
      b.roomId    === roomId    &&
      b.dayOfWeek === dayOfWeek &&
      isTimeOverlapping(b.startHour, b.endHour, startHour, endHour)
    );
    console.log(`➖ Blocos de buffer em conflito para sala ${roomId}:`, blocosBuffer);

    // 3️⃣ Identificar blocos conflitantes na BD
    const blocosConflitantesBd = todosOsBlocosSala.filter(b =>
      b.DayOfWeek === dayOfWeek &&
      isTimeOverlapping(b.StartHour, b.EndHour, startHour, endHour)
    );
    console.log(`➖ Blocos BD em conflito para sala ${roomId}:`, blocosConflitantesBd);

    // 4️⃣ Marcar IsConflict em todos os blocos da BD
    const blocosFinal = todosOsBlocosSala.map(b => ({
      ...b,
      IsConflict:
        blocosConflitantesBd.some(conf => conf.Id === b.Id) ||
        blocosBuffer.some(conf =>
          conf.dayOfWeek === b.DayOfWeek &&
          conf.startHour === b.StartHour &&
          conf.endHour   === b.EndHour
        )
    }));

    // 5️⃣ Formatar blocos de buffer (todos IsConflict=true)
    const blocosBufferFormatados = blocosBuffer.map((b, idx) => ({
      Id:         `buffer-${idx}`,
      SubjectFK:  null,
      StartHour:  b.startHour,
      EndHour:    b.endHour,
      DayOfWeek:  b.dayOfWeek,
      ClassroomFK:b.roomId,
      CreatedBy:  b.professorName || "buffer",
      IsConflict: true
    }));

    // 6️⃣ Apenas enviar se houver pelo menos um conflito
    const blocosParaEnviar = blocosFinal.concat(blocosBufferFormatados);
    const temConflito = blocosParaEnviar.some(b => b.IsConflict);

    if (temConflito) {
      console.log(`Enviando ${blocosParaEnviar.length} blocos de conflito para sala ${roomId}:`);
      console.table(blocosParaEnviar, ["Id","StartHour","EndHour","DayOfWeek","IsConflict"]);
      socket.emit("respostaConflitosSala", {
        sala:   roomId,
        blocos: blocosParaEnviar,
        total:  blocosParaEnviar.filter(b => b.IsConflict).length
      });
    } else {
      console.log(`Nenhum conflito detectado para sala ${roomId}.`);
      socket.emit("respostaConflitosSala", {
        sala:   roomId,
        blocos: [],
        total:  0
      });
    }

  } catch (err) {
    console.error("❌ Erro ao verificar conflitos de sala:", err);
    socket.emit("respostaConflitosSala", {
      sala:   roomId,
      erro:  "Erro ao verificar conflitos de sala",
      blocos: [],
      total:  0
    });
  }
});



    // Desconexão
    socket.on("disconnect", () => {
      console.log(`WebSocket: Cliente desconectado - ${socket.id}`);
    });
  });
};
