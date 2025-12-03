/**
 * Kitchen Display Moderno - Pantalla de Cocina Multi-Destino
 * Soporta: Cocina Principal, Cocina 1-4, Barra
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { kitchenService, KitchenOrder, KitchenStation, Destination, KitchenItemStatus } from '@/api/kitchenService';
import {
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Bell,
  RefreshCw,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Home,
  Flame,
  Wine,
  UtensilsCrossed,
  Timer,
  Users,
  Printer
} from 'lucide-react';

// ==================== COMPONENT ====================

const KitchenDisplayModerno: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Destino seleccionado (de URL o default)
  const destinationParam = searchParams.get('destination') as Destination | null;
  const [selectedDestination, setSelectedDestination] = useState<Destination | 'all'>(destinationParam || 'all');

  // Estado
  const [stations, setStations] = useState<KitchenStation[]>([]);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);

  // ==================== EFFECTS ====================

  useEffect(() => {
    loadStations();
    loadOrders();
  }, [selectedDestination]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadOrders();
    }, 15000); // Refresh cada 15 segundos

    return () => clearInterval(interval);
  }, [autoRefresh, selectedDestination]);

  // ==================== DATA LOADING ====================

  const loadStations = async () => {
    try {
      const data = await kitchenService.getStations();
      setStations(data);
    } catch (error) {
      console.error('Error loading stations:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const destination = selectedDestination === 'all' ? undefined : selectedDestination;
      const data = await kitchenService.getOrders(destination);

      // Detectar nuevos pedidos para sonido
      if (soundEnabled && orders.length > 0) {
        const newOrders = data.filter(
          newOrder => !orders.find(o => o.id === newOrder.id)
        );
        if (newOrders.length > 0) {
          playNotificationSound();
        }
      }

      setOrders(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/kitchen-bell.mp3');
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('Could not play notification sound');
    }
  };

  // ==================== ACTIONS ====================

  const handleStartPreparing = async (orderId: number) => {
    try {
      await kitchenService.startPreparingOrder(orderId);
      loadOrders();
    } catch (error) {
      console.error('Error starting preparation:', error);
    }
  };

  const handleMarkReady = async (orderId: number) => {
    try {
      await kitchenService.markOrderReady(orderId);
      await kitchenService.notifyWaiter(orderId);
      loadOrders();
    } catch (error) {
      console.error('Error marking ready:', error);
    }
  };

  const handlePrint = async (orderId: number) => {
    try {
      await kitchenService.printComanda(orderId);
    } catch (error) {
      console.error('Error printing:', error);
    }
  };

  // ==================== STATS ====================

  const stats = {
    pending: orders.filter(o => o.status === 'pending' || o.status === 'sent').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    urgent: orders.filter(o => o.priority === 'urgent').length,
    avgTime: orders.length > 0
      ? Math.round(orders.reduce((sum, o) => sum + o.elapsed_minutes, 0) / orders.length)
      : 0
  };

  // ==================== RENDER HELPERS ====================

  const getOrderCardStyle = (order: KitchenOrder) => {
    let borderColor = 'border-blue-500';
    let bgColor = 'bg-gray-800';
    let pulseClass = '';

    if (order.priority === 'urgent') {
      borderColor = 'border-red-500';
      bgColor = 'bg-red-900/20';
      pulseClass = 'animate-pulse';
    } else if (order.priority === 'high') {
      borderColor = 'border-orange-500';
      bgColor = 'bg-orange-900/20';
    }

    if (order.status === 'preparing') {
      borderColor = 'border-yellow-500';
    } else if (order.status === 'ready') {
      borderColor = 'border-green-500';
      bgColor = 'bg-green-900/20';
    }

    return `${bgColor} ${borderColor} ${pulseClass}`;
  };

  const getStatusBadge = (status: KitchenItemStatus) => {
    const config = {
      pending: { bg: 'bg-yellow-600', text: 'Pendiente', icon: Clock },
      sent: { bg: 'bg-blue-600', text: 'Enviado', icon: Clock },
      preparing: { bg: 'bg-orange-600', text: 'Preparando', icon: Flame },
      ready: { bg: 'bg-green-600', text: 'Listo', icon: CheckCircle },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`${c.bg} text-white text-xs px-2 py-1 rounded-full flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {c.text}
      </span>
    );
  };

  const getDestinationIcon = (destination: Destination) => {
    const icons: Record<Destination, React.ReactNode> = {
      kitchen: <ChefHat className="w-5 h-5" />,
      bar: <Wine className="w-5 h-5" />,
      kitchen_1: <Flame className="w-5 h-5" />,
      kitchen_2: <UtensilsCrossed className="w-5 h-5" />,
      kitchen_3: <UtensilsCrossed className="w-5 h-5" />,
      kitchen_4: <UtensilsCrossed className="w-5 h-5" />,
    };
    return icons[destination] || <ChefHat className="w-5 h-5" />;
  };

  // ==================== RENDER ====================

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-700 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold">Pantalla de Cocina</h1>
              <p className="text-xs text-gray-400">
                Actualizado: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Destino */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDestination('all')}
            className={`px-3 py-2 rounded-lg font-medium transition-colors ${
              selectedDestination === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Todos
          </button>
          {stations.map(station => (
            <button
              key={station.id}
              onClick={() => setSelectedDestination(station.destination)}
              className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedDestination === station.destination
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {getDestinationIcon(station.destination)}
              <span className="hidden lg:inline">{station.name}</span>
            </button>
          ))}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadOrders()}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={() => document.documentElement.requestFullscreen?.()}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            title="Pantalla completa"
          >
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-yellow-400 font-bold text-lg">{stats.pending}</span>
              <span className="text-gray-400 text-sm">Pendientes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span className="text-orange-400 font-bold text-lg">{stats.preparing}</span>
              <span className="text-gray-400 text-sm">Preparando</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-green-400 font-bold text-lg">{stats.ready}</span>
              <span className="text-gray-400 text-sm">Listos</span>
            </div>
            {stats.urgent > 0 && (
              <div className="flex items-center gap-2 bg-red-900/30 px-3 py-1 rounded-full animate-pulse">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-bold">{stats.urgent}</span>
                <span className="text-red-300 text-sm">Urgentes</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Timer className="w-4 h-4" />
            <span>Tiempo promedio: <strong className="text-white">{stats.avgTime} min</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        {loading && orders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Cargando pedidos...</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ChefHat className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">Sin pedidos pendientes</p>
              <p className="text-gray-500 mt-2">Los pedidos aparecerán aquí automáticamente</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orders.map(order => (
              <div
                key={order.id}
                className={`rounded-xl border-l-4 shadow-lg overflow-hidden transition-all hover:shadow-xl ${getOrderCardStyle(order)}`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {order.table_number ? (
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold">
                          Mesa {order.table_number}
                        </div>
                      ) : (
                        <div className="bg-purple-600 text-white px-3 py-1 rounded-lg font-bold">
                          Para Llevar
                        </div>
                      )}
                      {order.salon_name && (
                        <span className="text-xs text-gray-400">{order.salon_name}</span>
                      )}
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      <span>#{order.order_number}</span>
                      {order.waiter_name && (
                        <>
                          <span className="mx-1">·</span>
                          <span>{order.waiter_name}</span>
                        </>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 font-bold ${
                      order.elapsed_minutes > 30 ? 'text-red-400' :
                      order.elapsed_minutes > 15 ? 'text-orange-400' :
                      'text-green-400'
                    }`}>
                      <Clock className="w-4 h-4" />
                      {kitchenService.formatTime(order.elapsed_minutes)}
                    </div>
                  </div>

                  {order.priority === 'urgent' && (
                    <div className="mt-2 bg-red-600 text-white text-center py-1 rounded font-bold text-sm animate-pulse">
                      ⚠️ URGENTE - Más de 30 minutos
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg ${
                          item.status === 'ready' ? 'bg-green-900/30 border border-green-700' : 'bg-gray-750'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-gray-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                                {item.quantity}
                              </span>
                              <span className="font-medium text-white">{item.product_name}</span>
                            </div>
                            {/* Modificadores */}
                            {item.modifiers && item.modifiers.length > 0 && (
                              <div className="ml-8 mt-1 space-y-0.5">
                                {item.modifiers.map((mod, modIdx) => (
                                  <div key={modIdx} className="text-xs text-purple-400">
                                    • {mod.name}
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Notas */}
                            {item.notes && (
                              <div className="ml-8 mt-1 text-xs text-orange-400 bg-orange-900/30 px-2 py-1 rounded">
                                📝 {item.notes}
                              </div>
                            )}
                          </div>
                          {item.status === 'ready' && (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Notas del pedido */}
                  {order.notes && (
                    <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                      <p className="text-sm text-yellow-300">
                        <strong>⚠️ Notas:</strong> {order.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-3 bg-gray-750 border-t border-gray-700 flex gap-2">
                  {order.status === 'pending' || order.status === 'sent' ? (
                    <button
                      onClick={() => handleStartPreparing(order.id)}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Comenzar
                    </button>
                  ) : order.status === 'preparing' ? (
                    <button
                      onClick={() => handleMarkReady(order.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Listo
                    </button>
                  ) : (
                    <button
                      onClick={() => kitchenService.notifyWaiter(order.id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      Llamar Mesero
                    </button>
                  )}
                  <button
                    onClick={() => handlePrint(order.id)}
                    className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg"
                    title="Imprimir"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-center text-sm text-gray-500">
        SYSME POS - Pantalla de Cocina | Auto-refresh: {autoRefresh ? 'Activado (15s)' : 'Desactivado'}
      </footer>
    </div>
  );
};

export default KitchenDisplayModerno;
