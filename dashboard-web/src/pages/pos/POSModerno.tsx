/**
 * POS Moderno - Terminal de Punto de Venta
 * Diseño profesional estilo sistema legacy con funcionalidades avanzadas
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { posService, Category, Product, Order, OrderItem, Table, Destination } from '@/api/posService';
import { cashService, CashSession } from '@/api/cashService';
import ProductModifiersSelectionModal, { SelectedModifier } from '@/components/ProductModifiersSelectionModal';
import MixedPaymentModal from '@/components/MixedPaymentModal';
import TipSelectionModal from '@/components/TipSelectionModal';
import OpenCashSessionModal from '@/components/cash/OpenCashSessionModal';
import CloseCashSessionModal from '@/components/cash/CloseCashSessionModal';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Send,
  CreditCard,
  Banknote,
  Wallet,
  Users,
  UtensilsCrossed,
  Coffee,
  ChefHat,
  Clock,
  ArrowRightLeft,
  SplitSquareVertical,
  Receipt,
  Printer,
  Settings,
  LogOut,
  Home,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';

// ==================== INTERFACES ====================

interface CartItem extends OrderItem {
  tempId: string;
  productData?: Product;
}

// ==================== COMPONENT ====================

const POSModerno: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Estado principal
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Pedido actual
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Modales y UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedProductForModifiers, setSelectedProductForModifiers] = useState<Product | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMixedPaymentModal, setShowMixedPaymentModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Caja
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [showOpenCashModal, setShowOpenCashModal] = useState(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);

  // Tablas disponibles
  const [availableTables, setAvailableTables] = useState<Table[]>([]);

  // Propinas
  const [tipAmount, setTipAmount] = useState(0);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<string>('');

  // ==================== EFFECTS ====================

  useEffect(() => {
    loadInitialData();
    loadCashSession();

    // Verificar si viene con mesa seleccionada
    if (location.state?.selectedTable) {
      handleTableSelect(location.state.selectedTable);
    }
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchQuery, products]);

  // ==================== DATA LOADING ====================

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [categoriesData, productsData, tablesData] = await Promise.all([
        posService.getCategories(),
        posService.getProducts(),
        posService.getTables()
      ]);

      setCategories(categoriesData);
      setProducts(productsData);
      setAvailableTables(tablesData);

      // Seleccionar primera categoría
      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].id);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error cargando datos');
    } finally {
      setLoading(false);
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

  const filterProducts = () => {
    let filtered = [...products];

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(filtered);
  };

  // ==================== TABLE HANDLING ====================

  const handleTableSelect = async (table: Table) => {
    setSelectedTable(table);
    setShowTableSelector(false);

    // Si la mesa tiene pedido activo, cargarlo
    if (table.current_order_id) {
      try {
        const order = await posService.getOrder(table.current_order_id);
        setCurrentOrder(order);
        setCartItems(order.items.map(item => ({
          ...item,
          tempId: `item_${item.id}`
        })));
      } catch (err) {
        console.error('Error loading order:', err);
      }
    } else {
      // Crear nuevo pedido
      setCurrentOrder(null);
      setCartItems([]);
    }
  };

  // ==================== PRODUCT HANDLING ====================

  const handleProductClick = (product: Product) => {
    if (!selectedTable && !currentOrder) {
      setError('Seleccione una mesa primero');
      return;
    }

    // Si tiene modificadores, abrir modal
    if (product.has_modifiers) {
      setSelectedProductForModifiers(product);
      setShowModifiersModal(true);
    } else {
      addProductToCart(product, []);
    }
  };

  const addProductToCart = (product: Product, modifiers: SelectedModifier[]) => {
    const tarifaMultiplier = selectedTable?.tarifa_multiplier || 1;
    const basePrice = product.price * tarifaMultiplier;
    const modifiersTotal = modifiers.reduce((sum, m) => sum + m.modifier_price, 0);
    const totalPrice = basePrice + modifiersTotal;

    const newItem: CartItem = {
      tempId: `item_${Date.now()}_${Math.random()}`,
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      unit_price: totalPrice,
      modifiers: modifiers.map(m => ({
        id: m.modifier_id,
        name: m.modifier_name,
        price: m.modifier_price,
        group_name: m.group_name
      })),
      modifiers_total: modifiersTotal,
      discount_amount: 0,
      total_price: totalPrice,
      destination: product.default_destination || 'kitchen',
      status: 'pending',
      productData: product
    };

    setCartItems([...cartItems, newItem]);
  };

  const handleModifiersConfirm = (modifiers: SelectedModifier[], modifiersCost: number) => {
    if (selectedProductForModifiers) {
      addProductToCart(selectedProductForModifiers, modifiers);
    }
    setShowModifiersModal(false);
    setSelectedProductForModifiers(null);
  };

  const updateItemQuantity = (tempId: string, delta: number) => {
    setCartItems(items =>
      items.map(item => {
        if (item.tempId === tempId) {
          const newQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            total_price: item.unit_price * newQty
          };
        }
        return item;
      })
    );
  };

  const removeItem = (tempId: string) => {
    setCartItems(items => items.filter(item => item.tempId !== tempId));
  };

  const changeItemDestination = (tempId: string, destination: Destination) => {
    setCartItems(items =>
      items.map(item =>
        item.tempId === tempId ? { ...item, destination } : item
      )
    );
  };

  // ==================== ORDER OPERATIONS ====================

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total_price, 0);
    const tax = subtotal * 0.19; // 19% IVA Chile
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) return;

    setLoading(true);
    try {
      let orderId = currentOrder?.id;

      // Crear orden si no existe
      if (!orderId && selectedTable) {
        const newOrder = await posService.createOrder({
          table_id: selectedTable.id,
          order_type: 'dine_in',
          customer_count: selectedTable.guests || 2
        });
        orderId = newOrder.id;
        setCurrentOrder(newOrder);
      }

      if (!orderId) {
        throw new Error('No se pudo crear el pedido');
      }

      // Agregar items pendientes
      const pendingItems = cartItems.filter(item => item.status === 'pending' && !item.id);
      for (const item of pendingItems) {
        await posService.addItemToOrder(orderId, {
          product_id: item.product_id,
          quantity: item.quantity,
          modifiers: item.modifiers.map(m => m.id),
          notes: item.notes,
          destination: item.destination
        });
      }

      // Enviar a cocina
      const result = await posService.sendToKitchen(orderId);

      // Actualizar estado local
      setCartItems(items =>
        items.map(item => ({ ...item, status: 'sent' as const }))
      );

      setError(null);
      alert(`Comanda #${result.comanda_number} enviada. ${result.items_sent} items enviados.`);
    } catch (err: any) {
      setError(err.message || 'Error enviando a cocina');
    } finally {
      setLoading(false);
    }
  };

  // ==================== PAYMENT ====================

  const handlePaymentClick = () => {
    if (cartItems.length === 0) return;
    setShowTipModal(true);
  };

  const handleTipConfirm = (amount: number, percentage: number | null) => {
    setTipAmount(amount);
    setShowTipModal(false);
    setShowPaymentModal(true);
  };

  const handlePayment = async (method: string) => {
    if (!currentOrder?.id) {
      setError('No hay pedido activo');
      return;
    }

    setLoading(true);
    setShowPaymentModal(false);

    try {
      const { total } = calculateTotals();
      const result = await posService.processPayment(currentOrder.id, {
        amount: total + tipAmount,
        payment_method: method,
        tip_amount: tipAmount
      });

      alert(`Venta completada. Total: ${posService.formatCurrency(total + tipAmount)}`);

      // Limpiar estado
      setCurrentOrder(null);
      setCartItems([]);
      setSelectedTable(null);
      setTipAmount(0);

      // Recargar tablas
      loadInitialData();
    } catch (err: any) {
      setError(err.message || 'Error procesando pago');
    } finally {
      setLoading(false);
    }
  };

  const handleMixedPayment = () => {
    setShowPaymentModal(false);
    setShowMixedPaymentModal(true);
  };

  // ==================== RENDER ====================

  const { subtotal, tax, total } = calculateTotals();
  const pendingItems = cartItems.filter(item => item.status === 'pending');
  const hasPendingItems = pendingItems.length > 0;

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pos/mapa')}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            title="Mapa de Mesas"
          >
            <Home className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" />
              SYSME POS
            </h1>
            <p className="text-xs text-blue-200">{user?.assigned_tpv || 'Terminal Principal'}</p>
          </div>
        </div>

        {/* Mesa actual */}
        <div className="flex items-center gap-4">
          {selectedTable ? (
            <div className="bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-3">
              <div className="text-center">
                <p className="text-xs text-blue-200">Mesa</p>
                <p className="font-bold text-xl">{selectedTable.table_number}</p>
              </div>
              {selectedTable.tarifa_name && (
                <div className="text-xs text-blue-200 border-l border-blue-500 pl-3">
                  <p>{selectedTable.salon_name}</p>
                  <p>{selectedTable.tarifa_name}</p>
                </div>
              )}
              <button
                onClick={() => setShowTableSelector(true)}
                className="p-1 hover:bg-blue-600 rounded"
                title="Cambiar mesa"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTableSelector(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Seleccionar Mesa
            </button>
          )}

          {/* Caja */}
          <div className="flex items-center gap-2 border-l border-blue-500 pl-4">
            {cashSession ? (
              <div className="flex items-center gap-2 text-green-300">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Caja Abierta</span>
              </div>
            ) : (
              <button
                onClick={() => setShowOpenCashModal(true)}
                className="text-yellow-300 flex items-center gap-1 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                Abrir Caja
              </button>
            )}
          </div>

          {/* Usuario */}
          <div className="flex items-center gap-3 border-l border-blue-500 pl-4">
            <div className="text-right">
              <p className="font-medium text-sm">{user?.username}</p>
              <p className="text-xs text-blue-200">{user?.role}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/pos/login'); }}
              className="p-2 hover:bg-red-600 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo - Categorías */}
        <div className="w-24 bg-gray-800 flex flex-col overflow-y-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`p-3 text-center border-b border-gray-700 transition-colors ${
              !selectedCategory ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="text-2xl mb-1">🍽️</div>
            <div className="text-xs">Todos</div>
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-3 text-center border-b border-gray-700 transition-colors ${
                selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
              style={selectedCategory === cat.id ? {} : { borderLeftColor: cat.color, borderLeftWidth: 4 }}
            >
              <div className="text-2xl mb-1">{cat.icon || '📦'}</div>
              <div className="text-xs truncate">{cat.name}</div>
            </button>
          ))}
        </div>

        {/* Panel Central - Productos */}
        <div className="flex-1 flex flex-col bg-gray-850">
          {/* Barra de búsqueda */}
          <div className="p-3 bg-gray-800 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar producto o código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Grid de productos */}
          <div className="flex-1 p-3 overflow-y-auto">
            <div className="grid grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  disabled={!product.is_available}
                  className={`bg-gray-800 rounded-lg p-3 text-left border-2 transition-all hover:scale-105 ${
                    product.is_available
                      ? 'border-gray-700 hover:border-blue-500 hover:bg-gray-750'
                      : 'border-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Imagen o placeholder */}
                  <div className="aspect-square bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <UtensilsCrossed className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                  <h3 className="font-medium text-white text-sm truncate">{product.name}</h3>
                  <p className="text-blue-400 font-bold">{posService.formatCurrency(product.price)}</p>
                  {product.has_modifiers && (
                    <div className="mt-1 flex items-center text-xs text-purple-400">
                      <Settings className="w-3 h-3 mr-1" />
                      Personalizable
                    </div>
                  )}
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Search className="w-12 h-12 mb-4 opacity-50" />
                <p>No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho - Carrito */}
        <div className="w-96 bg-gray-800 flex flex-col border-l border-gray-700">
          {/* Header del carrito */}
          <div className="p-4 bg-gray-750 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Pedido Actual
              </h2>
              <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm">
                {cartItems.length} items
              </span>
            </div>
          </div>

          {/* Lista de items */}
          <div className="flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
                <Coffee className="w-12 h-12 mb-4 opacity-50" />
                <p>Carrito vacío</p>
                <p className="text-sm mt-2">Agrega productos para comenzar</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {cartItems.map((item) => (
                  <div key={item.tempId} className="p-3 hover:bg-gray-750">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm">{item.product_name}</h4>
                        <p className="text-xs text-gray-400">{posService.formatCurrency(item.unit_price)} c/u</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.tempId)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Modificadores */}
                    {item.modifiers.length > 0 && (
                      <div className="mb-2 pl-2 border-l-2 border-purple-500">
                        {item.modifiers.map((mod, idx) => (
                          <div key={idx} className="text-xs text-purple-400 flex justify-between">
                            <span>{mod.name}</span>
                            {mod.price !== 0 && <span>+{posService.formatCurrency(mod.price)}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Destino */}
                    <div className="mb-2">
                      <select
                        value={item.destination}
                        onChange={(e) => changeItemDestination(item.tempId, e.target.value as Destination)}
                        className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                        disabled={item.status !== 'pending'}
                      >
                        <option value="kitchen">Cocina</option>
                        <option value="bar">Barra</option>
                        <option value="kitchen_1">Cocina 1</option>
                        <option value="kitchen_2">Cocina 2</option>
                        <option value="kitchen_3">Cocina 3</option>
                        <option value="kitchen_4">Cocina 4</option>
                      </select>
                    </div>

                    {/* Cantidad y total */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateItemQuantity(item.tempId, -1)}
                          className="w-7 h-7 bg-red-600 hover:bg-red-700 text-white rounded flex items-center justify-center"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.tempId, 1)}
                          className="w-7 h-7 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{posService.formatCurrency(item.total_price)}</p>
                        {item.status !== 'pending' && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white">
                            {item.status === 'sent' ? 'Enviado' : 'Preparando'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="p-4 bg-gray-750 border-t border-gray-700 space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal:</span>
              <span>{posService.formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>IVA (19%):</span>
              <span>{posService.formatCurrency(tax)}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Propina:</span>
                <span>{posService.formatCurrency(tipAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-gray-600">
              <span>TOTAL:</span>
              <span>{posService.formatCurrency(total + tipAmount)}</span>
            </div>
          </div>

          {/* Acciones */}
          <div className="p-4 bg-gray-800 border-t border-gray-700 space-y-2">
            {/* Enviar a Cocina */}
            {hasPendingItems && (
              <button
                onClick={handleSendToKitchen}
                disabled={loading || cartItems.length === 0}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ChefHat className="w-5 h-5" />
                Enviar a Cocina ({pendingItems.length})
              </button>
            )}

            {/* Pagar */}
            <button
              onClick={handlePaymentClick}
              disabled={loading || cartItems.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CreditCard className="w-5 h-5" />
              PAGAR
            </button>

            {/* Acciones secundarias */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShowTransferModal(true)}
                disabled={!currentOrder?.id}
                className="bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm flex flex-col items-center disabled:opacity-50"
              >
                <ArrowRightLeft className="w-4 h-4 mb-1" />
                Transferir
              </button>
              <button
                disabled={!currentOrder?.id}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm flex flex-col items-center disabled:opacity-50"
              >
                <SplitSquareVertical className="w-4 h-4 mb-1" />
                Dividir
              </button>
              <button
                onClick={() => { setCartItems([]); setCurrentOrder(null); }}
                className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm flex flex-col items-center"
              >
                <X className="w-4 h-4 mb-1" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modal Selector de Mesas */}
      {showTableSelector && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Seleccionar Mesa</h3>
              <button onClick={() => setShowTableSelector(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {availableTables.filter(t => t.status === 'free').map(table => (
                  <button
                    key={table.id}
                    onClick={() => handleTableSelect(table)}
                    className="aspect-square bg-green-600 hover:bg-green-700 rounded-lg p-2 flex flex-col items-center justify-center text-white transition-transform hover:scale-105"
                  >
                    <span className="text-2xl font-bold">{table.table_number}</span>
                    <span className="text-xs opacity-75">{table.salon_name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Método de Pago</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 bg-blue-900/30 border-b border-gray-700">
              <div className="text-center">
                <p className="text-gray-400 text-sm">Total a Pagar</p>
                <p className="text-3xl font-bold text-white">{posService.formatCurrency(total + tipAmount)}</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => handlePayment('cash')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-3"
              >
                <Banknote className="w-6 h-6" />
                Efectivo
              </button>
              <button
                onClick={() => handlePayment('card')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-3"
              >
                <CreditCard className="w-6 h-6" />
                Tarjeta
              </button>
              <button
                onClick={() => handlePayment('transfer')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-3"
              >
                <Wallet className="w-6 h-6" />
                Transferencia
              </button>
              <button
                onClick={handleMixedPayment}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-lg font-bold flex items-center justify-center gap-3"
              >
                <SplitSquareVertical className="w-6 h-6" />
                Pago Mixto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales existentes */}
      {showModifiersModal && selectedProductForModifiers && (
        <ProductModifiersSelectionModal
          productId={selectedProductForModifiers.id}
          productName={selectedProductForModifiers.name}
          productPrice={selectedProductForModifiers.price * (selectedTable?.tarifa_multiplier || 1)}
          isOpen={showModifiersModal}
          onClose={() => { setShowModifiersModal(false); setSelectedProductForModifiers(null); }}
          onConfirm={handleModifiersConfirm}
        />
      )}

      {showTipModal && (
        <TipSelectionModal
          isOpen={showTipModal}
          saleTotal={total}
          onClose={() => setShowTipModal(false)}
          onConfirm={handleTipConfirm}
        />
      )}

      {showMixedPaymentModal && (
        <MixedPaymentModal
          isOpen={showMixedPaymentModal}
          total={total + tipAmount}
          onClose={() => setShowMixedPaymentModal(false)}
          onConfirm={(details) => {
            setShowMixedPaymentModal(false);
            // Procesar pago mixto
          }}
        />
      )}

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

export default POSModerno;
