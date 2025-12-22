import React, { useEffect, useMemo, useState } from 'react';
import {
  addItem,
  listProducts,
  createOrder,
  getOpenShift,
  getOrder,
  removeItem,
  updateItem,
  updateOrder
} from '../../api/pos';

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
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [itemNotes, setItemNotes] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [error, setError] = useState('');
  const [itemError, setItemError] = useState('');

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

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await listProducts({ limit: 50, active: true });
        setProducts(response.data?.data || []);
      } catch (err) {
        setItemError(err.message || 'Error cargando productos.');
      }
    };
    loadProducts();
  }, []);

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

  const handleAddItem = async () => {
    if (!orderId) return;
    setItemLoading(true);
    setItemError('');
    try {
      const payload = {
        productId: parseNumber(productId),
        quantity: parseNumber(quantity) || 1,
        notes: itemNotes || undefined
      };
      await addItem(orderId, payload);
      setItemNotes('');
      await loadOrder(orderId);
    } catch (err) {
      setItemError(err.message || 'Error agregando item.');
    } finally {
      setItemLoading(false);
    }
  };

  const handleUpdateItem = async (itemId, status) => {
    setItemLoading(true);
    setItemError('');
    try {
      await updateItem(itemId, { status });
      await loadOrder(orderId);
    } catch (err) {
      setItemError(err.message || 'Error actualizando item.');
    } finally {
      setItemLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setItemLoading(true);
    setItemError('');
    try {
      await removeItem(itemId, 'remove from pos ui');
      await loadOrder(orderId);
    } catch (err) {
      setItemError(err.message || 'Error eliminando item.');
    } finally {
      setItemLoading(false);
    }
  };

  const handleCloseOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      await updateOrder(orderId, { status: 'closed' });
      await loadOrder(orderId);
    } catch (err) {
      setError(err.message || 'Error cerrando orden.');
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
          <div className="space-y-4 text-sm">
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
            {order.closedAt && (
              <div className="text-gray-500">Closed at: {order.closedAt}</div>
            )}
            {order.status !== 'closed' && (
              <button
                onClick={handleCloseOrder}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                disabled={loading}
              >
                {loading ? 'Cerrando...' : 'Cerrar orden'}
              </button>
            )}

            <div className="border-t border-gray-700 pt-4 space-y-3">
              <h3 className="text-base font-semibold text-gray-200">Items</h3>
              {itemError && (
                <div className="text-sm text-red-400">{itemError}</div>
              )}
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-sm text-gray-300 md:col-span-2">
                  Producto
                  <select
                    className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    <option value="">Selecciona producto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.basePrice})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-gray-300">
                  Cantidad
                  <input
                    className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="1"
                  />
                </label>
                <label className="text-sm text-gray-300 md:col-span-3">
                  Notes
                  <input
                    className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded"
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    placeholder="Sin hielo"
                  />
                </label>
                <div className="md:col-span-3">
                  <button
                    onClick={handleAddItem}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                    disabled={itemLoading || !productId}
                  >
                    {itemLoading ? 'Agregando...' : 'Agregar item'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {(order.items || []).length === 0 && (
                  <p className="text-sm text-gray-400">Sin items.</p>
                )}
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-700 rounded p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-gray-200">
                      <div>
                        #{item.id} - {item.product?.name || 'Producto'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.status}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Qty: {item.quantity} | Total: {item.totalAmount}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-gray-500">
                        Notes: {item.notes}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleUpdateItem(item.id, 'sent_to_kitchen')}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                        disabled={itemLoading}
                      >
                        Enviar
                      </button>
                      <button
                        onClick={() => handleUpdateItem(item.id, 'cancelled')}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs"
                        disabled={itemLoading}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                        disabled={itemLoading}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Order;
