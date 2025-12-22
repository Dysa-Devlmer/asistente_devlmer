import React, { useEffect, useMemo, useState } from 'react';
import { createInvoice, getInvoiceByOrder, getOrder } from '../../api/pos';

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

function Invoice({ onNavigate }) {
  const params = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const initialOrderId = params.get('orderId');

  const [orderId, setOrderId] = useState(initialOrderId || '');
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [documentType, setDocumentType] = useState('boleta');
  const [series, setSeries] = useState('B001');
  const [documentNumber, setDocumentNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const loadOrder = async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const response = await getOrder(id);
      setOrder(response.data);
    } catch (err) {
      setError(err.message || 'Error cargando orden.');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoice = async (id) => {
    if (!id) return;
    try {
      const response = await getInvoiceByOrder(id);
      setInvoice(response.data || null);
    } catch (err) {
      if (err.status === 404) {
        setInvoice(null);
        return;
      }
      setError(err.message || 'Error cargando factura.');
    }
  };

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
      loadInvoice(orderId);
    }
  }, [orderId]);

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        orderId: parseNumber(orderId),
        documentType,
        series,
        documentNumber,
        customerId: parseNumber(customerId) || undefined,
        notes: notes || undefined
      };
      const response = await createInvoice(payload);
      setResult(response.data);
      await loadInvoice(orderId);
      await loadOrder(orderId);
    } catch (err) {
      setError(err.message || 'Error creando factura.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Factura</h2>
          <p className="text-sm text-gray-400">
            Crear factura para orden cerrada.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.(`/pos/payment?orderId=${orderId}`)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Volver a pago
          </button>
          <button
            onClick={() => onNavigate?.('/pos/validator')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Ir a validator
          </button>
          <button
            onClick={() => loadInvoice(orderId)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            disabled={loading || !orderId}
          >
            {loading ? 'Actualizando...' : 'Recargar'}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded p-4 space-y-4">
        {error && <div className="text-sm text-red-400">{error}</div>}
        {order && (
          <div className="text-sm text-gray-300">
            Orden #{order.id} - {order.status} | Total: {order.totalAmount || '0'}
          </div>
        )}
        {invoice && (
          <div className="text-sm text-green-400">
            Factura existente: #{invoice.id} ({invoice.documentType})
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-gray-300">
            Order ID
            <input
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="8035"
            />
          </label>
          <label className="text-sm text-gray-300">
            Document type
            <select
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option value="boleta">boleta</option>
              <option value="factura">factura</option>
              <option value="ticket">ticket</option>
            </select>
          </label>
          <label className="text-sm text-gray-300">
            Series
            <input
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              placeholder="B001"
            />
          </label>
          <label className="text-sm text-gray-300">
            Document number
            <input
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              placeholder="00001234"
            />
          </label>
          <label className="text-sm text-gray-300">
            Customer ID (optional)
            <input
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="1"
            />
          </label>
          <label className="text-sm text-gray-300 md:col-span-2">
            Notes (optional)
            <input
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
            disabled={loading || !orderId || !documentNumber}
          >
            {loading ? 'Creando...' : 'Crear factura'}
          </button>
          {result && (
            <div className="text-sm text-green-400">
              Factura creada: #{result.id}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Invoice;
