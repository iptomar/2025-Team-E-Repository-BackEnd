require('dotenv').config(); // Load .env variables

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
// WS setup
const http = require('http');
const {Server} = require('socket.io');

const app = express();
const port = process.env.PORT || 3001;

const httpSV = http.createServer(app);
const io = new Server(httpSV, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// MySQL connection using env variables
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to database');
});

//Socket io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// GET /users
app.get('/users', (req, res) => {
  db.query('SELECT id, username, email, created_at FROM users', (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    io.emit('users_updated', results)

    res.json(results);
  });
});

httpSV.listen(port, () => {
  console.log(`API running on port ${port}`);
});
