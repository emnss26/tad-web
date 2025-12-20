import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" } // Permitir conexiones del plugin de Revit
});

const PORT = process.env.PORT || 8080;

// Middlewares
app.use(cors());
app.use(express.json());

// --- AQUÍ IRÁN TUS RUTAS DE API (Auth, APS, IA) ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'TAD Cloud Core' });
});

// --- WEBSOCKETS (MCP PROXY) ---
io.on('connection', (socket) => {
  console.log('Cliente MCP conectado:', socket.id);
  
  socket.on('mcp:request', (data) => {
    // Aquí procesaremos la solicitud con IA y devolveremos la receta
    console.log('Recibido de Revit:', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// --- SERVIR FRONTEND EN PRODUCCIÓN (Clave para ahorrar costos) ---
// Cuando estemos en AWS (Docker), servimos los archivos estáticos de React
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../tad-web-frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../tad-web-frontend/dist', 'index.html'));
  });
}

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 TAD Server corriendo en puerto ${PORT}`);
});