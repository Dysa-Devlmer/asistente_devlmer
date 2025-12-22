// modules/claude-integration.js
// Integración con Claude usando la API de Anthropic

import Anthropic from '@anthropic-ai/sdk';

class ClaudeIntegration {
  constructor() {
    this.client = null;
    this.model = 'claude-sonnet-4-20250514';
  }

  async initialize() {
    // Obtener API Key del entorno
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.log('\n❌ No se encontró ANTHROPIC_API_KEY en .env');
      console.log('\n📝 Para configurar:');
      console.log('1. Ve a: https://console.anthropic.com/settings/keys');
      console.log('2. Crea una API Key');
      console.log('3. Agrégala al archivo .env:');
      console.log('   ANTHROPIC_API_KEY=sk-ant-api03-tu-key-aqui\n');
      throw new Error('Se requiere ANTHROPIC_API_KEY en .env');
    }

    // Inicializar cliente de Anthropic
    this.client = new Anthropic({
      apiKey: apiKey
    });

    console.log('✅ Conectado a Claude API (Anthropic)');
    return true;
  }

  async analyze(command, systemPrompt) {
    if (!this.client) {
      throw new Error('Cliente de Claude no inicializado');
    }

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: command
          }
        ]
      });

      // Extraer el texto de la respuesta
      return response.content[0].text;
    } catch (error) {
      throw new Error(`Error al consultar Claude: ${error.message}`);
    }
  }
}

export default ClaudeIntegration;
