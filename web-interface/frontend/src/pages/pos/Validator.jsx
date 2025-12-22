import React, { useEffect, useState } from 'react';
import { getConsistency } from '../../api/pos';

function Validator({ onNavigate }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runValidator = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await getConsistency({ format: 'json', limit: 50 });
      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Error ejecutando validator.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runValidator();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Validator</h2>
          <p className="text-sm text-gray-400">
            Consistencia de orders/items/payments/invoices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('/pos/invoice')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Volver a factura
          </button>
          <button
            onClick={runValidator}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            disabled={loading}
          >
            {loading ? 'Ejecutando...' : 'Ejecutar'}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded p-4">
        {loading && (
          <p className="text-sm text-gray-300">Generando reporte...</p>
        )}
        {!loading && error && (
          <div className="text-sm text-red-400">Error: {error}</div>
        )}
        {!loading && !error && result && (
          <div className="space-y-3 text-sm">
            <div className="text-green-400">
              Generated: {result.generatedAt}
            </div>
            <div className="text-gray-300">
              Order totals mismatch: {result.orderTotalsMismatch?.count ?? 0}
            </div>
            <div className="text-gray-300">
              Order item orphans: {result.orderItemOrphans?.count ?? 0}
            </div>
            <div className="text-gray-300">
              Payment orphans: {result.paymentOrphans?.count ?? 0}
            </div>
            <div className="text-gray-300">
              Invoice orphans: {result.invoiceOrphans?.count ?? 0}
            </div>
          </div>
        )}
        {!loading && !error && !result && (
          <div className="text-sm text-gray-400">Sin datos.</div>
        )}
      </div>
    </section>
  );
}

export default Validator;
