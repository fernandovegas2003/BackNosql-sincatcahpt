import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import cors from 'cors';

// Importación de rutas
import authRoutes from './user&settings/routes/auth.routes.js';
import paymentRoutes from './user&settings/routes/payment.routes.js';
import paypalRoutes from './user&settings/routes/paypal.routes.js';
import settingsRoutes from './user&settings/routes/settings.routes.js';
import scrapingRoutes from './scraping/routes/partidos.scraping.routes.js';
import scrapingRoutesLigas from './scraping/routes/ligas.scraping.routes.js';
import googleAuthRoutes from './user&settings/routes/googleAuth.routes.js';

// Configuración de Passport
import passport from './user&settings/config/passport.js';
import session from 'express-session';

const app = express();

// 1. Configuración CORS mejorada
const allowedOrigins = [
  'http://localhost:5173',
  'http://13.218.132.66:5173', // IP de tu frontend
  'http://54.234.36.48:5173',  // IP de tu backend (por si acaso)
  'https://tudominio.com',
  process.env.FRONTEND_URL
].filter(Boolean); // Elimina valores undefined

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    // Verificar contra la lista de orígenes permitidos
    if (allowedOrigins.some(allowedOrigin => {
      return origin === allowedOrigin || 
             origin.startsWith(allowedOrigin.replace('http://', 'https://')) ||
             new URL(origin).hostname === new URL(allowedOrigin).hostname;
    })) {
      return callback(null, true);
    }
    
    console.warn(`⚠️ Origen no permitido por CORS: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-CSRF-Token',
    'Accept',
    'Origin'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // Cachear opciones CORS por 24 horas
};

// Aplicar CORS a todas las rutas
app.use(cors(corsOptions));

// 2. Middlewares esenciales
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// 3. Configuración de sesión mejorada
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  },
  name: 'sessionId' // Nombre personalizado para la cookie
}));

// 4. Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// 5. Rutas API
app.use('/api', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/scraping', scrapingRoutes);
app.use('/api/scraping', scrapingRoutesLigas);
app.use('/api/auth', googleAuthRoutes);

// 6. Middleware para manejar rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ 
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

// 7. Manejador de errores global mejorado
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  
  // Manejo específico para errores CORS
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acceso no permitido por política CORS',
      allowedOrigins: allowedOrigins.filter(o => o !== process.env.FRONTEND_URL)
    });
  }

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

export default app;