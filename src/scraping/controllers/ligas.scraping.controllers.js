import { spawn } from 'child_process';
import path from 'path';
import 'dotenv/config';

export const runScrapingLigas = async (req, res) => {
  try {
    // Ruta absoluta o relativa al script Python
    const scriptPath = path.resolve('process.env.PYTHON_SCRIPT_PATH');
    console.log('Ejecutando el script de Python...');

    const pythonProcess = spawn('python', [scriptPath]);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        res.json({ message: 'Scraping ejecutado correctamente', output });
      } else {
        res.status(500).json({ message: 'Error ejecutando el script de Python', code, error: errorOutput });
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};