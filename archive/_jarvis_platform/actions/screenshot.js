// actions/screenshot.js
// Acción real: Captura de pantalla del sistema

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class ScreenshotAction {
  constructor() {
    this.name = 'screenshot';
    this.description = 'Captura la pantalla actual y guarda la imagen';
    this.defaultPath = path.join(process.cwd(), 'screenshots');
  }

  /**
   * Ejecuta captura de pantalla
   * @param {Object} params - Parámetros de la acción
   * @param {string} params.filename - Nombre del archivo (opcional)
   * @param {string} params.path - Ruta donde guardar (opcional)
   * @param {string} params.format - Formato de imagen (png, jpg)
   * @returns {Object} Resultado de la captura
   */
  async execute(params = {}) {
    const {
      filename = `screenshot_${Date.now()}`,
      path: savePath = this.defaultPath,
      format = 'png'
    } = params;

    try {
      // Crear directorio si no existe
      if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath, { recursive: true });
      }

      const fullPath = path.join(savePath, `${filename}.${format}`);

      // Ejecutar captura según plataforma
      if (process.platform === 'win32') {
        await this.captureWindows(fullPath);
      } else if (process.platform === 'darwin') {
        await this.captureMacOS(fullPath);
      } else {
        await this.captureLinux(fullPath);
      }

      // Verificar que se creó el archivo
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);

        return {
          success: true,
          message: `Screenshot guardado exitosamente`,
          path: fullPath,
          size: this.formatBytes(stats.size),
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('No se pudo crear el archivo de screenshot');
      }

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Captura en Windows usando PowerShell
   */
  async captureWindows(outputPath) {
    const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$bitmap.Save('${outputPath.replace(/\\/g, '\\\\')}')
$graphics.Dispose()
$bitmap.Dispose()
    `.trim();

    await execAsync(`powershell -Command "${psScript}"`, { timeout: 10000 });
  }

  /**
   * Captura en macOS usando screencapture
   */
  async captureMacOS(outputPath) {
    await execAsync(`screencapture -x "${outputPath}"`, { timeout: 10000 });
  }

  /**
   * Captura en Linux usando scrot o import
   */
  async captureLinux(outputPath) {
    try {
      // Intentar con scrot primero
      await execAsync(`scrot "${outputPath}"`, { timeout: 10000 });
    } catch (e) {
      // Si falla, intentar con imagemagick
      await execAsync(`import -window root "${outputPath}"`, { timeout: 10000 });
    }
  }

  /**
   * Formatea bytes a formato legible
   */
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export default ScreenshotAction;
