// ============================================
// VOICE ENGINE - MOTOR DE VOZ BÁSICO
// ============================================
// Sistema de voz compatible con Windows (sin deps nativas)

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VoiceEngine {
  constructor(logger) {
    this.logger = logger || console;
    this.isListening = false;
    this.audioCache = path.join(__dirname, '../voice/audio-cache');
    this.voiceEnabled = true;
    this.mode = 'simulation'; // 'simulation' | 'real'
  }

  // ===== INICIALIZACIÓN =====
  async initialize() {
    try {
      await fs.ensureDir(this.audioCache);
      this.logger.info('✅ VoiceEngine inicializado (modo simulación)');
      return { success: true };
    } catch (error) {
      this.logger.warn('⚠️  Modo voz desactivado:', error.message);
      this.voiceEnabled = false;
      return { success: false, message: error.message };
    }
  }

  // ===== ESCUCHAR MICRÓFONO (SIMULADO) =====
  async listen(durationMs = 5000) {
    if (!this.voiceEnabled) {
      this.logger.warn('⚠️  Voz no disponible');
      return { success: false, message: 'Voz no disponible' };
    }

    this.isListening = true;
    this.logger.info(`🎤 Escuchando por ${durationMs}ms (MODO SIMULACIÓN)...`);

    return new Promise((resolve) => {
      setTimeout(() => {
        this.isListening = false;
        this.logger.info('🎤 Grabación completada (simulada)');
        resolve({
          success: true,
          mode: 'simulation',
          message: 'Audio capturado (simulación)',
          duration: durationMs
        });
      }, durationMs);
    });
  }

  // ===== SPEAK (TTS SIMULADO) =====
  async speak(text) {
    if (!this.voiceEnabled) {
      this.logger.info(`📢 [VOZ]: ${text}`);
      return { success: true, mode: 'text' };
    }

    try {
      this.logger.info(`🔊 JARVIS dice: "${text}"`);

      // Intentar usar PowerShell Text-to-Speech (Windows nativo)
      if (process.platform === 'win32') {
        try {
          const psCommand = `Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer; $synth.Speak("${text.replace(/"/g, '""')}")`;

          // Ejecutar en background, no esperar
          exec(`powershell -Command "${psCommand}"`, (error) => {
            if (error) {
              this.logger.warn('⚠️  PowerShell TTS no disponible');
            }
          });

          return {
            success: true,
            mode: 'windows_tts',
            message: text
          };
        } catch (error) {
          this.logger.warn('⚠️  Error en Windows TTS:', error.message);
        }
      }

      // Fallback: simulación
      return {
        success: true,
        mode: 'simulation',
        message: text
      };

    } catch (error) {
      this.logger.warn('⚠️  Error en TTS:', error.message);
      return { success: false, message: error.message };
    }
  }

  // ===== WAKE WORD DETECTION (SIMULADO) =====
  async detectWakeWord(audioBuffer) {
    try {
      this.logger.info('🎙️  Analizando audio para wake word...');

      // En modo simulación: siempre detecta
      await this.sleep(500); // Simular procesamiento

      return {
        success: true,
        detected: true,
        wakeWord: 'JARVIS',
        confidence: 0.95,
        mode: 'simulation'
      };

    } catch (error) {
      this.logger.error('Error detectando wake word:', error);
      return {
        success: false,
        detected: false,
        message: error.message
      };
    }
  }

  // ===== TRANSCRIBIR AUDIO (SIMULADO) =====
  async transcribe(audioBuffer) {
    try {
      this.logger.info('🎙️  Transcribiendo audio...');

      // Simulación: devolver texto ejemplo
      await this.sleep(800);

      const sampleCommands = [
        'mis tareas',
        'busca en web inteligencia artificial',
        'crear proyecto test-voice nodejs-backend',
        'recuerda que debo revisar FASE 4',
        'estadísticas de memoria'
      ];

      const randomCommand = sampleCommands[Math.floor(Math.random() * sampleCommands.length)];

      return {
        success: true,
        text: randomCommand,
        confidence: 0.92,
        mode: 'simulation'
      };

    } catch (error) {
      this.logger.error('Error transcribiendo:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // ===== CONVERSACIÓN COMPLETA (WAKE → STT → COMANDO → TTS) =====
  async startConversation() {
    try {
      this.logger.info('\n🎙️  === CONVERSACIÓN DE VOZ INICIADA ===');

      // 1. Esperar wake word
      this.logger.info('1️⃣  Esperando wake word "Hey JARVIS"...');
      const wakeWordResult = await this.detectWakeWord();

      if (!wakeWordResult.detected) {
        return { success: false, message: 'Wake word no detectado' };
      }

      this.logger.info('✅ Wake word detectado!');
      await this.speak('Sí, señor?');

      // 2. Escuchar comando
      this.logger.info('2️⃣  Escuchando comando...');
      const audioResult = await this.listen(3000);

      if (!audioResult.success) {
        return { success: false, message: 'Error capturando audio' };
      }

      // 3. Transcribir
      this.logger.info('3️⃣  Transcribiendo...');
      const transcription = await this.transcribe(audioResult);

      if (!transcription.success) {
        return { success: false, message: 'Error transcribiendo' };
      }

      this.logger.info(`✅ Transcripción: "${transcription.text}"`);

      // 4. Retornar para que main-ultimate.js procese el comando
      return {
        success: true,
        command: transcription.text,
        confidence: transcription.confidence,
        mode: 'simulation'
      };

    } catch (error) {
      this.logger.error('Error en conversación:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // ===== SIMULACIÓN DE VOZ INPUT =====
  async simulateVoiceInput(text) {
    this.logger.info(`🎤 [SIMULACIÓN INPUT] Usuario dice: "${text}"`);
    return {
      success: true,
      text: text,
      mode: 'simulation'
    };
  }

  // ===== SIMULACIÓN DE VOZ OUTPUT =====
  async simulateVoiceOutput(text) {
    this.logger.info(`🔊 [SIMULACIÓN OUTPUT] JARVIS dice: "${text}"`);
    return await this.speak(text);
  }

  // ===== DEMO CONVERSACIÓN =====
  async demoConversation() {
    this.logger.info('\n🎬 === DEMO DE CONVERSACIÓN ===\n');

    await this.sleep(500);
    this.logger.info('👤 Usuario: "Hey JARVIS"');
    await this.speak('Sí, señor?');

    await this.sleep(1000);
    this.logger.info('👤 Usuario: "¿Cuántas tareas tengo?"');
    await this.speak('Tienes 3 tareas pendientes, señor. ¿Deseas que las lea?');

    await this.sleep(1000);
    this.logger.info('👤 Usuario: "Sí, por favor"');
    await this.speak('Tarea 1: Completar FASE 4 de voz. Tarea 2: Crear panel web. Tarea 3: Testing completo del sistema.');

    await this.sleep(500);
    this.logger.info('\n✅ Demo completada\n');

    return { success: true, message: 'Demo ejecutada' };
  }

  // ===== STATUS =====
  getStatus() {
    return {
      enabled: this.voiceEnabled,
      listening: this.isListening,
      mode: this.mode,
      audioCache: this.audioCache,
      platform: process.platform,
      features: {
        wakeWord: true,
        stt: true,
        tts: process.platform === 'win32',
        conversation: true
      }
    };
  }

  // ===== UTILIDADES =====
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getStats() {
    const stats = this.getStatus();
    return {
      ...stats,
      timestamp: new Date().toISOString()
    };
  }
}

export default VoiceEngine;
