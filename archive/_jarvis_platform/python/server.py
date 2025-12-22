#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# ============================================
# FLASK API SERVER - Servidor REST para IA
# ============================================
# Servidor Flask que expone el motor de IA
# a través de endpoints REST para JavaScript
#
# Autor: J.A.R.V.I.S. para Ulmer Solier
# Fecha: 2025-01-05

import sys
import os

# Fix encoding para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_engine import get_ai_engine
from datetime import datetime

# Inicializar Flask
app = Flask(__name__)
CORS(app)  # Permitir llamadas desde JavaScript

# Inicializar motor de IA
ai_engine = None

def initialize_ai_engine():
    """Inicializa el motor de IA con configuración"""
    global ai_engine

    model = os.getenv('OLLAMA_MODEL', 'mistral:latest')
    ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')

    try:
        ai_engine = get_ai_engine(model=model, ollama_url=ollama_url)
        print(f"✅ Motor de IA inicializado: {model}")
        return True
    except Exception as e:
        print(f"❌ Error inicializando motor de IA: {e}")
        return False

# ============================================
# ENDPOINTS
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint de health check

    Returns:
        JSON con estado del servidor y motor de IA
    """
    if ai_engine is None:
        return jsonify({
            'status': 'error',
            'message': 'Motor de IA no inicializado',
            'timestamp': datetime.now().isoformat()
        }), 503

    stats = ai_engine.get_stats()

    return jsonify({
        'status': 'operational',
        'message': 'J.A.R.V.I.S. AI Engine completamente operacional',
        'model': stats['model'],
        'ollama_available': stats['ollama_available'],
        'stats': {
            'queries': stats['queries'],
            'successful_responses': stats['successful_responses'],
            'failed_responses': stats['failed_responses'],
            'avg_response_time': round(stats['avg_response_time'], 3),
            'memory_conversations': stats['memory_conversations']
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/ai/process', methods=['POST'])
def process_message():
    """
    Procesa mensaje del usuario con IA

    Body JSON:
        {
            "message": "mensaje del usuario",
            "context": {},  // opcional
            "use_history": true  // opcional
        }

    Returns:
        JSON con respuesta del motor de IA
    """
    if ai_engine is None:
        return jsonify({
            'success': False,
            'error': 'Motor de IA no inicializado'
        }), 503

    try:
        data = request.get_json()

        if not data or 'message' not in data:
            return jsonify({
                'success': False,
                'error': 'Falta campo "message" en el body'
            }), 400

        user_message = data['message']
        context = data.get('context', None)
        use_history = data.get('use_history', True)

        # Procesar con motor de IA
        result = ai_engine.process(
            user_message=user_message,
            context=context,
            use_history=use_history
        )

        return jsonify(result)

    except Exception as e:
        print(f"[Server] Error procesando mensaje: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/ai/learn', methods=['POST'])
def learn_feedback():
    """
    Registra feedback del usuario para aprendizaje

    Body JSON:
        {
            "user_message": "mensaje original",
            "ai_response": "respuesta dada",
            "feedback": "comentario del usuario",
            "rating": 1-5
        }

    Returns:
        JSON con confirmación
    """
    if ai_engine is None:
        return jsonify({
            'success': False,
            'error': 'Motor de IA no inicializado'
        }), 503

    try:
        data = request.get_json()

        required_fields = ['user_message', 'ai_response', 'feedback', 'rating']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': f'Faltan campos requeridos: {required_fields}'
            }), 400

        success = ai_engine.learn_from_feedback(
            user_message=data['user_message'],
            ai_response=data['ai_response'],
            feedback=data['feedback'],
            rating=data['rating']
        )

        return jsonify({
            'success': success,
            'message': 'Feedback registrado correctamente' if success else 'Error registrando feedback'
        })

    except Exception as e:
        print(f"[Server] Error registrando feedback: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/ai/memory', methods=['GET'])
def get_memory():
    """
    Obtiene contexto relevante de memoria

    Query params:
        - query: texto para buscar contexto relevante
        - limit: número máximo de resultados (default: 3)

    Returns:
        JSON con conversaciones relevantes
    """
    if ai_engine is None:
        return jsonify({
            'success': False,
            'error': 'Motor de IA no inicializado'
        }), 503

    try:
        query = request.args.get('query', '')
        limit = int(request.args.get('limit', 3))

        if not query:
            return jsonify({
                'success': False,
                'error': 'Falta parámetro "query"'
            }), 400

        relevant = ai_engine.get_relevant_context(query, limit)

        return jsonify({
            'success': True,
            'results': relevant,
            'count': len(relevant)
        })

    except Exception as e:
        print(f"[Server] Error obteniendo memoria: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/ai/stats', methods=['GET'])
def get_stats():
    """
    Obtiene estadísticas del motor de IA

    Returns:
        JSON con estadísticas completas
    """
    if ai_engine is None:
        return jsonify({
            'success': False,
            'error': 'Motor de IA no inicializado'
        }), 503

    stats = ai_engine.get_stats()

    return jsonify({
        'success': True,
        'stats': stats
    })

@app.route('/ai/clear-history', methods=['POST'])
def clear_history():
    """
    Limpia historial de conversación en RAM

    Returns:
        JSON con confirmación
    """
    if ai_engine is None:
        return jsonify({
            'success': False,
            'error': 'Motor de IA no inicializado'
        }), 503

    try:
        ai_engine.clear_history()
        return jsonify({
            'success': True,
            'message': 'Historial limpiado correctamente'
        })
    except Exception as e:
        print(f"[Server] Error limpiando historial: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Endpoint no encontrado'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'Error interno del servidor'
    }), 500

# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    print('\n' + '═' * 60)
    print('🧠 J.A.R.V.I.S. AI ENGINE SERVER')
    print('═' * 60 + '\n')

    # Inicializar motor de IA
    if not initialize_ai_engine():
        print('❌ No se pudo inicializar el motor de IA')
        print('   Verifica que Ollama esté ejecutándose: ollama serve')
        sys.exit(1)

    # Configuración del servidor
    host = os.getenv('FLASK_HOST', '127.0.0.1')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

    print(f'🚀 Servidor iniciando en http://{host}:{port}')
    print(f'🔧 Debug mode: {debug}')
    print(f'🤖 Modelo: {ai_engine.model}')
    print('\n' + '═' * 60 + '\n')

    # Iniciar servidor
    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True
    )
