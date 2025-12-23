import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import createMemoryStore from 'memorystore'; // Librería para gestión eficiente de RAM
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { config } from './config';

// Routers
import accRouter from './routes/acc.router';
import authRouter from './routes/auth.router';

// ----------------------------------------------------------------------
// 1. Definición de Tipos (TypeScript)
// ----------------------------------------------------------------------
declare module 'express-session' {
  interface SessionData {
    token?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}

// ----------------------------------------------------------------------
// 2. Inicialización del Servidor
// ----------------------------------------------------------------------
const app = express();
const httpServer = createServer(app);
const MemoryStore = createMemoryStore(session); // Inicializamos el store optimizado

const io = new Server(httpServer, {
  cors: { 
    origin: config.urls.frontend,
    methods: ["GET", "POST"]
  } 
});

// ----------------------------------------------------------------------
// 3. Middlewares de Seguridad y Utilidad
// ----------------------------------------------------------------------

// A. Seguridad de Cabeceras HTTP (Protección XSS, Sniffing, etc.)
app.use(helmet({
  contentSecurityPolicy: config.env === 'production' ? undefined : false, 
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// B. Compresión Gzip (Mejora velocidad y reduce ancho de banda)
app.use(compression());

// C. Configuración CORS (Permite cookies entre Front y Back)
app.use(cors({
  origin: config.urls.frontend,
  credentials: true 
}));

// D. Limitación de Tasa (Protección anti-DDoS básica)
// Límite: 200 peticiones por 15 min por IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 200, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.'
});
app.use('/api', apiLimiter);

// E. Parsers de Cuerpo y Cookies
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ----------------------------------------------------------------------
// 4. Configuración de Sesión (Optimizada para AWS Low-Cost)
// ----------------------------------------------------------------------
if (config.env === 'production') {
  app.set('trust proxy', 1); // Necesario para AWS (Load Balancers/Nginx)
}

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  // Aquí está la magia para no gastar dinero extra:
  store: new MemoryStore({
    checkPeriod: 86400000 // Elimina sesiones expiradas cada 24h para liberar RAM
  }),
  cookie: {
    httpOnly: true, // Seguridad: JS del front no puede leer la cookie
    secure: config.env === 'production', // Solo HTTPS en producción
    maxAge: 60 * 60 * 1000, // 1 hora de vida
    sameSite: config.env === 'production' ? 'none' : 'lax'
  }
}));

// ----------------------------------------------------------------------
// 5. Rutas de la API
// ----------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'TAD Cloud Core', env: config.env });
});

app.use('/api/auth', authRouter);
app.use('/api/acc', accRouter);

// ----------------------------------------------------------------------
// 6. Lógica de WebSockets (Socket.IO)
// ----------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log('[Socket] Cliente conectado:', socket.id);
  
  socket.on('mcp:request', (data) => {
    console.log('[Socket] Recibido de Revit:', data);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Cliente desconectado:', socket.id);
  });
});

// ----------------------------------------------------------------------
// 7. Archivos Estáticos (Solo Producción)
// ----------------------------------------------------------------------
if (config.env === 'production') {
  // CAMBIO AQUÍ: Ahora apuntamos a una carpeta 'public' relativa al build
  const staticPath = path.join(__dirname, '../public'); 
  
  app.use(express.static(staticPath));
  
  // SPA Fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// ----------------------------------------------------------------------
// 8. Manejo Global de Errores (Evita caídas del servidor)
// ----------------------------------------------------------------------
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ServerError]', err.stack || err);
  res.status(err.status || 500).json({
    data: null,
    error: 'Internal Server Error',
    message: config.env === 'production' ? 'Ha ocurrido un error inesperado' : err.message
  });
});

// ----------------------------------------------------------------------
// 9. Iniciar Servidor
// ----------------------------------------------------------------------
httpServer.listen(config.port, () => {
  console.log(`🚀 TAD Server corriendo en puerto ${config.port} | Env: ${config.env}`);
});