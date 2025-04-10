const express = require('express');
require('dotenv').config();

const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');

const app = express();

// Routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes (JWT via authMiddleware)
app.use('/api/users', userRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/admin', adminRoutes);


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
