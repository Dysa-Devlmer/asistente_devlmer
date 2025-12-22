/**
 * SaleView Component
 * Main sale interface combining categories, products, and cart
 * Replicates MISTURA venta.php functionality
 */

import React, { useState, useEffect } from 'react';
import { Category, Product } from '../../../types/pos';
import { useSale } from '../../../hooks/pos/useSale';
import { CategoryGrid } from './CategoryGrid';
import { ProductGrid } from './ProductGrid';
import { CartPanel } from './CartPanel';

interface SaleViewProps {
  onClose?: () => void;
  onCheckout?: () => void;
}

export const SaleView: React.FC<SaleViewProps> = ({ onClose, onCheckout }) => {
  const {
    currentSale,
    isLoading,
    error,
    cartItems,
    addProductToCart,
    saveCartItem,
    updateCartItem,
    removeFromCart,
    updateLine,
    deleteLine,
    cartTotal,
    cartItemsCount,
    saleTotal,
    saleItemsCount,
  } = useSale();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Calculate totals
  const allLines = [
    ...(currentSale?.lineas || []),
    ...cartItems,
  ];

  const subtotal = currentSale?.subtotal || 0 + cartTotal;
  const totalIva = (currentSale?.total_iva || 0) + cartTotal;
  const total = totalIva;

  const totalItems = saleItemsCount + cartItemsCount;

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
  };

  const handleProductSelect = (product: Product, cantidad: number, observaciones?: string) => {
    // Add to cart (temporary)
    addProductToCart(
      product.id_complementog,
      cantidad,
      observaciones,
      product.pvp / (1 + (product.avgiva / 100)), // precio sin IVA
      product.pvp * cantidad // total con IVA
    );
  };

  const handleSaveCart = async () => {
    try {
      // Save all cart items to sale
      for (const item of cartItems) {
        if (item.temp_id) {
          await saveCartItem(item.temp_id);
        }
      }
    } catch (err) {
      console.error('Error saving cart:', err);
    }
  };

  const handleUpdateLine = async (id_linea: number, cantidad: number) => {
    try {
      await updateLine(id_linea, { cantidad });
    } catch (err) {
      console.error('Error updating line:', err);
    }
  };

  const handleDeleteLine = async (id_linea: number) => {
    try {
      await deleteLine(id_linea);
    } catch (err) {
      console.error('Error deleting line:', err);
    }
  };

  const handleUpdateCartItem = (temp_id: string, cantidad: number) => {
    const item = cartItems.find(i => i.temp_id === temp_id);
    if (item) {
      const newTotal = item.precio * cantidad * (1 + (item.avgiva / 100));
      updateCartItem(temp_id, { cantidad, total: newTotal });
    }
  };

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      setShowCheckout(true);
    }
  };

  if (!currentSale) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-xl font-semibold">No hay venta activa</p>
          <p className="text-sm">Selecciona una mesa para comenzar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Mesa {currentSale.Num_Mesa}</h2>
            <p className="text-sm opacity-90">
              {currentSale.mesa?.descripcion} • {currentSale.tarifa}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">${total.toFixed(2)}</div>
            <div className="text-sm opacity-90">{totalItems} items</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors active:scale-95"
            >
              <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-xs">Volver</span>
            </button>
          )}

          {cartItems.length > 0 && (
            <button
              onClick={handleSaveCart}
              disabled={isLoading}
              className="py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors active:scale-95 disabled:opacity-50"
            >
              <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className="text-xs">Guardar</span>
            </button>
          )}

          <button
            onClick={handleCheckout}
            disabled={totalItems === 0 || isLoading}
            className="py-2 px-4 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-semibold transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs">Pagar</span>
          </button>

          <button
            className="py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors active:scale-95"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-xs">Opciones</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Products Selection */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb */}
          {selectedCategory && (
            <div className="bg-white border-b p-3 flex items-center space-x-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-semibold"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Categorías</span>
              </button>
              <span className="text-gray-400">/</span>
              <span className="font-semibold text-gray-800">{selectedCategory.des_categoria}</span>
            </div>
          )}

          {/* Categories or Products */}
          <div className="flex-1 overflow-y-auto bg-white">
            {!selectedCategory ? (
              <CategoryGrid
                onCategorySelect={handleCategorySelect}
                selectedCategoryId={selectedCategory?.id_categoria}
              />
            ) : (
              <ProductGrid
                categoryId={selectedCategory.id_categoria}
                onProductSelect={handleProductSelect}
              />
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          <div className="bg-gray-800 text-white p-3">
            <h3 className="font-bold text-lg">Pedido</h3>
            <p className="text-sm opacity-75">{totalItems} productos</p>
          </div>

          <CartPanel
            lines={allLines}
            subtotal={subtotal}
            totalIva={totalIva}
            total={total}
            onUpdateLine={handleUpdateLine}
            onDeleteLine={handleDeleteLine}
            onUpdateCartItem={handleUpdateCartItem}
            onDeleteCartItem={removeFromCart}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="absolute bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};
