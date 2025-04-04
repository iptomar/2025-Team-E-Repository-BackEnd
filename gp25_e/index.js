const express = require('express');
require('dotenv').config();

const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');

const app = express();
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes); // 🔐


// WS
const httpSV = http.createServer(app);
const io = new Server(httpSV, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});


// Socket io connection handler
io.on('connection', (socket) => {
    console.log(`User connected:  ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
httpSV.listen(PORT, () => console.log(`Server running on port ${PORT}`));
