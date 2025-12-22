// actions/weather_report.js
// Acción real: Obtiene información del clima en tiempo real

import https from 'https';
import http from 'http';

class WeatherReportAction {
  constructor() {
    this.name = 'weather_report';
    this.description = 'Obtiene información del clima en tiempo real para una ubicación';

    // API gratuita sin API key requerida
    this.apiUrl = 'https://wttr.in';
  }

  /**
   * Ejecuta consulta de clima
   * @param {Object} params - Parámetros de la acción
   * @param {string} params.location - Ubicación (ciudad, país, coordenadas)
   * @param {string} params.format - Formato de salida (text, json, detailed)
   * @param {string} params.units - Unidades (metric, imperial)
   * @returns {Object} Información del clima
   */
  async execute(params = {}) {
    const {
      location = null,
      format = 'json',
      units = 'metric',
      lang = 'es'
    } = params;

    try {
      // Si no especifica ubicación, usar IP para detectarla
      const query = location || '';

      // Obtener datos del clima
      const weatherData = await this.fetchWeather(query, format, units, lang);

      if (format === 'json') {
        return this.parseJsonResponse(weatherData);
      } else {
        return {
          success: true,
          data: weatherData,
          format: 'text'
        };
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
   * Obtiene datos del clima desde API
   */
  async fetchWeather(location, format, units, lang) {
    return new Promise((resolve, reject) => {
      // Construir URL
      const params = [];
      if (format === 'json') {
        params.push('format=j1');
      }
      if (units === 'metric') {
        params.push('m');
      }
      if (lang) {
        params.push(`lang=${lang}`);
      }

      const queryString = params.length > 0 ? '?' + params.join('&') : '';
      const url = `${this.apiUrl}/${encodeURIComponent(location)}${queryString}`;

      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              if (format === 'json') {
                resolve(JSON.parse(data));
              } else {
                resolve(data);
              }
            } catch (e) {
              reject(new Error('Error parseando respuesta del clima'));
            }
          } else {
            reject(new Error(`Error HTTP: ${res.statusCode}`));
          }
        });

      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Parsea respuesta JSON del clima
   */
  parseJsonResponse(data) {
    try {
      const current = data.current_condition[0];
      const location = data.nearest_area[0];
      const forecast = data.weather || [];

      const result = {
        success: true,
        location: {
          name: location.areaName[0].value,
          region: location.region[0].value,
          country: location.country[0].value,
          lat: location.latitude,
          lon: location.longitude
        },
        current: {
          temperature: {
            celsius: current.temp_C,
            fahrenheit: current.temp_F,
            feelsLike: {
              celsius: current.FeelsLikeC,
              fahrenheit: current.FeelsLikeF
            }
          },
          condition: current.weatherDesc[0].value || current.lang_es?.[0]?.value,
          humidity: current.humidity,
          precipitation: current.precipMM,
          pressure: current.pressure,
          visibility: current.visibility,
          uvIndex: current.uvIndex,
          wind: {
            speed: current.windspeedKmph,
            direction: current.winddir16Point,
            degrees: current.winddirDegree
          },
          cloudCover: current.cloudcover,
          observationTime: current.observation_time
        },
        forecast: forecast.slice(0, 3).map(day => ({
          date: day.date,
          maxTemp: {
            celsius: day.maxtempC,
            fahrenheit: day.maxtempF
          },
          minTemp: {
            celsius: day.mintempC,
            fahrenheit: day.mintempF
          },
          avgTemp: {
            celsius: day.avgtempC,
            fahrenheit: day.avgtempF
          },
          totalSnow: day.totalSnow_cm,
          sunHours: day.sunHour,
          uvIndex: day.uvIndex,
          hourly: day.hourly?.slice(0, 4).map(h => ({
            time: h.time,
            temp: h.tempC + '°C',
            condition: h.weatherDesc[0].value,
            chanceOfRain: h.chanceofrain + '%',
            chanceOfSnow: h.chanceofsnow + '%'
          }))
        })),
        summary: this.generateSummary({
          location: location.areaName[0].value,
          current,
          forecast: forecast[0]
        })
      };

      return result;

    } catch (error) {
      return {
        success: false,
        error: 'Error procesando datos del clima: ' + error.message
      };
    }
  }

  /**
   * Genera resumen legible del clima
   */
  generateSummary(data) {
    const { location, current, forecast } = data;

    let summary = `📍 ${location}\n`;
    summary += `🌡️  Temperatura: ${current.temp_C}°C (Sensación térmica: ${current.FeelsLikeC}°C)\n`;
    summary += `☁️  Condición: ${current.weatherDesc[0].value}\n`;
    summary += `💧 Humedad: ${current.humidity}%\n`;
    summary += `🌬️  Viento: ${current.windspeedKmph} km/h ${current.winddir16Point}\n`;
    summary += `🌧️  Precipitación: ${current.precipMM} mm\n`;
    summary += `👁️  Visibilidad: ${current.visibility} km\n`;
    summary += `☀️  Índice UV: ${current.uvIndex}\n`;

    if (forecast) {
      summary += `\n📅 Pronóstico:\n`;
      summary += `   Máxima: ${forecast.maxtempC}°C | Mínima: ${forecast.mintempC}°C\n`;
      summary += `   Horas de sol: ${forecast.sunHour}h\n`;
    }

    return summary;
  }

  /**
   * Obtiene clima simple (versión rápida)
   */
  async getQuickWeather(location) {
    try {
      const url = `${this.apiUrl}/${encodeURIComponent(location || '')}?format=%l:+%c+%t+%h+%w&lang=es`;

      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            resolve({
              success: true,
              summary: data.trim()
            });
          });

        }).on('error', (err) => {
          reject(err);
        });
      });

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtiene pronóstico extendido (varios días)
   */
  async getExtendedForecast(location, days = 3) {
    try {
      const data = await this.fetchWeather(location, 'json', 'metric', 'es');
      const forecast = data.weather.slice(0, days);

      return {
        success: true,
        location: data.nearest_area[0].areaName[0].value,
        days: forecast.map(day => ({
          date: this.formatDate(day.date),
          maxTemp: day.maxtempC + '°C',
          minTemp: day.mintempC + '°C',
          condition: day.hourly[4]?.weatherDesc[0]?.value || 'N/A',
          chanceOfRain: day.hourly[4]?.chanceofrain || '0',
          uvIndex: day.uvIndex
        }))
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Formatea fecha
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Obtiene alertas meteorológicas (si disponible)
   */
  async getWeatherAlerts(location) {
    try {
      const data = await this.fetchWeather(location, 'json', 'metric', 'es');
      const current = data.current_condition[0];

      const alerts = [];

      // Detectar condiciones extremas
      if (parseInt(current.temp_C) > 35) {
        alerts.push({
          type: 'high_temperature',
          severity: 'warning',
          message: `Temperatura muy alta: ${current.temp_C}°C`
        });
      }

      if (parseInt(current.temp_C) < 0) {
        alerts.push({
          type: 'low_temperature',
          severity: 'warning',
          message: `Temperatura bajo cero: ${current.temp_C}°C`
        });
      }

      if (parseInt(current.windspeedKmph) > 60) {
        alerts.push({
          type: 'high_wind',
          severity: 'warning',
          message: `Vientos fuertes: ${current.windspeedKmph} km/h`
        });
      }

      if (parseInt(current.uvIndex) > 7) {
        alerts.push({
          type: 'high_uv',
          severity: 'caution',
          message: `Índice UV alto: ${current.uvIndex}`
        });
      }

      if (parseInt(current.visibility) < 5) {
        alerts.push({
          type: 'low_visibility',
          severity: 'warning',
          message: `Visibilidad reducida: ${current.visibility} km`
        });
      }

      return {
        success: true,
        alerts,
        hasAlerts: alerts.length > 0
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default WeatherReportAction;
