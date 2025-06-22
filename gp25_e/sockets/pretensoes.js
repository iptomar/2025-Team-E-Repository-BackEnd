let calendarioBuffer = [];
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
      const {
        roomId,
        startHour,
        endHour,
        dayOfWeek,
        professorName,
        professorId,
        userEmail,
      } = novaAula;

      // Verifica conflitos no buffer (só sala, não professor aqui)
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
        professorId,
        userEmail,
      });
      console.log("Adicionado ao buffer:", {
        roomId,
        dayOfWeek,
        startHour,
        endHour,
        professorName,
        professorId,
        userEmail
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
            eventEnd
          );
          console.log(
            "Dia da semana:",
            dayOfWeek,
            "Horário início:",
            startHour,
            "Horário fim:",
            endHour
          );

          // 1. Buscar blocos da BD para o professor
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

          console.log(
            `Total de blocos encontrados para o professor ${professorId}:`,
            todosOsBlocosProfessor.length
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
          const blocosBuffer = calendarioBuffer.filter(
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
          const dayOfWeek = new Date(eventStart).getDay() || 7;
          const startHour = new Date(eventStart).toTimeString().slice(0, 8);
          const endHour = new Date(eventEnd).toTimeString().slice(0, 8);

          console.log(
            "🟡 Verificar sala ocupada entre datas:",
            scheduleStartDate,
            scheduleEndDate
          );
          console.log(
            "Detalhes da requisição - Sala:",
            roomId,
            "Início evento:",
            eventStart,
            "Fim evento:",
            eventEnd
          );
          console.log(
            "Dia da semana:",
            dayOfWeek,
            "Horário início:",
            startHour,
            "Horário fim:",
            endHour
          );

          // 1. Buscar blocos da BD para a sala
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

          console.log(
            `Total de blocos encontrados para a sala ${roomId}: ${todosOsBlocosSala.length}`
          );
          console.table(todosOsBlocosSala, [
            "Id",
            "SubjectFK",
            "StartHour",
            "EndHour",
            "DayOfWeek",
            "ClassroomFK",
            "CreatedBy",
          ]);

          // 2. Buscar blocos do buffer para a sala
          const blocosBuffer = calendarioBuffer.filter(
            (bloco) =>
              bloco.roomId === roomId &&
              bloco.dayOfWeek === dayOfWeek &&
              isTimeOverlapping(
                bloco.startHour,
                bloco.endHour,
                startHour,
                endHour
              )
          );

          console.log(
            `Total de blocos encontrados no buffer para a sala ${roomId}: ${blocosBuffer.length}`
          );
          console.table(blocosBuffer, [
            "roomId",
            "professorId",
            "startHour",
            "endHour",
            "dayOfWeek",
          ]);

          // 3. Encontrar blocos conflitantes na BD para a sala
          const blocosConflitantesBd = todosOsBlocosSala.filter(
            (b) =>
              b.DayOfWeek === dayOfWeek &&
              isTimeOverlapping(b.StartHour, b.EndHour, startHour, endHour)
          );

          console.log(
            `Blocos conflitantes encontrados na BD para a sala ${roomId}: ${blocosConflitantesBd.length}`
          );
          console.table(blocosConflitantesBd, [
            "Id",
            "SubjectFK",
            "StartHour",
            "EndHour",
            "DayOfWeek",
            "ClassroomFK",
            "CreatedBy",
          ]);

          // 4. Marcar cada bloco da BD como conflito se colidir com blocos da BD ou do buffer
          const blocosFinal = todosOsBlocosSala.map((b) => ({
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

          // Formatar os blocos do buffer para ter a mesma estrutura dos da BD
          const blocosBufferFormatados = blocosBuffer.map((bloco, idx) => ({
            Id: `buffer-${idx}`,
            SubjectFK: null,
            StartHour: bloco.startHour,
            EndHour: bloco.endHour,
            DayOfWeek: bloco.dayOfWeek,
            ClassroomFK: bloco.roomId || null,
            CreatedBy: bloco.professorName || "buffer",
            IsConflict: true, // estes são blocos do buffer, que já estão a impedir uso, logo são conflitos
          }));

          // Juntar blocos da BD com os do buffer
          const blocosParaEnviar = blocosFinal.concat(blocosBufferFormatados);

          // Só enviar se houver algum conflito (em BD ou buffer)
          const temConflito =
            blocosParaEnviar.some((b) => b.IsConflict) ||
            blocosBufferFormatados.length > 0;

          console.log(`Blocos finais com flag IsConflict para sala ${roomId}:`);
          console.table(
            blocosParaEnviar.map(
              ({
                Id,
                SubjectFK,
                StartHour,
                EndHour,
                DayOfWeek,
                ClassroomFK,
                CreatedBy,
                IsConflict,
              }) => ({
                Id,
                SubjectFK,
                StartHour,
                EndHour,
                DayOfWeek,
                ClassroomFK,
                CreatedBy,
                IsConflict,
              })
            )
          );

          if (temConflito) {
            socket.emit("respostaConflitosSala", {
              sala: roomId,
              blocos: blocosFinal,
              total: blocosFinal.filter((b) => b.IsConflict).length,
            });
          } else {
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
