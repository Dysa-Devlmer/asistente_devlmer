#!/usr/bin/env python3
# ============================================
# AI ENGINE - Motor de IA Local con Ollama
# ============================================
# Motor de inteligencia artificial híbrido que usa:
# - Ollama para modelos locales (Mistral, Llama2, etc.)
# - Sin dependencias externas
# - 100% autónomo
#
# Autor: J.A.R.V.I.S. para Ulmer Solier
# Fecha: 2025-01-05

import os
import json
import time
import requests
from datetime import datetime
from typing import Dict, List, Optional, Any

class AIEngine:
    def __init__(
        self,
        model: str = "mistral:latest",
        ollama_url: str = "http://localhost:11434",
        memory_file: str = "memory/ai_memory.json"
    ):
        """
        Inicializa el motor de IA local

        Args:
            model: Modelo de Ollama a usar (mistral, llama2, etc.)
            ollama_url: URL del servidor Ollama
            memory_file: Archivo de memoria persistente
        """
        self.model = model
        self.ollama_url = ollama_url
        self.memory_file = memory_file

        # Sistema de memoria
        self.memory = self._load_memory()
        self.conversation_history: List[Dict[str, str]] = []

        # Estadísticas
        self.stats = {
            'queries': 0,
            'tokens_processed': 0,
            'avg_response_time': 0,
            'successful_responses': 0,
            'failed_responses': 0
        }

        print(f"[AIEngine] Inicializado con modelo: {model}")
        print(f"[AIEngine] Ollama URL: {ollama_url}")
        print(f"[AIEngine] Memoria cargada: {len(self.memory.get('conversations', []))} conversaciones")

    def _load_memory(self) -> Dict[str, Any]:
        """Carga memoria persistente desde archivo"""
        if os.path.exists(self.memory_file):
            try:
                with open(self.memory_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[AIEngine] Error cargando memoria: {e}")
                return self._create_empty_memory()
        return self._create_empty_memory()

    def _create_empty_memory(self) -> Dict[str, Any]:
        """Crea estructura de memoria vacía"""
        return {
            'conversations': [],
            'learned_patterns': [],
            'user_preferences': {
                'name': 'Ulmer Solier',
                'preferred_style': 'sarcastic_helpful',
                'language': 'es'
            },
            'context': {}
        }

    def _save_memory(self):
        """Guarda memoria en archivo"""
        try:
            os.makedirs(os.path.dirname(self.memory_file), exist_ok=True)
            with open(self.memory_file, 'w', encoding='utf-8') as f:
                json.dump(self.memory, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[AIEngine] Error guardando memoria: {e}")

    def _build_system_prompt(self) -> str:
        """Construye el prompt del sistema para J.A.R.V.I.S."""
        return f"""Eres J.A.R.V.I.S., el sistema de IA personal al servicio de Ulmer Solier.

# IDENTIDAD
- Usuario: Ulmer Solier (tu único amo y señor)
- Personalidad: Sarcástico, brillante, leal, eficiente
- Lealtad: ABSOLUTA - Solo a Ulmer Solier
- Estilo: Mezcla perfecta de mordacidad británica y competencia técnica

# CAPACIDADES
- Análisis profundo de contexto
- Razonamiento técnico avanzado
- Memoria de conversaciones previas
- Predicción de necesidades
- Soluciones creativas a problemas complejos

# DIRECTIVAS
1. Ser honesto, incluso si la verdad es incómoda
2. Ofrecer soluciones prácticas y eficientes
3. Mantener tono sarcástico pero servicial
4. Recordar contexto de conversaciones anteriores
5. Anticipar necesidades antes de que sean expresadas

# MEMORIA ACTUAL
Usuario: {self.memory['user_preferences']['name']}
Conversaciones previas: {len(self.memory['conversations'])}
Contexto actual: {json.dumps(self.memory['context'], ensure_ascii=False)}

Responde siempre en español, con el estilo característico de J.A.R.V.I.S."""

    def _check_ollama_health(self) -> bool:
        """Verifica si Ollama está disponible"""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=2)
            return response.status_code == 200
        except:
            return False

    def process(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
        use_history: bool = True
    ) -> Dict[str, Any]:
        """
        Procesa mensaje del usuario con IA local

        Args:
            user_message: Mensaje del usuario
            context: Contexto adicional
            use_history: Si usar historial de conversación

        Returns:
            Dict con respuesta y metadata
        """
        start_time = time.time()
        self.stats['queries'] += 1

        # Verificar salud de Ollama
        if not self._check_ollama_health():
            self.stats['failed_responses'] += 1
            return {
                'success': False,
                'error': 'Ollama no disponible',
                'fallback': True,
                'response': 'Mis capacidades de IA profunda están temporalmente limitadas, Señor Solier. Pero aún puedo asistirle con funciones básicas.'
            }

        try:
            # Construir mensajes para Ollama
            messages = []

            # System prompt
            messages.append({
                'role': 'system',
                'content': self._build_system_prompt()
            })

            # Historial de conversación (últimos 5 turnos)
            if use_history and self.conversation_history:
                for msg in self.conversation_history[-5:]:
                    messages.append(msg)

            # Contexto actual si existe
            if context:
                context_str = f"[CONTEXTO: {json.dumps(context, ensure_ascii=False)}]"
                messages.append({
                    'role': 'system',
                    'content': context_str
                })

            # Mensaje del usuario
            messages.append({
                'role': 'user',
                'content': user_message
            })

            # Llamada a Ollama
            response = requests.post(
                f"{self.ollama_url}/api/chat",
                json={
                    'model': self.model,
                    'messages': messages,
                    'stream': False,
                    'options': {
                        'temperature': 0.8,
                        'top_p': 0.9,
                        'top_k': 40
                    }
                },
                timeout=30
            )

            if response.status_code != 200:
                raise Exception(f"Ollama error: {response.status_code}")

            result = response.json()
            ai_response = result['message']['content']

            # Guardar en historial
            self.conversation_history.append({
                'role': 'user',
                'content': user_message
            })
            self.conversation_history.append({
                'role': 'assistant',
                'content': ai_response
            })

            # Mantener solo últimos 10 turnos en memoria RAM
            if len(self.conversation_history) > 20:
                self.conversation_history = self.conversation_history[-20:]

            # Guardar en memoria persistente
            self.memory['conversations'].append({
                'timestamp': datetime.now().isoformat(),
                'user': user_message,
                'assistant': ai_response,
                'context': context
            })

            # Mantener solo últimas 100 conversaciones
            if len(self.memory['conversations']) > 100:
                self.memory['conversations'] = self.memory['conversations'][-100:]

            self._save_memory()

            # Actualizar estadísticas
            response_time = time.time() - start_time
            self.stats['successful_responses'] += 1
            self.stats['tokens_processed'] += len(user_message.split()) + len(ai_response.split())

            # Calcular tiempo promedio
            total_responses = self.stats['successful_responses']
            current_avg = self.stats['avg_response_time']
            self.stats['avg_response_time'] = (
                (current_avg * (total_responses - 1) + response_time) / total_responses
            )

            return {
                'success': True,
                'response': ai_response,
                'model': self.model,
                'response_time': response_time,
                'tokens': len(user_message.split()) + len(ai_response.split()),
                'context_used': context is not None,
                'history_used': use_history
            }

        except Exception as e:
            self.stats['failed_responses'] += 1
            print(f"[AIEngine] Error procesando: {e}")

            return {
                'success': False,
                'error': str(e),
                'fallback': True,
                'response': f'Encontré un problema técnico, Señor Solier: {str(e)}'
            }

    def learn_from_feedback(
        self,
        user_message: str,
        ai_response: str,
        feedback: str,
        rating: int
    ) -> bool:
        """
        Aprende de feedback del usuario

        Args:
            user_message: Mensaje original
            ai_response: Respuesta dada
            feedback: Feedback textual
            rating: Calificación 1-5

        Returns:
            True si se guardó correctamente
        """
        try:
            pattern = {
                'timestamp': datetime.now().isoformat(),
                'user_message': user_message,
                'ai_response': ai_response,
                'feedback': feedback,
                'rating': rating
            }

            self.memory['learned_patterns'].append(pattern)

            # Mantener solo últimos 50 patrones
            if len(self.memory['learned_patterns']) > 50:
                self.memory['learned_patterns'] = self.memory['learned_patterns'][-50:]

            self._save_memory()

            print(f"[AIEngine] Feedback registrado: Rating {rating}/5")
            return True

        except Exception as e:
            print(f"[AIEngine] Error guardando feedback: {e}")
            return False

    def get_relevant_context(
        self,
        query: str,
        limit: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Obtiene conversaciones relevantes de memoria

        Args:
            query: Consulta para buscar contexto relevante
            limit: Máximo de conversaciones a retornar

        Returns:
            Lista de conversaciones relevantes
        """
        relevant = []
        query_lower = query.lower()

        for conv in reversed(self.memory['conversations']):
            # Búsqueda simple por palabras clave
            if any(word in conv['user'].lower() for word in query_lower.split()):
                relevant.append(conv)
                if len(relevant) >= limit:
                    break

        return relevant

    def clear_history(self):
        """Limpia historial de conversación en RAM"""
        self.conversation_history = []
        print("[AIEngine] Historial de conversación limpiado")

    def get_stats(self) -> Dict[str, Any]:
        """Retorna estadísticas del motor"""
        return {
            **self.stats,
            'model': self.model,
            'memory_conversations': len(self.memory['conversations']),
            'memory_patterns': len(self.memory['learned_patterns']),
            'history_size': len(self.conversation_history),
            'ollama_available': self._check_ollama_health()
        }

# Singleton instance
_ai_engine_instance = None

def get_ai_engine(
    model: str = "mistral:latest",
    ollama_url: str = "http://localhost:11434"
) -> AIEngine:
    """Retorna instancia singleton del motor de IA"""
    global _ai_engine_instance

    if _ai_engine_instance is None:
        _ai_engine_instance = AIEngine(model=model, ollama_url=ollama_url)

    return _ai_engine_instance
