const calendarioBuffer = [];

// Veirfies if there's overlapping 
const isOverlapping = (existsStart, existsEnd, newStart, newEnd) => {
    // a aula que estamos a colocar termina antes e começa depois
    // isOverlapping = false. 
    return existsStart < newEnd && existsEnd > newStart;
};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`WebSocket: Cliente conectado - ${socket.id}`);

    // add classes to buffer after verifying overlapping
    socket.on('adicionarSala', (novaAula) => {
      const { roomId, eventStart, eventEnd } = novaAula;

      const newStart = new Date(eventStart);
      const newEnd = new Date(eventEnd);

      // verify ovelap if roomid exists in buffer
      const conflito = calendarioBuffer.find((aula) => {
        return (
          aula.roomId === roomId &&
          // verifica se existe sobreposicao
          isOverlapping(
            newStart, 
            newEnd, 
            new Date(aula.eventStart), 
            new Date(aula.eventEnd))
        );
      });

      if (conflito) {
          socket.emit('respostaBuffer', { status: "erro", motivo: 'Já existe uma aula marcada nessa sala para esse horário.' });
          return;
      } else{
          calendarioBuffer.push(novaAula);
          // para testes
          console.log("Adicionado ao buffer:", novaAula);
          console.log('bufferAtualizado', calendarioBuffer);
          
          socket.emit('respostaBuffer', { status: 'ok' });
          // Sends buffer to all conected clients
          io.emit('bufferAtualizado', calendarioBuffer);
      }
    });

    // ➖ Remover aula do buffer (por ID, horário ou outro critério)
    socket.on('removerSala', (dadosRemover) => {
      const { roomId, eventStart, eventEnd } = dadosRemover;

      const novaLista = calendarioBuffer.filter((aula) => {
        return !(
          aula.roomId === roomId &&
          aula.eventStart === eventStart &&
          aula.eventEnd === eventEnd
        );
      });

      calendarioBuffer.push(...novaLista);

      console.log('bufferAtualizado', calendarioBuffer);
    });

    socket.on('disconnect', () => {
      console.log(`WebSocket: Cliente desconectado - ${socket.id}`);
    });
  });
};
