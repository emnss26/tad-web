import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

import accRouter from './routes/acc.router';

// Evironment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" } 
});

const PORT = process.env.PORT || 8080;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'TAD Cloud Core' });
});

//Websocket 
io.on('connection', (socket) => {
  console.log('Cliente MCP conectado:', socket.id);
  
  socket.on('mcp:request', (data) => {
    console.log('Recibido de Revit:', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Server static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../tad-web-frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../tad-web-frontend/dist', 'index.html'));
  });
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 TAD Server corriendo en puerto ${PORT}`);
});