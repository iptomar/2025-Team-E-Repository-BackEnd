const calendarioBuffer = [];
const db = require("../models/db");

// Verifica se há sobreposição entre dois intervalos de tempo (HH:mm:ss)
const isTimeOverlapping = (start1, end1, start2, end2) => {
  return start1 < end2 && end1 > start2;
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`WebSocket: Cliente conectado - ${socket.id}`);

    // ➕ Adicionar aula ao buffer
    socket.on("adicionarSala", (novaAula) => {
      const { roomId, startHour, endHour, dayOfWeek, professorName } = novaAula;

      // Verifica conflitos no buffer
      const conflito = calendarioBuffer.find((aula) => {
        return (
          aula.roomId === roomId &&
          aula.dayOfWeek === dayOfWeek &&
          isTimeOverlapping(aula.startHour, aula.endHour, startHour, endHour)
        );
      });

      if (conflito) {
        socket.emit("respostaBuffer", {
          status: "erro",
          motivo: "Já existe uma aula marcada nessa sala para esse horário.",
        });
        return;
      }

      // ✅ Adiciona ao buffer
      calendarioBuffer.push({
        roomId,
        dayOfWeek,
        startHour,
        endHour,
        professorName,
      });
      console.log("Adicionado ao buffer:", {
        roomId,
        dayOfWeek,
        startHour,
        endHour,
        professorName,
      });
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

   // Verificar conflitos para professor
socket.on(
  "verificarConflitosProfessor",
  async ({
    professorId,
    eventStart,
    eventEnd,
    scheduleStartDate,
    scheduleEndDate,
  }) => {
    try {
      const dayOfWeek = new Date(eventStart).getDay() || 7;
      const startHour = new Date(eventStart).toTimeString().slice(0, 8);
      const endHour = new Date(eventEnd).toTimeString().slice(0, 8);

      console.log("🟡 Verificar professor ocupado entre datas:", scheduleStartDate, scheduleEndDate);
      console.log("Detalhes da requisição - Professor ID:", professorId, "Início evento:", eventStart, "Fim evento:", eventEnd);
      console.log("Dia da semana:", dayOfWeek, "Horário início:", startHour, "Horário fim:", endHour);

      // 1. Buscar TODOS os blocos do professor dentro das datas fornecidas
      const [todosOsBlocosProfessor] = await db.query(
        `
        SELECT b.*
        FROM Block b
        JOIN Schedule s ON b.ScheduleFK = s.Id
        JOIN SubjectsProfessors sp ON b.SubjectFK = sp.SubjectFK
        WHERE sp.PeopleFK = ?
          AND s.StartDate <= ?
          AND s.EndDate >= ?
        `,
        [professorId, scheduleEndDate, scheduleStartDate]
      );

      console.log(`Total de blocos encontrados para o professor ${professorId}:`, todosOsBlocosProfessor.length);
      console.table(todosOsBlocosProfessor, ["Id", "SubjectFK", "StartHour", "EndHour", "DayOfWeek", "ScheduleFK"]);

      // 2. Identificar os blocos que colidem diretamente (conflitos)
      const blocosConflitantes = todosOsBlocosProfessor.filter(
        (b) =>
          b.DayOfWeek === dayOfWeek &&
          isTimeOverlapping(b.StartHour, b.EndHour, startHour, endHour)
      );

      console.log(`Blocos conflitantes encontrados: ${blocosConflitantes.length}`);
      console.table(blocosConflitantes, ["Id", "SubjectFK", "StartHour", "EndHour", "DayOfWeek", "ScheduleFK"]);

      // 3. Marcar cada bloco com flag IsConflict para frontend
      const blocosFinal = todosOsBlocosProfessor.map((b) => ({
        ...b,
        IsConflict: blocosConflitantes.some((conf) => conf.Id === b.Id),
      }));

      console.table(
        blocosFinal.map(({ Id, SubjectFK, StartHour, EndHour, DayOfWeek, ScheduleFK, IsConflict }) => ({
          Id,
          SubjectFK,
          StartHour,
          EndHour,
          DayOfWeek,
          ScheduleFK,
          IsConflict,
        }))
      );

      // 4. Enviar TODOS os blocos (conflitos e ocupados) só se houver conflito, senão lista vazia
      if (blocosConflitantes.length > 0) {
        console.log("Enviando todos os blocos com flags de conflito para o frontend");
        socket.emit("respostaConflitosProfessor", {
          professorId,
          blocos: blocosFinal,
          total: blocosConflitantes.length,
        });
      } else {
        console.log(`Nenhum conflito detectado para o professor ${professorId}, enviando lista vazia.`);
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
socket.on(
  "verificarConflitosSala",
  async ({
    roomId,
    eventStart,
    eventEnd,
    scheduleStartDate,
    scheduleEndDate,
  }) => {
    try {
      console.log("🟡 Verificar sala ocupada entre datas:", scheduleStartDate, scheduleEndDate);
      console.log("Detalhes da requisição - Sala:", roomId, "Início evento:", eventStart, "Fim evento:", eventEnd);

      const dayOfWeek = new Date(eventStart).getDay() || 7;
      const startHour = new Date(eventStart).toTimeString().slice(0, 8);
      const endHour = new Date(eventEnd).toTimeString().slice(0, 8);

      console.log("Dia da semana:", dayOfWeek, "Horário início:", startHour, "Horário fim:", endHour);

      // 1. Buscar TODOS os blocos dessa sala dentro das datas fornecidas
      const [todosOsBlocosSala] = await db.query(
        `
        SELECT * FROM Block
        WHERE ClassroomFK = ?
          AND EXISTS (
            SELECT 1
            FROM Schedule s
            WHERE s.Id = Block.ScheduleFK
              AND s.StartDate <= ?
              AND s.EndDate >= ?
          )
        `,
        [roomId, scheduleEndDate, scheduleStartDate]
      );

      console.log(`Total de blocos encontrados para a sala ${roomId}: ${todosOsBlocosSala.length}`);

      // Exibir todos os blocos em tabela
      console.table(todosOsBlocosSala, ["Id", "SubjectFK", "StartHour", "EndHour", "DayOfWeek", "ClassroomFK", "CreatedBy"]);

      // 2. Identificar os blocos que colidem diretamente (conflitos)
      const blocosConflitantes = todosOsBlocosSala.filter(
        (b) =>
          b.DayOfWeek === dayOfWeek &&
          isTimeOverlapping(b.StartHour, b.EndHour, startHour, endHour)
      );

      console.log(`Blocos conflitantes encontrados: ${blocosConflitantes.length}`);

      // Exibir blocos conflitantes em tabela
      console.table(blocosConflitantes, ["Id", "SubjectFK", "StartHour", "EndHour", "DayOfWeek", "ClassroomFK", "CreatedBy"]);

      // 3. Marcar cada bloco com flag IsConflict para frontend
      const blocosFinal = todosOsBlocosSala.map((b) => ({
        ...b,
        IsConflict: blocosConflitantes.some((conf) => conf.Id === b.Id),
      }));

      // Exibir blocos finais com flag IsConflict
      console.table(
        blocosFinal.map(({ Id, SubjectFK, StartHour, EndHour, DayOfWeek, ClassroomFK, CreatedBy, IsConflict }) => ({
          Id,
          SubjectFK,
          StartHour,
          EndHour,
          DayOfWeek,
          ClassroomFK,
          CreatedBy,
          IsConflict,
        }))
      );

      // Só enviar todos os blocos se houver pelo menos 1 conflito
      if (blocosConflitantes.length > 0) {
        console.log("Enviando todos os blocos com flags de conflito para o frontend");
        socket.emit("respostaConflitosSala", {
          sala: roomId,
          blocos: blocosFinal,
          total: blocosConflitantes.length,
        });
      } else {
        console.log(`Nenhum conflito detectado para sala ${roomId}, enviando lista vazia.`);
        socket.emit("respostaConflitosSala", {
          sala: roomId,
          blocos: [],
          total: 0,
        });
      }
    } catch (err) {
      console.error("❌ Erro ao verificar conflitos:", err);
      socket.emit("respostaConflitosSala", {
        sala: roomId,
        erro: "Erro ao verificar conflitos",
        blocos: [],
        total: 0,
      });
    }
  }
);





    // Desconexão
    socket.on("disconnect", () => {
      console.log(`WebSocket: Cliente desconectado - ${socket.id}`);
    });
  });
};
