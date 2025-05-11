import express from 'express';
import morgan from 'morgan'; // Logger de peticiones HTTP
import cookieParser from 'cookie-parser'; // Para parsear cookies
import 'dotenv/config'; // Carga variables de entorno
import cors from 'cors'; // Para manejar Cross-Origin Resource Sharing

// Importación de tus módulos de rutas
import authRoutes from './user&settings/routes/auth.routes.js';
import paymentRoutes from './user&settings/routes/payment.routes.js';
import paypalRoutes from './user&settings/routes/paypal.routes.js';
import settingsRoutes from './user&settings/routes/settings.routes.js';
import scrapingRoutes from './scraping/routes/partidos.scraping.routes.js';
import scrapingRoutesLigas from './scraping/routes/ligas.scraping.routes.js';
import googleAuthRoutes from './user&settings/routes/googleAuth.routes.js';

// Configuración de Passport y sesión
import passport from './user&settings/config/passport.js'; // Tu configuración de Passport
import session from 'express-session'; // Para manejar sesiones

// Inicialización de la aplicación Express
const app = express();

// --- Middlewares Esenciales ---

// 1. Middleware para Stripe Webhook (MUY IMPORTANTE: debe ir ANTES de express.json())
// Stripe requiere el cuerpo de la solicitud en formato raw para verificar la firma.
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// 2. Configuración de CORS (Cross-Origin Resource Sharing)
// Define qué orígenes (dominios) pueden acceder a tu API.
const allowedOrigins = [
  'http://localhost:5173',  // Frontend de desarrollo local
  'http://localhost:3005',  // Si el backend y frontend corren en el mismo server/puerto (menos común para API)
  // --- IMPORTANTE PARA AZURE ---
  // Añade aquí la URL pública de tu frontend si está en un dominio diferente.
  // Si accedes a tu API directamente desde un navegador usando la IP pública de Azure,
  // es posible que necesites añadir esa IP o el dominio asociado.
  // Ejemplo: 'https://tufrontend.azurewebsites.net'
  // Ejemplo: 'http://<TU_IP_PUBLICA_AZURE>:<PUERTO_FRONTEND_SI_APLICA>'
  'https://tudominio.com',   // Tu dominio de producción
  // Considera añadir la IP pública de tu VM si haces pruebas directas o si alguna herramienta lo requiere.
  // process.env.FRONTEND_URL // También puedes usar variables de entorno
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin 'origin' (ej. Postman, curl, apps móviles) Y
    // solicitudes desde los orígenes en 'allowedOrigins'.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origen no permitido: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Métodos HTTP permitidos
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'], // Encabezados permitidos
  credentials: true, // ¡IMPORTANTE para enviar y recibir cookies o tokens de autorización!
  optionsSuccessStatus: 200 // Algunos navegadores antiguos (IE11) pueden tener problemas con 204
}));

// 3. Logger de peticiones HTTP (morgan)
// 'dev' es un formato conciso y coloreado para desarrollo.
app.use(morgan('dev'));

// 4. Middleware para parsear JSON
// Permite que Express entienda cuerpos de solicitud en formato JSON.
app.use(express.json({ limit: '10mb' })); // Aumenta el límite si manejas JSON grandes

// 5. Middleware para parsear Cookies
// Permite acceder a `req.cookies`.
app.use(cookieParser(process.env.COOKIE_SECRET || 'tu_super_secreto_para_cookies'));

// --- Configuración de Sesión y Autenticación (Passport) ---
// Debe ir DESPUÉS de cookieParser y ANTES de las rutas que usan autenticación.
app.use(session({
  secret: process.env.SESSION_SECRET || 'un_secreto_de_sesion_muy_fuerte', // ¡Cambia esto en producción!
  resave: false, // No guardar la sesión si no se modificó
  saveUninitialized: false, // No crear sesión hasta que algo se guarde
  // store: // Considera usar un store de sesión persistente para producción (ej. connect-mongo, connect-redis)
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Usar cookies seguras (HTTPS) en producción
    httpOnly: true, // Prevenir acceso a cookies desde JavaScript del lado del cliente
    maxAge: 24 * 60 * 60 * 1000 // Tiempo de vida de la cookie (ej. 1 día)
  }
}));

app.use(passport.initialize()); // Inicializa Passport
app.use(passport.session());    // Permite sesiones persistentes de login

// --- Definición de Rutas de la API ---
// Monta tus diferentes módulos de rutas bajo un prefijo común (ej. '/api').
app.use('/api', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/paypal', paypalRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/scraping', scrapingRoutes);
app.use('/api/scraping', scrapingRoutesLigas); // Nota: Mismo prefijo para dos rutas de scraping. Considera diferenciarlos si es necesario.
app.use('/api/auth', googleAuthRoutes); // Rutas específicas para autenticación con Google

// --- Manejo de Rutas No Encontradas (404) ---
// Si ninguna ruta anterior coincide, esta se ejecutará.
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint no encontrado' });
});

// --- Manejador de Errores Global ---
// Middleware de manejo de errores con 4 parámetros (err, req, res, next).
// Se activará si cualquier ruta o middleware anterior llama a `next(error)`.
app.use((err, req, res, next) => {
  console.error("----------------------------------------");
  console.error("Ha ocurrido un error no controlado:");
  console.error("Ruta:", req.method, req.originalUrl);
  if (req.body && Object.keys(req.body).length > 0) {
    console.error("Cuerpo de la petición:", req.body);
  }
  console.error("Error:", err.message);
  console.error("Stack:", err.stack);
  console.error("----------------------------------------");

  // No envíes el stack de error al cliente en producción por seguridad
  const statusCode = err.status || err.statusCode || 500;
  const errorMessage = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Error interno del servidor.'
    : err.message || 'Ha ocurrido un error.';

  res.status(statusCode).json({
    message: errorMessage,
    // ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }) // Opcional: stack en desarrollo
  });
});


// (Opcional) Manejo explícito de OPTIONS para todas las rutas si el CORS principal no es suficiente.
// app.options('*', cors()); // La configuración de `cors()` ya debería manejar esto.
// Si lo habilitas, asegúrate que sea compatible con tu configuración de `cors` principal.

export default app;
