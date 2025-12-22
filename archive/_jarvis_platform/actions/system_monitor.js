// actions/system_monitor.js
// Acción real: Monitorea CPU, RAM, batería, disco, procesos

import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

class SystemMonitorAction {
  constructor() {
    this.name = 'system_monitor';
    this.description = 'Monitorea recursos del sistema: CPU, RAM, batería, disco, procesos';
  }

  /**
   * Ejecuta monitoreo del sistema
   * @param {Object} params - Parámetros de la acción
   * @param {string} params.type - Tipo de monitoreo (all, cpu, memory, battery, disk, processes)
   * @param {boolean} params.detailed - Mostrar información detallada
   * @returns {Object} Información del sistema
   */
  async execute(params = {}) {
    const {
      type = 'all',
      detailed = false
    } = params;

    try {
      const result = {
        success: true,
        timestamp: new Date().toISOString(),
        system: {}
      };

      // Ejecutar monitoreos según tipo
      if (type === 'all' || type === 'cpu') {
        result.system.cpu = await this.getCPUInfo(detailed);
      }

      if (type === 'all' || type === 'memory') {
        result.system.memory = await this.getMemoryInfo(detailed);
      }

      if (type === 'all' || type === 'battery') {
        result.system.battery = await this.getBatteryInfo();
      }

      if (type === 'all' || type === 'disk') {
        result.system.disk = await this.getDiskInfo();
      }

      if (type === 'all' || type === 'processes') {
        result.system.processes = await this.getProcessInfo(detailed);
      }

      if (type === 'all' || type === 'network') {
        result.system.network = await this.getNetworkInfo();
      }

      if (type === 'all' || type === 'system') {
        result.system.info = await this.getSystemInfo();
      }

      // Generar resumen legible
      result.summary = this.generateSummary(result.system);

      return result;

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Obtiene información de CPU
   */
  async getCPUInfo(detailed = false) {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // Calcular uso actual
    const usage = await this.calculateCPUUsage();

    const info = {
      model: cpus[0].model,
      cores: cpus.length,
      speed: cpus[0].speed,
      usage: usage,
      loadAverage: {
        '1min': loadAvg[0].toFixed(2),
        '5min': loadAvg[1].toFixed(2),
        '15min': loadAvg[2].toFixed(2)
      }
    };

    if (detailed) {
      info.coreDetails = cpus.map((cpu, i) => ({
        core: i,
        speed: cpu.speed,
        times: cpu.times
      }));
    }

    return info;
  }

  /**
   * Calcula uso de CPU
   */
  async calculateCPUUsage() {
    return new Promise((resolve) => {
      const startMeasure = this.getCPUTimes();

      setTimeout(() => {
        const endMeasure = this.getCPUTimes();
        const idleDiff = endMeasure.idle - startMeasure.idle;
        const totalDiff = endMeasure.total - startMeasure.total;
        const usage = 100 - (100 * idleDiff / totalDiff);

        resolve(Math.round(usage * 100) / 100);
      }, 100);
    });
  }

  /**
   * Obtiene tiempos de CPU
   */
  getCPUTimes() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        total += cpu.times[type];
      }
      idle += cpu.times.idle;
    });

    return { idle, total };
  }

  /**
   * Obtiene información de memoria
   */
  async getMemoryInfo(detailed = false) {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const info = {
      total: this.formatBytes(totalMem),
      used: this.formatBytes(usedMem),
      free: this.formatBytes(freeMem),
      usagePercent: Math.round((usedMem / totalMem) * 100),
      raw: {
        total: totalMem,
        used: usedMem,
        free: freeMem
      }
    };

    if (detailed && process.platform === 'win32') {
      // Información adicional en Windows
      try {
        const { stdout } = await execAsync('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize /Value');
        const lines = stdout.trim().split('\n');
        const data = {};
        lines.forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            data[key.trim()] = parseInt(value.trim()) * 1024; // KB to bytes
          }
        });
        info.detailed = data;
      } catch (e) {
        // Ignorar si falla
      }
    }

    return info;
  }

  /**
   * Obtiene información de batería
   */
  async getBatteryInfo() {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('wmic path Win32_Battery get EstimatedChargeRemaining,BatteryStatus /format:list');

        const lines = stdout.trim().split('\n');
        const data = {};

        lines.forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            data[key.trim()] = value.trim();
          }
        });

        if (Object.keys(data).length === 0) {
          return {
            available: false,
            message: 'No se detectó batería (probablemente PC de escritorio)'
          };
        }

        return {
          available: true,
          level: parseInt(data.EstimatedChargeRemaining) || 0,
          charging: data.BatteryStatus === '2',
          status: this.getBatteryStatus(data.BatteryStatus)
        };

      } else if (process.platform === 'darwin') {
        // macOS
        const { stdout } = await execAsync('pmset -g batt');
        const match = stdout.match(/(\d+)%.*?(\w+)/);

        if (match) {
          return {
            available: true,
            level: parseInt(match[1]),
            charging: match[2].toLowerCase().includes('charging'),
            status: match[2]
          };
        }
      } else {
        // Linux
        const batteryPath = '/sys/class/power_supply/BAT0';
        if (fs.existsSync(batteryPath)) {
          const capacity = fs.readFileSync(`${batteryPath}/capacity`, 'utf8').trim();
          const status = fs.readFileSync(`${batteryPath}/status`, 'utf8').trim();

          return {
            available: true,
            level: parseInt(capacity),
            charging: status.toLowerCase() === 'charging',
            status
          };
        }
      }

      return {
        available: false,
        message: 'No se pudo obtener información de batería'
      };

    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Traduce estado de batería
   */
  getBatteryStatus(code) {
    const statuses = {
      '1': 'Descargando',
      '2': 'Conectado (cargando)',
      '3': 'Completamente cargado',
      '4': 'Bajo',
      '5': 'Crítico',
      '6': 'Cargando',
      '7': 'Carga completa',
      '8': 'Esperando carga',
      '9': 'Esperando descarga',
      '10': 'Parcialmente cargado',
      '11': 'Desconocido'
    };

    return statuses[code] || 'Desconocido';
  }

  /**
   * Obtiene información de disco
   */
  async getDiskInfo() {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('wmic logicaldisk get name,size,freespace,drivetype /format:csv');

        const lines = stdout.trim().split('\n').slice(1); // Skip header
        const disks = [];

        lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length >= 5 && parts[2]) {
            const type = this.getDriveType(parts[2]);
            const size = parseInt(parts[4]);
            const free = parseInt(parts[3]);

            if (size > 0) {
              disks.push({
                drive: parts[1],
                type,
                total: this.formatBytes(size),
                free: this.formatBytes(free),
                used: this.formatBytes(size - free),
                usagePercent: Math.round(((size - free) / size) * 100)
              });
            }
          }
        });

        return { disks };

      } else {
        // Unix-like systems
        const { stdout } = await execAsync('df -h');
        const lines = stdout.trim().split('\n').slice(1);
        const disks = [];

        lines.forEach(line => {
          const parts = line.split(/\s+/);
          if (parts.length >= 6) {
            disks.push({
              filesystem: parts[0],
              total: parts[1],
              used: parts[2],
              free: parts[3],
              usagePercent: parseInt(parts[4]),
              mountPoint: parts[5]
            });
          }
        });

        return { disks };
      }

    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  /**
   * Traduce tipo de disco
   */
  getDriveType(code) {
    const types = {
      '0': 'Desconocido',
      '1': 'Sin raíz',
      '2': 'Disco extraíble',
      '3': 'Disco local',
      '4': 'Disco de red',
      '5': 'Disco compacto',
      '6': 'Disco RAM'
    };

    return types[code] || 'Desconocido';
  }

  /**
   * Obtiene información de procesos
   */
  async getProcessInfo(detailed = false) {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('tasklist /FO CSV /NH');
        const lines = stdout.trim().split('\n');
        const processes = [];

        lines.slice(0, detailed ? 50 : 10).forEach(line => {
          const match = line.match(/"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/);
          if (match) {
            processes.push({
              name: match[1],
              pid: match[2],
              session: match[3],
              memory: match[5]
            });
          }
        });

        return {
          count: lines.length,
          top: processes
        };

      } else {
        const { stdout } = await execAsync('ps aux | head -20');
        const lines = stdout.trim().split('\n').slice(1);
        const processes = [];

        lines.forEach(line => {
          const parts = line.split(/\s+/);
          if (parts.length >= 11) {
            processes.push({
              user: parts[0],
              pid: parts[1],
              cpu: parts[2] + '%',
              memory: parts[3] + '%',
              command: parts.slice(10).join(' ')
            });
          }
        });

        return {
          count: processes.length,
          top: processes
        };
      }

    } catch (error) {
      return {
        error: error.message
      };
    }
  }

  /**
   * Obtiene información de red
   */
  async getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const active = [];

    for (const [name, addresses] of Object.entries(interfaces)) {
      addresses.forEach(addr => {
        if (!addr.internal && addr.family === 'IPv4') {
          active.push({
            interface: name,
            ip: addr.address,
            mac: addr.mac,
            netmask: addr.netmask
          });
        }
      });
    }

    return { interfaces: active };
  }

  /**
   * Obtiene información general del sistema
   */
  async getSystemInfo() {
    return {
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname(),
      type: os.type(),
      release: os.release(),
      uptime: this.formatUptime(os.uptime()),
      nodeVersion: process.version
    };
  }

  /**
   * Formatea bytes a formato legible
   */
  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Formatea uptime
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }

  /**
   * Genera resumen legible
   */
  generateSummary(system) {
    const lines = [];

    if (system.cpu) {
      lines.push(`CPU: ${system.cpu.model} (${system.cpu.cores} cores) @ ${system.cpu.usage}% uso`);
    }

    if (system.memory) {
      lines.push(`RAM: ${system.memory.used} / ${system.memory.total} (${system.memory.usagePercent}% usado)`);
    }

    if (system.battery && system.battery.available) {
      const status = system.battery.charging ? 'Cargando' : 'Batería';
      lines.push(`${status}: ${system.battery.level}%`);
    }

    if (system.disk && system.disk.disks) {
      system.disk.disks.slice(0, 3).forEach(disk => {
        lines.push(`Disco ${disk.drive || disk.mountPoint}: ${disk.used} / ${disk.total} (${disk.usagePercent}% usado)`);
      });
    }

    if (system.info) {
      lines.push(`Sistema: ${system.info.type} ${system.info.release} (Uptime: ${system.info.uptime})`);
    }

    return lines.join('\n');
  }
}

export default SystemMonitorAction;
