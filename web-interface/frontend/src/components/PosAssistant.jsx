import React, { useState } from 'react';
import { sendJarvisChat } from '../api/jarvis';

function PosAssistant({ title = 'Asistente POS', onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError('');
    setLoading(true);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);

    try {
      const response = await sendJarvisChat(text);
      const reply = response.data?.reply || 'sin respuesta';
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (err) {
      setError(err.message || 'Error enviando mensaje.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-200"
          >
            Cerrar
          </button>
        )}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded p-3 h-56 overflow-y-auto space-y-2 text-sm">
        {messages.length === 0 && (
          <div className="text-gray-400">Escribe un mensaje...</div>
        )}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === 'user'
                ? 'text-blue-300'
                : 'text-green-300'
            }
          >
            <span className="font-semibold">
              {message.role === 'user' ? 'Tu' : 'Asistente'}:
            </span>{' '}
            {message.text}
          </div>
        ))}
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe..."
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}

export default PosAssistant;
