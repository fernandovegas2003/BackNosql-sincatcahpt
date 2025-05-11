// Importaciones necesarias
import http from 'http';
import app from './app.js';
import 'dotenv/config';
import { connectDB } from './db.js';
import InitialSetup from './user&settings/schemas/initialSetup.js';

// Configuración mejorada con valores por defecto
const PROTOCOL = process.env.PROTOCOL || 'http';
const HOST = process.env.HOST || '0.0.0.0'; // Escucha en todas las interfaces
const PORT = process.env.PORT || 3005;

// Mejores prácticas para manejo de señales de terminación
const shutdown = (server, signal) => {
  console.log(`🛑 Recibida señal ${signal}, cerrando servidor...`);
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });

  // Forzar cierre después de 5 segundos si no se completa
  setTimeout(() => {
    console.error('⚠️ Forzando cierre del servidor...');
    process.exit(1);
  }, 5000);
};

/**
 * @function startServer
 * @description Inicializa y configura el servidor HTTP con manejo mejorado de errores
 */
const startServer = async () => {
  try {
    // 1. Conectar a la base de datos con reintentos
    let retries = 5;
    while (retries > 0) {
      try {
        await connectDB();
        console.log('✅ Conexión a la base de datos establecida.');
        break;
      } catch (dbError) {
        retries--;
        console.error(`❌ Error al conectar a DB. Reintentos restantes: ${retries}`, dbError);
        if (retries === 0) throw dbError;
        await new Promise(res => setTimeout(res, 5000)); // Esperar 5 segundos
      }
    }

    // 2. Configuraciones iniciales con manejo de errores
    try {
      await InitialSetup.createRoles();
      console.log('✅ Configuraciones iniciales completadas.');
    } catch (setupError) {
      console.error('⚠️ Error en configuraciones iniciales:', setupError);
      // No es crítico, podemos continuar
    }

    // 3. Crear servidor HTTP con timeout configurado
    const httpServer = http.createServer(app);
    httpServer.keepAliveTimeout = 60000; // 60 segundos
    httpServer.headersTimeout = 65000; // 65 segundos

    // 4. Iniciar servidor con verificación de entorno
    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 Servidor ${process.env.NODE_ENV || 'development'} iniciado:`);
      console.log(`   • URL: ${PROTOCOL}://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
      console.log(`   • Accesible externamente en: ${PROTOCOL}://<TU_IP_PUBLICA>:${PORT}`);
      console.log(`   • Tiempo de espera: ${httpServer.keepAliveTimeout}ms`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('\n🔹 Configuración CORS:');
        console.log('   • Orígenes permitidos:', app._router.stack
          .find(layer => layer.name === 'corsMiddleware')?.handle?.allowedOrigins || 'No configurado');
      }
    });

    // 5. Manejo mejorado de errores del servidor
    httpServer.on('error', (error) => {
      console.error('❌ Error del servidor:', error.message);
      
      switch (error.code) {
        case 'EACCES':
          console.error(`   → El puerto ${PORT} requiere privilegios elevados (sudo)`);
          break;
        case 'EADDRINUSE':
          console.error(`   → El puerto ${PORT} está en uso. Intenta con otro puerto o mata el proceso:`);
          console.error(`     Comando para Linux/Mac: lsof -i :${PORT} | grep LISTEN`);
          console.error(`     Comando para Windows: netstat -ano | findstr :${PORT}`);
          break;
        case 'ECONNRESET':
          console.error('   → Conexión reseteada por el cliente');
          return; // No es fatal
        default:
          console.error('   → Error no manejado:', error.stack);
      }
      
      process.exit(1);
    });

    // 6. Manejo de señales para apagado limpio
    process.on('SIGTERM', () => shutdown(httpServer, 'SIGTERM'));
    process.on('SIGINT', () => shutdown(httpServer, 'SIGINT'));
    process.on('uncaughtException', (err) => {
      console.error('⚠️ Excepción no capturada:', err);
      shutdown(httpServer, 'uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      console.error('⚠️ Rechazo no manejado:', reason);
    });

  } catch (error) {
    console.error('💥 Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor con manejo de promesas no controladas
startServer()
  .catch(error => {
    console.error('💣 Error no controlado en startServer:', error);
    process.exit(1);
  });