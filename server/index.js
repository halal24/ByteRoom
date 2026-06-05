const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow any origin to fix Vercel/Render CORS mismatch
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  },
});

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/execute', require('./routes/execute'));

// Socket.io logic
const socketHandler = require('./socket');
socketHandler(io);

// Database connection
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
