// modules/monitor.js
// Monitoreo autónomo 24/7

import cron from 'node-cron';

class Monitor {
  start(jarvis) {
    // Monitoreo cada 5 minutos
    cron.schedule('*/5 * * * *', () => {
      console.log('[Monitor] Verificación de sistemas...');
    });

    // Análisis profundo cada hora
    cron.schedule('0 * * * *', () => {
      console.log('[Monitor] Análisis profundo...');
    });
  }

  stop() {
    console.log('[Monitor] Detenido');
  }
}

export default Monitor;
