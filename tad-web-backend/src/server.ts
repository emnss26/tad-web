import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { config } from './config';

// Routers
import accRouter from './routes/acc.router';
import authRouter from './routes/auth.router';
// import projectsRouter... (asegúrate de importar tus rutas)

// Type augmentation for Session Data
declare module 'express-session' {
  interface SessionData {
    token?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { 
    origin: config.urls.frontend,
    methods: ["GET", "POST"]
  } 
});

// Middlewares
app.use(cors({
  origin: config.urls.frontend,
  credentials: true // Crucial for sessions to work across ports/domains
}));
app.use(express.json());
app.use(cookieParser());

// Session Configuration
// In production (Render/AWS/Heroku), 'trust proxy' is required for secure cookies
if (config.env === 'production') {
  app.set('trust proxy', 1);
}

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevents JS access to the cookie
    secure: config.env === 'production', // HTTPS only in production
    maxAge: 60 * 60 * 1000, // 1 hour
    sameSite: config.env === 'production' ? 'none' : 'lax'
  }
}));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'TAD Cloud Core', env: config.env });
});

app.use('/api/auth', authRouter);
app.use('/api/acc', accRouter); // Example mounting

// Websocket Logic
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('mcp:request', (data) => {
    console.log('Received from Revit:', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve Static Files (Production)
if (config.env === 'production') {
  const staticPath = path.join(__dirname, '../../tad-web-frontend/dist');
  app.use(express.static(staticPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Start Server
httpServer.listen(config.port, () => {
  console.log(`🚀 TAD Server running on port ${config.port}`);
});