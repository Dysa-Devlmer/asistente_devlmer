/**
 * Kitchen Panel Component
 * Main kitchen display panel with real-time order updates
 */

import React from 'react';
import { useKitchen } from '../../../hooks/pos/useKitchen';
import { KITCHEN_STATIONS } from '../../../types/pos';
import { KitchenOrderCard } from './KitchenOrderCard';

export const KitchenPanel: React.FC = () => {
  const {
    orderedItems,
    stats,
    selectedStation,
    isConnected,
    loading,
    error,
    setSelectedStation,
    markServed,
    markAllServed,
    refresh,
    clearError,
    pendingCount,
    getStationCount,
  } = useKitchen();

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900">Panel de Cocina</h1>

            {/* Pending count badge */}
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-semibold">
                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Refresh button */}
            <button
              onClick={refresh}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50"
              title="Refrescar"
            >
              <svg
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                } ${isConnected ? 'animate-pulse' : ''}`}
              />
              <span className="text-sm font-medium text-gray-700">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* Station Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedStation(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStation === null
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas las Estaciones
            {stats && stats.totalItems > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-30 rounded-full text-xs">
                {stats.totalItems}
              </span>
            )}
          </button>

          {Object.entries(KITCHEN_STATIONS).map(([stationId, config]) => {
            const station = Number(stationId);
            const count = getStationCount(station);

            return (
              <button
                key={station}
                onClick={() => setSelectedStation(station)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStation === station
                    ? `${config.color} text-white`
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {config.name}
                {count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white bg-opacity-30 rounded-full text-xs">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-red-800">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && orderedItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Cargando pedidos...</p>
            </div>
          </div>
        ) : orderedItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-xl text-gray-600 font-medium">No hay pedidos pendientes</p>
              <p className="text-sm text-gray-500 mt-2">
                {selectedStation !== null
                  ? `No hay items pendientes en ${KITCHEN_STATIONS[selectedStation].name}`
                  : 'Todos los pedidos están completos'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orderedItems.map((order) => (
              <KitchenOrderCard
                key={order.id_venta}
                order={order}
                onMarkServed={markServed}
                onMarkAllServed={markAllServed}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {stats && stats.totalItems > 0 && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <span className="text-gray-600">
                <strong className="font-semibold text-gray-900">{stats.totalOrders}</strong>{' '}
                pedido{stats.totalOrders !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-600">
                <strong className="font-semibold text-gray-900">{stats.totalItems}</strong>{' '}
                item{stats.totalItems !== 1 ? 's' : ''} pendiente{stats.totalItems !== 1 ? 's' : ''}
              </span>
            </div>

            {stats.oldestOrder && (
              <span className="text-orange-600 font-medium">
                Pedido más antiguo: Mesa {stats.oldestOrder.mesa} (
                {Math.round(stats.oldestOrder.waitTime)} min)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
