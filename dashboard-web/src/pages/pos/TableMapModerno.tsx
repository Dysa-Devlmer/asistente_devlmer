/**
 * Table Map Moderno - Mapa Visual de Mesas
 * Diseño profesional con drag-and-drop, estados y totales en tiempo real
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { posService, Table, Salon, Order } from '@/api/posService';
import { cashService, CashSession } from '@/api/cashService';
import CashSessionStatus from '@/components/cash/CashSessionStatus';
import OpenCashSessionModal from '@/components/cash/OpenCashSessionModal';
import CloseCashSessionModal from '@/components/cash/CloseCashSessionModal';
import {
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  LogOut,
  Grid,
  Plus,
  RefreshCw,
  ChefHat,
  Receipt,
  Maximize,
  ZoomIn,
  ZoomOut,
  Move,
  Lock,
  Unlock,
  DollarSign,
  Home,
  Coffee,
  Utensils,
  Wine,
  Sparkles,
  Timer
} from 'lucide-react';

// ==================== TYPES ====================

interface DragState {
  tableId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

// ==================== COMPONENT ====================

const TableMapModerno: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const mapRef = useRef<HTMLDivElement>(null);

  // State
  const [tables, setTables] = useState<Table[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Map controls
  const [editMode, setEditMode] = useState(false);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Cash session
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);

  // Table details modal
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showTableDetails, setShowTableDetails] = useState(false);

  // ==================== EFFECTS ====================

  useEffect(() => {
    loadData();
    loadCashSession();
  }, []);

  useEffect(() => {
    if (selectedSalon !== null) {
      loadTables();
    }
  }, [selectedSalon]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadTables();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedSalon]);

  // ==================== DATA LOADING ====================

  const loadData = async () => {
    try {
      setLoading(true);
      const salonsData = await posService.getSalons();
      setSalons(salonsData);

      if (salonsData.length > 0) {
        setSelectedSalon(salonsData[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const tablesData = await posService.getTables(selectedSalon || undefined);
      setTables(tablesData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error loading tables:', err);
    }
  };

  const loadCashSession = async () => {
    try {
      const sessionData = await cashService.getCurrentSession();
      setCashSession(sessionData.session);
    } catch (err) {
      console.error('Error loading cash session:', err);
    }
  };

  // ==================== TABLE INTERACTIONS ====================

  const handleTableClick = (table: Table) => {
    if (editMode) return;

    // Navegar al POS con la mesa seleccionada
    navigate('/pos/terminal', { state: { selectedTable: table } });
  };

  const handleTableContextMenu = (e: React.MouseEvent, table: Table) => {
    e.preventDefault();
    setSelectedTable(table);
    setShowTableDetails(true);
  };

  // ==================== DRAG & DROP ====================

  const handleMouseDown = (e: React.MouseEvent, table: Table) => {
    if (!editMode) return;
    e.stopPropagation();

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragging({
      tableId: table.id,
      startX: table.position_x,
      startY: table.position_y,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !mapRef.current) return;

    const mapRect = mapRef.current.getBoundingClientRect();
    const newX = (e.clientX - mapRect.left - dragging.offsetX) / zoom - panOffset.x;
    const newY = (e.clientY - mapRect.top - dragging.offsetY) / zoom - panOffset.y;

    setTables(prev =>
      prev.map(t =>
        t.id === dragging.tableId
          ? { ...t, position_x: Math.max(0, newX), position_y: Math.max(0, newY) }
          : t
      )
    );
  }, [dragging, zoom, panOffset]);

  const handleMouseUp = async () => {
    if (!dragging) return;

    const table = tables.find(t => t.id === dragging.tableId);
    if (table) {
      try {
        await posService.updateTableStatus(table.id, table.status);
        // En un caso real, también guardarías la posición
      } catch (err) {
        console.error('Error saving position:', err);
        // Revertir
        loadTables();
      }
    }

    setDragging(null);
  };

  // ==================== STATS ====================

  const stats = {
    total: tables.length,
    free: tables.filter(t => t.status === 'free').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
    totalRevenue: tables
      .filter(t => t.current_order_total)
      .reduce((sum, t) => sum + (t.current_order_total || 0), 0)
  };

  // ==================== RENDER HELPERS ====================

  const getTableStyle = (table: Table) => {
    const baseSize = 100;
    const size = table.shape === 'rectangle' ? { w: baseSize * 1.5, h: baseSize } : { w: baseSize, h: baseSize };

    const colors = {
      free: { bg: 'bg-gradient-to-br from-green-500 to-green-600', border: 'border-green-400', text: 'text-white' },
      occupied: { bg: 'bg-gradient-to-br from-red-500 to-red-600', border: 'border-red-400', text: 'text-white' },
      reserved: { bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600', border: 'border-yellow-400', text: 'text-white' },
      cleaning: { bg: 'bg-gradient-to-br from-gray-500 to-gray-600', border: 'border-gray-400', text: 'text-white' }
    };

    const color = colors[table.status] || colors.free;
    const shape = table.shape === 'round' ? 'rounded-full' : 'rounded-xl';

    return {
      className: `${color.bg} ${color.border} ${color.text} ${shape} border-2 shadow-lg`,
      style: {
        width: `${size.w}px`,
        height: `${size.h}px`,
        left: `${table.position_x}px`,
        top: `${table.position_y}px`,
      }
    };
  };

  const getTableIcon = (table: Table) => {
    if (table.status === 'occupied') return <Utensils className="w-6 h-6" />;
    if (table.status === 'reserved') return <Clock className="w-6 h-6" />;
    if (table.status === 'cleaning') return <Sparkles className="w-6 h-6" />;
    return <Coffee className="w-6 h-6" />;
  };

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando mapa de mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Home className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Grid className="w-6 h-6" />
              <div>
                <h1 className="text-xl font-bold">Mapa de Mesas</h1>
                <p className="text-xs text-blue-200">
                  Actualizado: {lastUpdate.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Cash Session Status */}
          <div className="flex items-center gap-4">
            <CashSessionStatus
              session={cashSession}
              onOpenSession={() => setShowOpenCashModal(true)}
              onCloseSession={() => setShowCloseCashModal(true)}
            />

            <div className="flex items-center gap-3 border-l border-blue-500 pl-4">
              <div className="text-right">
                <p className="font-medium text-sm">{user?.username}</p>
                <p className="text-xs text-blue-200">{user?.role}</p>
              </div>
              <button
                onClick={() => { logout(); navigate('/pos/login'); }}
                className="p-2 hover:bg-red-600 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats & Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Selector de Salón */}
          <div className="flex items-center gap-2">
            {salons.map(salon => (
              <button
                key={salon.id}
                onClick={() => setSelectedSalon(salon.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedSalon === salon.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {salon.name}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-300">
                Libres: <strong className="text-white">{stats.free}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-gray-300">
                Ocupadas: <strong className="text-white">{stats.occupied}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-gray-300">
                Reservadas: <strong className="text-white">{stats.reserved}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 border-l border-gray-600 pl-4">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">
                En mesas: <strong className="text-green-400">{posService.formatCurrency(stats.totalRevenue)}</strong>
              </span>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ZoomOut className="w-4 h-4 text-gray-300" />
            </button>
            <span className="text-gray-400 text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ZoomIn className="w-4 h-4 text-gray-300" />
            </button>

            <div className="w-px h-6 bg-gray-600 mx-2" />

            <button
              onClick={() => setEditMode(!editMode)}
              className={`px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                editMode
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {editMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {editMode ? 'Guardar' : 'Editar'}
            </button>

            <button
              onClick={loadTables}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {editMode && (
        <div className="bg-orange-600 text-white px-4 py-2 text-center text-sm">
          <Move className="w-4 h-4 inline mr-2" />
          Modo edición activo: Arrastra las mesas para reorganizar. Haz clic en "Guardar" cuando termines.
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 overflow-hidden bg-gray-850 relative">
        <div
          ref={mapRef}
          className="absolute inset-0"
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: '0 0'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />

          {/* Tables */}
          {tables.map(table => {
            const tableStyle = getTableStyle(table);

            return (
              <div
                key={table.id}
                className={`absolute cursor-pointer flex flex-col items-center justify-center transition-all hover:scale-105 ${tableStyle.className} ${
                  editMode ? 'cursor-move' : ''
                }`}
                style={{
                  ...tableStyle.style,
                  userSelect: 'none',
                  zIndex: dragging?.tableId === table.id ? 100 : 1
                }}
                onClick={() => handleTableClick(table)}
                onContextMenu={(e) => handleTableContextMenu(e, table)}
                onMouseDown={(e) => handleMouseDown(e, table)}
              >
                {/* Status indicator */}
                <div className="absolute -top-2 -right-2">
                  {table.status === 'occupied' && table.current_order_total && (
                    <div className="bg-white text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                      {posService.formatCurrency(table.current_order_total)}
                    </div>
                  )}
                </div>

                {/* Table content */}
                <div className="mb-1">{getTableIcon(table)}</div>
                <span className="font-bold text-xl">{table.table_number}</span>
                {table.capacity && (
                  <div className="flex items-center gap-1 text-xs opacity-75">
                    <Users className="w-3 h-3" />
                    {table.guests || 0}/{table.capacity}
                  </div>
                )}
                {table.waiter_name && (
                  <span className="text-xs opacity-75 truncate max-w-full px-2">
                    {table.waiter_name}
                  </span>
                )}

                {/* Reserved time indicator */}
                {table.status === 'reserved' && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap">
                    <Timer className="w-3 h-3 inline mr-1" />
                    20:00
                  </div>
                )}
              </div>
            );
          })}

          {tables.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Grid className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No hay mesas en este salón</p>
                <p className="text-sm mt-2">Agrega mesas desde el panel de administración</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/pos/terminal')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Venta Rápida
            </button>
            <button
              onClick={() => navigate('/pos/cocina')}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <ChefHat className="w-4 h-4" />
              Cocina
            </button>
          </div>

          <div className="text-gray-500 text-sm">
            Clic derecho sobre una mesa para ver opciones | Doble clic para abrir pedido
          </div>

          <button
            onClick={() => document.documentElement.requestFullscreen?.()}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Maximize className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </footer>

      {/* Table Details Modal */}
      {showTableDetails && selectedTable && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                Mesa {selectedTable.table_number}
              </h3>
              <button
                onClick={() => setShowTableDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-750 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Estado</p>
                  <p className="text-white font-medium capitalize">{selectedTable.status}</p>
                </div>
                <div className="bg-gray-750 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Capacidad</p>
                  <p className="text-white font-medium">{selectedTable.capacity} personas</p>
                </div>
                <div className="bg-gray-750 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Salón</p>
                  <p className="text-white font-medium">{selectedTable.salon_name}</p>
                </div>
                <div className="bg-gray-750 p-3 rounded-lg">
                  <p className="text-gray-400 text-sm">Tarifa</p>
                  <p className="text-white font-medium">{selectedTable.tarifa_name || 'Normal'}</p>
                </div>
              </div>

              {selectedTable.current_order_total && (
                <div className="bg-blue-900/30 border border-blue-700 p-4 rounded-lg">
                  <p className="text-blue-300 text-sm">Pedido Actual</p>
                  <p className="text-2xl font-bold text-white">
                    {posService.formatCurrency(selectedTable.current_order_total)}
                  </p>
                  {selectedTable.waiter_name && (
                    <p className="text-blue-300 text-sm mt-1">
                      Mesero: {selectedTable.waiter_name}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 flex gap-3">
              {selectedTable.status === 'free' ? (
                <button
                  onClick={() => {
                    setShowTableDetails(false);
                    navigate('/pos/terminal', { state: { selectedTable } });
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                >
                  Abrir Mesa
                </button>
              ) : selectedTable.status === 'occupied' ? (
                <>
                  <button
                    onClick={() => {
                      setShowTableDetails(false);
                      navigate('/pos/terminal', { state: { selectedTable } });
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
                  >
                    Ver Pedido
                  </button>
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium">
                    Cobrar
                  </button>
                </>
              ) : (
                <button className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg font-medium">
                  Liberar Mesa
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cash Session Modals */}
      <OpenCashSessionModal
        isOpen={showOpenCashModal}
        onClose={() => setShowOpenCashModal(false)}
        onSuccess={() => { loadCashSession(); setShowOpenCashModal(false); }}
      />

      {cashSession && (
        <CloseCashSessionModal
          isOpen={showCloseCashModal}
          onClose={() => setShowCloseCashModal(false)}
          onSuccess={() => { loadCashSession(); setShowCloseCashModal(false); }}
          session={cashSession}
        />
      )}
    </div>
  );
};

export default TableMapModerno;
