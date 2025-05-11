// Importaciones necesarias
import http from 'http';
import app from './app.js'; // Importa la configuración de Express desde app.js
import 'dotenv/config'; // Para cargar variables de entorno desde .env
import { connectDB } from './db.js'; // Tu función para conectar a la base de datos
import InitialSetup from './user&settings/schemas/initialSetup.js'; // Para configuración inicial (roles, etc.)

// Variables de entorno con valores por defecto
const PROTOCOL = process.env.PROTOCOL || 'http';
// HOST: Escuchar en '0.0.0.0' es crucial para aceptar conexiones desde CUALQUIER IP.
// Si usas 'localhost' (127.0.0.1), solo aceptará conexiones locales desde dentro de la VM.
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3005; // Asegúrate que este puerto esté abierto en Azure (NSG y Firewall de la VM)

/**
 * @function startServer
 * @description Inicializa la conexión a la base de datos, realiza configuraciones iniciales
 * y arranca el servidor HTTP.
 */
const startServer = async () => {
  try {
    // 1. Conectar a la base de datos
    await connectDB();
    console.log('✅ Conexión a la base de datos establecida.');

    // 2. Realizar configuraciones iniciales (ej. crear roles por defecto si no existen)
    // Es una buena práctica encapsular esto para que solo se ejecute si es necesario.
    await InitialSetup.createRoles();
    console.log('✅ Configuraciones iniciales verificadas/realizadas.');

    // 3. Crear el servidor HTTP utilizando la aplicación Express
    const httpServer = http.createServer(app);

    // 4. Poner el servidor a escuchar en el HOST y PORT especificados
    httpServer.listen(PORT, HOST, () => {
      console.log(`✅ Servidor corriendo en ${PROTOCOL}://${HOST}:${PORT}`);
      if (HOST === '0.0.0.0') {
        console.log(`✅ El servidor es accesible desde cualquier interfaz de red en el puerto ${PORT}.`);
        console.log(`   Para acceder desde fuera de la VM, usa la IP pública de la VM: ${PROTOCOL}://<TU_IP_PUBLICA_AZURE>:${PORT}`);
      } else {
        console.log(`⚠️ El servidor está configurado para escuchar solo en ${HOST}. Puede no ser accesible desde fuera.`);
      }
    });

    // Manejo de errores del servidor (opcional pero recomendado)
    httpServer.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      // Manejar errores específicos de "listen" como puerto en uso
      switch (error.code) {
        case 'EACCES':
          console.error(`❌ El puerto ${PORT} requiere privilegios elevados.`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ El puerto ${PORT} ya está en uso.`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1); // Termina el proceso si hay un error crítico al iniciar
  }
};

// Iniciar el servidor
startServer();
