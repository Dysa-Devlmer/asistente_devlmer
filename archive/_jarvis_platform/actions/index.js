// actions/index.js
// Loader central de todas las acciones de J.A.R.V.I.S.

import CreateProjectAction from './create_project.js';
import SystemMonitorAction from './system_monitor.js';
import WeatherReportAction from './weather_report.js';
import ScreenshotAction from './screenshot.js';
import JokeAction from './joke.js';

class ActionsLoader {
  constructor() {
    this.actions = new Map();
    this.initialized = false;
  }

  /**
   * Inicializa todas las acciones disponibles
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Registrar todas las acciones
      this.registerAction(new CreateProjectAction());
      this.registerAction(new SystemMonitorAction());
      this.registerAction(new WeatherReportAction());
      this.registerAction(new ScreenshotAction());
      this.registerAction(new JokeAction());

      this.initialized = true;

      console.log(`✅ [Actions] ${this.actions.size} acciones cargadas exitosamente`);

      return true;
    } catch (error) {
      console.error(`❌ [Actions] Error inicializando acciones: ${error.message}`);
      return false;
    }
  }

  /**
   * Registra una acción en el sistema
   */
  registerAction(actionInstance) {
    if (!actionInstance.name) {
      throw new Error('La acción debe tener un nombre');
    }

    if (!actionInstance.execute || typeof actionInstance.execute !== 'function') {
      throw new Error(`La acción '${actionInstance.name}' debe tener un método execute()`);
    }

    this.actions.set(actionInstance.name, actionInstance);
  }

  /**
   * Ejecuta una acción por nombre
   */
  async execute(actionName, params = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const action = this.actions.get(actionName);

    if (!action) {
      return {
        success: false,
        error: `Acción '${actionName}' no encontrada`,
        availableActions: Array.from(this.actions.keys())
      };
    }

    try {
      const result = await action.execute(params);
      return result;
    } catch (error) {
      return {
        success: false,
        action: actionName,
        error: error.message,
        stack: error.stack
      };
    }
  }

  /**
   * Obtiene información de una acción
   */
  getActionInfo(actionName) {
    const action = this.actions.get(actionName);

    if (!action) {
      return null;
    }

    return {
      name: action.name,
      description: action.description || 'Sin descripción',
      available: true
    };
  }

  /**
   * Lista todas las acciones disponibles
   */
  listActions() {
    const actionsList = [];

    for (const [name, action] of this.actions.entries()) {
      actionsList.push({
        name,
        description: action.description || 'Sin descripción'
      });
    }

    return actionsList;
  }

  /**
   * Verifica si una acción existe
   */
  hasAction(actionName) {
    return this.actions.has(actionName);
  }

  /**
   * Obtiene el número total de acciones
   */
  getActionCount() {
    return this.actions.size;
  }

  /**
   * Mapea intenciones del DecisionEngine a acciones reales
   */
  mapIntentToAction(intent) {
    const intentMap = {
      // Proyectos
      'create_project': 'create_project',
      'new_project': 'create_project',
      'init_project': 'create_project',

      // Sistema
      'system_monitor': 'system_monitor',
      'check_system': 'system_monitor',
      'system_status': 'system_monitor',
      'cpu_usage': 'system_monitor',
      'memory_usage': 'system_monitor',
      'battery_status': 'system_monitor',
      'disk_usage': 'system_monitor',

      // Clima
      'weather': 'weather_report',
      'weather_report': 'weather_report',
      'check_weather': 'weather_report',
      'forecast': 'weather_report',

      // Screenshot
      'screenshot': 'screenshot',
      'capture_screen': 'screenshot',
      'take_screenshot': 'screenshot',

      // Chistes
      'joke': 'joke',
      'tell_joke': 'joke',
      'make_joke': 'joke',
      'funny': 'joke'
    };

    return intentMap[intent] || intent;
  }

  /**
   * Ejecuta acción basándose en intención
   */
  async executeFromIntent(intent, params = {}) {
    const actionName = this.mapIntentToAction(intent);
    return await this.execute(actionName, params);
  }
}

// Singleton
const actionsLoader = new ActionsLoader();

export default actionsLoader;
export { ActionsLoader };
