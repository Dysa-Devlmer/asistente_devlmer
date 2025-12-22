import React, { useEffect, useState } from 'react';
import { getConsistency } from '../../api/pos';

const formatError = (error) => {
  if (!error) return '';
  if (error.message) return error.message;
  return 'Error desconocido';
};

function PosHome() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runCheck = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await getConsistency({ format: 'json', limit: 1 });
      setResult(response.data);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">POS - Estado backend</h2>
          <p className="text-sm text-gray-400">
            Base URL: http://localhost:3000/api
          </p>
        </div>
        <button
          onClick={runCheck}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          disabled={loading}
        >
          {loading ? 'Probando...' : 'Probar conexion'}
        </button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded p-4">
        {loading && <p className="text-sm text-gray-300">Consultando validator...</p>}
        {!loading && error && (
          <div className="text-sm text-red-400">
            Error: {error}
          </div>
        )}
        {!loading && !error && result && (
          <div className="text-sm text-green-400">
            OK - Validator generado: {result.generatedAt}
          </div>
        )}
        {!loading && !error && !result && (
          <div className="text-sm text-gray-400">
            Sin datos por ahora.
          </div>
        )}
      </div>
    </section>
  );
}

export default PosHome;
