import express from 'express';
import morgan from 'morgan';
import authRoutes from './user&settings/routes/auth.routes.js';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import paymentRoutes from './user&settings/routes/payment.routes.js';
import paypalRoutes from './user&settings/routes/paypal.routes.js';
import settingsRoutes from './user&settings/routes/settings.routes.js';
import scrapingRoutes from './scraping/routes/partidos.scraping.routes.js';
import passport from './user&settings/config/passport.js';
import session from 'express-session';
import googleAuthRoutes from './user&settings/routes/googleAuth.routes.js';
import scrapingRoutesLigas from './scraping/routes/ligas.scraping.routes.js';
import cors from 'cors';

const app = express();

// *** Stripe webhook raw body middleware (antes de express.json) ***  
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));


// Configuración de CORS
const allowedOrigins = [
  'http://localhost:5173',  // <--- tu dominio local de frontend
  'https://tudominio.com',   // <--- tu dominio de producción
];

// Middleware de CORS
app.use(cors({
  origin: function (origin, callback) {
    // Permite peticiones sin origen (como Postman) o si el origen está en la lista
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Asegúrate de permitir estos métodos
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Permite los encabezados necesarios
  credentials: true, // ¡IMPORTANTE para cookies!
}));

// Resto de middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Rutas
app.use('/api', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/scraping', scrapingRoutes);
app.use('/api/scraping', scrapingRoutesLigas);

// Configuración de sesión y autenticación
app.use(session({
  secret: process.env.SESSION_SECRET || 'some secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Ruta para autenticación con Google
app.use('/api/auth', googleAuthRoutes);

// Respuesta para las solicitudes OPTIONS (preflight)
app.options('*', cors()); // Permite todas las solicitudes OPTIONS

export default app;
