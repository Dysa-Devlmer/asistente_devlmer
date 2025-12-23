/**
 * POSMain Page
 * Main POS interface with table map and sale management
 * Entry point for authenticated employees
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useSale } from '../../hooks/pos/useSale';
import { TableMap } from '../../components/pos/TableMap/TableMap';
import { SaleView } from '../../components/pos/SaleView/SaleView';
import { CheckoutModal } from '../../components/pos/Checkout/CheckoutModal';
import { KitchenPanel } from '../../components/pos/KitchenPanel/KitchenPanel';
import { Table } from '../../types/pos';

type ViewMode = 'tables' | 'sale' | 'kitchen';

export const POSMain: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, session, logout, getEmployeeName, getCashRegister, getWarehouse } = useAuthStore();
  const { createSale, loadSale, currentSale } = useSale();

  const [viewMode, setViewMode] = useState<ViewMode>('tables');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/pos/login');
    }
  }, [isAuthenticated, navigate]);

  // Handle new sale creation
  const handleNewSale = async (mesa: string) => {
    if (!session) return;

    try {
      await createSale(mesa);
      setViewMode('sale');
    } catch (err) {
      console.error('Error creating sale:', err);
      alert('Error al crear venta: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  // Handle opening existing sale
  const handleTableClick = async (table: Table) => {
    if (table.venta_activa?.id_venta) {
      try {
        await loadSale(table.venta_activa.id_venta);
        setViewMode('sale');
      } catch (err) {
        console.error('Error loading sale:', err);
        alert('Error al cargar venta: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      }
    }
  };

  // Handle back to tables
  const handleBackToTables = () => {
    setViewMode('tables');
  };

  // Handle checkout
  const handleCheckout = () => {
    setShowCheckout(true);
  };

  // Handle checkout success
  const handleCheckoutSuccess = () => {
    setShowCheckout(false);
    setViewMode('tables');
    alert('¡Venta finalizada correctamente!');
  };

  // Handle logout
  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      logout();
      navigate('/pos/login');
    }
  };

  if (!isAuthenticated || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Logo & Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <div>
                  <h1 className="text-xl font-bold">POS Restaurant</h1>
                  <p className="text-xs opacity-75">{getWarehouse()} • {getCashRegister()}</p>
                </div>
              </div>
            </div>

            {/* Center: View Tabs */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('tables')}
                className={`
                  px-4 py-2 rounded-lg font-semibold transition-all
                  ${viewMode === 'tables'
                    ? 'bg-white text-blue-700 shadow-lg'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'}
                `}
              >
                <svg className="w-5 h-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Mesas
              </button>

              <button
                onClick={() => setViewMode('kitchen')}
                className={`
                  px-4 py-2 rounded-lg font-semibold transition-all
                  ${viewMode === 'kitchen'
                    ? 'bg-white text-blue-700 shadow-lg'
                    : 'bg-blue-600 hover:bg-blue-500 text-white'}
                `}
              >
                <svg className="w-5 h-5 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Cocina
              </button>
            </div>

            {/* Right: User Menu */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="font-semibold">{getEmployeeName()}</p>
                <p className="text-xs opacity-75">{session.id_camarero}</p>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        alert('Función en desarrollo');
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                      <span>Configuración</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        alert('Función en desarrollo');
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Informes</span>
                    </button>

                    <hr className="my-2" />

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'tables' && (
          <TableMap
            onTableClick={handleTableClick}
            onNewSale={handleNewSale}
            anchotpv={980}
            altotpv={700}
          />
        )}

        {viewMode === 'sale' && (
          <SaleView
            onClose={handleBackToTables}
            onCheckout={handleCheckout}
          />
        )}

        {viewMode === 'kitchen' && <KitchenPanel />}
      </div>

      {/* Checkout Modal */}
      {showCheckout && currentSale && (
        <CheckoutModal
          onClose={() => setShowCheckout(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
};
