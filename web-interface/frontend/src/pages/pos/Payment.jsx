import React, { useEffect, useMemo, useState } from 'react';
import { createPayment, getOpenShift, getOrder } from '../../api/pos';

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

function Payment({ onNavigate }) {
  const params = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const initialOrderId = params.get('orderId');

  const [orderId, setOrderId] = useState(initialOrderId || '');
  const [order, setOrder] = useState(null);
  const [shift, setShift] = useState(null);
  const [paymentMethodId, setPaymentMethodId] = useState('1');
  const [processedByUserId, setProcessedByUserId] = useState('11');
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const loadShift = async () => {
    try {
      const openShift = await getOpenShift();
      setShift(openShift);
      if (!openShift) {
        setError('No hay shift abierto. Abre uno en backend.');
      }
    } catch (err) {
      setError(err.message || 'Error cargando shift.');
    }
  };

  const loadOrder = async (id) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const response = await getOrder(id);
      setOrder(response.data);
      if (!amount) {
        setAmount(response.data?.totalAmount || '');
      }
    } catch (err) {
      setError(err.message || 'Error cargando orden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShift();
  }, []);

  useEffect(() => {
    if (orderId) {
      loadOrder(orderId);
    }
  }, [orderId]);

  const handlePay = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        orderId: parseNumber(orderId),
        paymentMethodId: parseNumber(paymentMethodId),
        shiftId: parseNumber(shift?.id),
        processedByUserId: parseNumber(processedByUserId),
        amount: parseNumber(amount),
        referenceNumber: referenceNumber || undefined
      };
      const response = await createPayment(payload);
      setResult(response.data);
    } catch (err) {
      setError(err.message || 'Error registrando pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Pago</h2>
          <p className="text-sm text-gray-400">
            Registrar pago para orden cerrada.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.(`/pos/order?orderId=${orderId}`)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Volver a orden
          </button>
          <button
            onClick={() => loadOrder(orderId)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            disabled={loading || !orderId}
          >
            {loading ? 'Actualizando...' : 'Recargar'}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded p-4 space-y-4">
        <div className="text-sm text-gray-400">
          Shift abierto: {shift ? `#${shift.id}` : 'No encontrado'}
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        {order && (
          <div className="text-sm text-gray-300">
            Orden #{order.id} - {order.status} | Total: {order.totalAmount || '0'}
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
            Payment method ID
            <input
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              value={paymentMethodId}
              onChange={(e) => setPaymentMethodId(e.target.value)}
              placeholder="1"
            />
          </label>
          <label className="text-sm text-gray-300">
            Processed by user ID
            <input
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              value={processedByUserId}
              onChange={(e) => setProcessedByUserId(e.target.value)}
              placeholder="11"
            />
          </label>
          <label className="text-sm text-gray-300">
            Amount
            <input
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="2950"
            />
          </label>
          <label className="text-sm text-gray-300 md:col-span-2">
            Reference number
            <input
              className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="POS-0001"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePay}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
            disabled={loading || !orderId || !shift}
          >
            {loading ? 'Registrando...' : 'Registrar pago'}
          </button>
          {result && (
            <div className="text-sm text-green-400">
              Pago registrado: #{result.id}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Payment;
