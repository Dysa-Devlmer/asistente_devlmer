import React, { useEffect, useState } from 'react';
import { listTables } from '../../api/pos';

const pickFallbackTable = (tables) =>
  tables.find((table) => table.tableNumber === 'MESA_SISTEMA') || null;

function Tables({ onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState([]);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  const loadTables = async () => {
    setLoading(true);
    setError('');
    setUsingFallback(false);
    try {
      const available = await listTables({ status: 'available', limit: 50 });
      const availableRows = available.data?.data || [];

      if (availableRows.length > 0) {
        setTables(availableRows);
        return;
      }

      const allTables = await listTables({ limit: 50 });
      const allRows = allTables.data?.data || [];
      const fallback = pickFallbackTable(allRows);

      if (fallback) {
        setUsingFallback(true);
        setTables([fallback]);
        return;
      }

      setTables([]);
      setError('No hay mesas disponibles ni mesa MESA_SISTEMA.');
    } catch (err) {
      setError(err.message || 'Error cargando mesas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Mesas</h2>
          <p className="text-sm text-gray-400">
            Selecciona una mesa para crear orden.
          </p>
          {usingFallback && (
            <p className="text-xs text-yellow-400 mt-1">
              Usando mesa MESA_SISTEMA como fallback.
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('/pos')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Volver
          </button>
          <button
            onClick={loadTables}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Recargar'}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded p-4">
        {loading && (
          <p className="text-sm text-gray-300">Cargando mesas...</p>
        )}
        {!loading && error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {!loading && !error && tables.length === 0 && (
          <p className="text-sm text-gray-400">Sin mesas.</p>
        )}
        {!loading && !error && tables.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {tables.map((table) => (
              <div
                key={table.id}
                className="border border-gray-700 rounded p-3 flex flex-col gap-2"
              >
                <div className="text-sm text-gray-400">Mesa</div>
                <div className="text-lg font-semibold">
                  {table.tableNumber}
                </div>
                <div className="text-xs text-gray-500">
                  Sala: {table.room?.name || 'N/A'}
                </div>
                <button
                  onClick={() => onNavigate?.(`/pos/order?tableId=${table.id}`)}
                  className="mt-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  Crear orden
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default Tables;
