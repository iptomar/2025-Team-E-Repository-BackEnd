const express = require('express');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

// Criar servidor HTTP
const httpSV = http.createServer(app);

// Criar instância do socket.io
const io = new Server(httpSV, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

require('./sockets/pretensoes.js')(io);

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', userRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/admin', adminRoutes);

// Apenas se quiser registrar algo direto no index (não obrigatório aqui)
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
httpSV.listen(PORT, () => console.log(`Server running on port ${PORT}`));
