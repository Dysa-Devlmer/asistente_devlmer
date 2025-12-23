/**
 * Kitchen Order Card Component
 * Displays a single order with items grouped by station
 */

import React, { useState } from 'react';
import type { KitchenOrder } from '../../../types/pos';
import { KITCHEN_STATIONS } from '../../../types/pos';

interface KitchenOrderCardProps {
  order: KitchenOrder;
  onMarkServed: (id_venta: number, id_linea: number, quantity?: number) => Promise<void>;
  onMarkAllServed: (id_venta: number, station?: number) => Promise<void>;
}

export const KitchenOrderCard: React.FC<KitchenOrderCardProps> = ({
  order,
  onMarkServed,
  onMarkAllServed,
}) => {
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const [loadingAll, setLoadingAll] = useState(false);

  // Calculate order age in minutes
  const getOrderAge = () => {
    const orderDate = new Date(order.orderTime);
    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    return Math.floor(diffMs / 1000 / 60);
  };

  const orderAge = getOrderAge();

  // Get urgency color based on age
  const getUrgencyColor = () => {
    if (orderAge < 10) return 'bg-green-100 border-green-300';
    if (orderAge < 20) return 'bg-yellow-100 border-yellow-300';
    return 'bg-red-100 border-red-300';
  };

  // Handle mark item as served
  const handleMarkServed = async (id_linea: number) => {
    setLoadingItems((prev) => new Set(prev).add(id_linea));

    try {
      await onMarkServed(order.id_venta, id_linea);
    } catch (error) {
      console.error('Error marking item as served:', error);
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id_linea);
        return newSet;
      });
    }
  };

  // Handle mark all items as served
  const handleMarkAllServed = async () => {
    setLoadingAll(true);

    try {
      await onMarkAllServed(order.id_venta);
    } catch (error) {
      console.error('Error marking all as served:', error);
    } finally {
      setLoadingAll(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-2 overflow-hidden ${getUrgencyColor()}`}
    >
      {/* Order Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-2xl font-bold">Mesa {order.mesa}</h3>
            <p className="text-sm text-gray-300">Pedido #{order.id_venta}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{orderAge} min</p>
            <p className="text-xs text-gray-300">
              {new Date(order.orderTime).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Mark All Served Button */}
        <button
          onClick={handleMarkAllServed}
          disabled={loadingAll}
          className="w-full mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingAll ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Marcando...
            </span>
          ) : (
            '✓ Marcar Todo Servido'
          )}
        </button>
      </div>

      {/* Items by Station */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {Array.from(order.itemsByStation.entries())
          .sort(([a], [b]) => a - b) // Sort by station number
          .map(([stationId, items]) => {
            const stationConfig = KITCHEN_STATIONS[stationId];

            return (
              <div key={stationId} className="border-l-4 pl-3" style={{ borderColor: stationConfig.color.replace('bg-', '#') }}>
                {/* Station Header */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${stationConfig.color}`}></div>
                  <h4 className={`font-semibold ${stationConfig.textColor}`}>
                    {stationConfig.name}
                  </h4>
                </div>

                {/* Station Items */}
                <div className="space-y-2">
                  {items.map((item) => {
                    const isLoading = loadingItems.has(item.id_linea);

                    return (
                      <div
                        key={item.id_linea}
                        className="bg-gray-50 rounded-lg p-3 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          {/* Item Name and Quantity */}
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-2xl font-bold text-gray-900">
                              {item.pendingQty}x
                            </span>
                            <span className="text-base font-medium text-gray-800 truncate">
                              {item.complementog}
                            </span>
                          </div>

                          {/* Notes and Observations */}
                          {(item.nota || item.observaciones) && (
                            <div className="text-sm space-y-1">
                              {item.nota && (
                                <p className="text-blue-700 italic">
                                  📝 {item.nota}
                                </p>
                              )}
                              {item.observaciones && (
                                <p className="text-orange-700 font-medium">
                                  ⚠️ {item.observaciones}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Mark Served Button */}
                        <button
                          onClick={() => handleMarkServed(item.id_linea)}
                          disabled={isLoading}
                          className="flex-shrink-0 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                          title="Marcar como servido"
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            '✓ OK'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
