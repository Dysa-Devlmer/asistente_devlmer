import React, { useEffect, useMemo, useState } from 'react';
import { createOrder, getOpenShift, getOrder } from '../../api/pos';

const parseNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

function Order({ onNavigate }) {
  const params = useMemo(
    () => new URLSearchParams(window.location.search),
    []
  );
  const initialTableId = params.get('tableId');
  const initialOrderId = params.get('orderId');

  const [tableId, setTableId] = useState(initialTableId || '');
  const [orderId, setOrderId] = useState(initialOrderId || '');
  const [order, setOrder] = useState(null);
  const [shift, setShift] = useState(null);
  const [guestCount, setGuestCount] = useState('2');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleCreateOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        tableId: parseNumber(tableId),
        waiterId: 1,
        shiftId: Number(shift.id),
        guestCount: parseNumber(guestCount),
        notes: notes || undefined
      };
      const response = await createOrder(payload);
      setOrder(response.data);
      setOrderId(response.data.id);
      onNavigate?.(`/pos/order?orderId=${response.data.id}`);
    } catch (err) {
      setError(err.message || 'Error creando orden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Orden</h2>
          <p className="text-sm text-gray-400">
            Crear y ver orden antes de agregar items.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('/pos/tables')}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Volver a mesas
          </button>
          {orderId && (
            <button
              onClick={() => loadOrder(orderId)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Recargar'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded p-4 space-y-4">
        <div className="text-sm text-gray-400">
          Shift abierto: {shift ? `#${shift.id}` : 'No encontrado'}
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        {!order && (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-gray-300">
              Table ID
              <input
                className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                placeholder="e.g. 62"
              />
            </label>
            <label className="text-sm text-gray-300">
              Guest count
              <input
                className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                placeholder="2"
              />
            </label>
            <label className="text-sm text-gray-300 md:col-span-2">
              Notes
              <input
                className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observaciones"
              />
            </label>
            <div className="md:col-span-2">
              <button
                onClick={handleCreateOrder}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                disabled={loading || !shift || !tableId}
              >
                {loading ? 'Creando...' : 'Crear orden'}
              </button>
            </div>
          </div>
        )}

        {order && (
          <div className="space-y-2 text-sm">
            <div className="text-gray-300">
              Orden #{order.id} - {order.status}
            </div>
            <div className="text-gray-400">
              Order number: {order.orderNumber || 'N/A'}
            </div>
            <div className="text-gray-400">
              Subtotal: {order.subtotal || '0'} | Tax: {order.taxAmount || '0'} |
              Total: {order.totalAmount || '0'}
            </div>
            <div className="text-gray-500">
              Guest count: {order.guestCount || 'N/A'}
            </div>
            {order.notes && (
              <div className="text-gray-500">Notes: {order.notes}</div>
            )}
            <div className="text-xs text-gray-500">
              Items UI se agrega en el siguiente bloque.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Order;
