
const pretensoes = {}; // buffer de pretensões
const calendarioBuffer = []; // novo buffer de ações do calendário

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`WebSocket: Cliente conectado - ${socket.id}`);

    // ✅ NOVO: Quando o usuário adiciona uma sala no calendário
    socket.on('adicionarSala', (dados) => {
      console.log("Sala adicionada ao calendário:", dados);
      calendarioBuffer.push(dados);
      io.emit('salaAdicionada', dados); // notifica todos os clientes, se quiser
    });

    socket.on('disconnect', () => {
      console.log(`WebSocket: Cliente desconectado - ${socket.id}`);
    });
  });
};
