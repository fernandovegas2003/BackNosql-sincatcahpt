import http from 'http';
import app from './app.js';
import 'dotenv/config';
import { connectDB } from './db.js';
import InitialSetup from './user&settings/schemas/initialSetup.js';

// Variables de entorno
const PROTOCOL = process.env.PROTOCOL || 'http';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    await InitialSetup.createRoles();

    const httpServer = http.createServer(app);

    httpServer.listen(PORT, HOST, () => {
      console.log(`✅ Servidor corriendo en ${PROTOCOL}://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
};

startServer();
