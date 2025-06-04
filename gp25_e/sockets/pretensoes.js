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

    // ➖ Remover aula do buffer
    socket.on('removerSala', (dadosRemover) => {
      const { roomId, eventStart, eventEnd } = dadosRemover;

      // Convert input to ISO strings for consistent comparison
      const targetStart = new Date(eventStart).getTime();
      const targetEnd = new Date(eventEnd).getTime();

      const novaLista = calendarioBuffer.filter((aula) => {
        return !(
          aula.roomId === roomId &&
          new Date(aula.eventStart).getTime() === targetStart &&
          new Date(aula.eventEnd).getTime() === targetEnd
        );
      });

      console.log('Aula removida:', dadosRemover);
      console.log('Lista', novaLista);
      calendarioBuffer.length = 0;
      calendarioBuffer.push(...novaLista);

      console.log('Buffer atualizado após remoção:', calendarioBuffer);
      io.emit('bufferAtualizado', calendarioBuffer);
    });

    socket.on('disconnect', () => {
      console.log(`WebSocket: Cliente desconectado - ${socket.id}`);
    });
  });
};
