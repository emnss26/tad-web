import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { config } from './config';

// Routes
import accRouter from './routes/acc.router';
import authRouter from './routes/auth.router';

// ----------------------------------------------------------------------
// Type Definitions
// ----------------------------------------------------------------------
declare module 'express-session' {
  interface SessionData {
    token?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}

// ----------------------------------------------------------------------
// Server Initialization
// ----------------------------------------------------------------------
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { 
    origin: config.urls.frontend,
    methods: ["GET", "POST"]
  } 
});

// ----------------------------------------------------------------------
// Security & Utility Middlewares
// ----------------------------------------------------------------------

// 1. HTTP Headers Security (Helmet)
// Sets various HTTP headers to secure the app (XSS filter, no-sniff, etc.)
app.use(helmet({
  contentSecurityPolicy: config.env === 'production' ? undefined : false, // Disable CSP in dev if needed for Swagger/Tools
  crossOriginResourcePolicy: { policy: "cross-origin" } // Allow resources to be loaded if needed
}));

// 2. Compression (Gzip)
app.use(compression());

// 3. CORS Configuration
app.use(cors({
  origin: config.urls.frontend,
  credentials: true // Mandatory for sessions/cookies
}));

// 4. Rate Limiting (DDoS / Brute Force Protection)
// Limit: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  standardHeaders: true, 
  legacyHeaders: false, 
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});
app.use('/api', apiLimiter);

// 5. Body Parsers & Cookie Parser
app.use(express.json({ limit: '10mb' })); // Limit body size to prevent overflow attacks
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ----------------------------------------------------------------------
// Session Configuration
// ----------------------------------------------------------------------
if (config.env === 'production') {
  app.set('trust proxy', 1); // Required for secure cookies behind proxies (AWS/Heroku/Render)
}

app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Mitigates XSS cookie theft
    secure: config.env === 'production', // HTTPS required in production
    maxAge: 60 * 60 * 1000, // 1 hour
    sameSite: config.env === 'production' ? 'none' : 'lax'
  }
}));

// ----------------------------------------------------------------------
// Routes
// ----------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'TAD Cloud Core', env: config.env });
});

// API Endpoints
app.use('/api/auth', authRouter);
app.use('/api/acc', accRouter);

// ----------------------------------------------------------------------
// Socket.IO Logic
// ----------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);
  
  socket.on('mcp:request', (data) => {
    console.log('[Socket] Received from Revit:', data);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected:', socket.id);
  });
});

// ----------------------------------------------------------------------
// Static Files (Production Only)
// ----------------------------------------------------------------------
if (config.env === 'production') {
  const staticPath = path.join(__dirname, '../../tad-web-frontend/dist');
  app.use(express.static(staticPath));
  
  // SPA Fallback: Send index.html for any unknown route
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// ----------------------------------------------------------------------
// Global Error Handler
// ----------------------------------------------------------------------
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ServerError]', err.stack || err);
  res.status(err.status || 500).json({
    data: null,
    error: 'Internal Server Error',
    message: config.env === 'production' ? 'Something went wrong' : err.message
  });
});

// ----------------------------------------------------------------------
// Start Server
// ----------------------------------------------------------------------
httpServer.listen(config.port, () => {
  console.log(`🚀 TAD Server running on port ${config.port} | Env: ${config.env}`);
});