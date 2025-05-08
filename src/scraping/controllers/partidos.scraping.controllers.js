import { spawn } from 'child_process';
import { handleScrapingOutput } from '../utils/dataConverter.js'; // Import the converter utility

export const runScraping = async (req, res) => {
  try {
    const scriptPath = process.env.PYTHON_SCRAP_PATH;
    console.log('Ejecutando el script de Python...');

    const pythonProcess = spawn('python', [scriptPath]);

    let output = '';
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    let errorOutput = '';
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error('Error en el script de Python:', data.toString());
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Script ejecutado correctamente');
        
        try {
          // Use the converter utility to handle both JSON and text formats
          const data = handleScrapingOutput(output);
          
          res.json({ 
            message: 'Scraping ejecutado correctamente', 
            data 
          });
        } catch (parseError) {
          console.error('Error al procesar la salida:', parseError);
          res.status(500).json({ 
            message: 'Error al procesar la salida del script', 
            error: parseError.message,
            rawOutput: output
          });
        }
      } else {
        res.status(500).json({ 
          message: 'Error ejecutando el script de Python', 
          code,
          error: errorOutput 
        });
      }
    });
  } catch (error) {
    console.error('Error en el controlador:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};