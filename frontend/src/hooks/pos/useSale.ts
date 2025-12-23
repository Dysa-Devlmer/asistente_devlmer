/**
 * useSale Hook
 * Custom hook for sale operations
 */

import { useState, useCallback } from 'react';
import { useSaleStore } from '../../store/saleStore';
import { useAuthStore } from '../../store/authStore';
import * as salesApi from '../../services/api/salesApi';
import { AddSaleLineRequest, UpdateSaleLineRequest, FinalizeSaleRequest } from '../../types/pos';

export function useSale() {
  const [isOperating, setIsOperating] = useState(false);

  const {
    currentSale,
    isLoading,
    error,
    cartItems,
    setSale,
    setLoading,
    setError,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    addSaleLine,
    updateSaleLine,
    removeSaleLine,
    getCartTotal,
    getCartItemsCount,
    getSaleTotal,
    getSaleItemsCount,
  } = useSaleStore();

  const { session } = useAuthStore();

  /**
   * Create new sale for table
   */
  const createSale = useCallback(
    async (Num_Mesa: string, observaciones?: string) => {
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      setLoading(true);
      setError(null);

      try {
        const result = await salesApi.createSale({
          Num_Mesa,
          id_camarero: session.id_camarero,
          id_caja: session.id_caja,
          observaciones,
        });

        setSale(result.venta);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al crear venta';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [session, setSale, setLoading, setError]
  );

  /**
   * Load sale by ID
   */
  const loadSale = useCallback(
    async (id_venta: number) => {
      setLoading(true);
      setError(null);

      try {
        const sale = await salesApi.getSale(id_venta);
        setSale(sale);
        return sale;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al cargar venta';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setSale, setLoading, setError]
  );

  /**
   * Add product to cart (not yet saved)
   */
  const addProductToCart = useCallback(
    (id_complementog: string, cantidad: number, observaciones?: string, precio?: number, total?: number) => {
      addToCart({
        id_linea: 0, // Temp
        id_venta: currentSale?.id_venta || 0,
        id_complementog,
        cantidad,
        precio: precio || 0,
        total: total || 0,
        avgiva: 0,
        servido: 'N',
        observaciones,
        temp_id: crypto.randomUUID(),
        is_new: true,
      });
    },
    [addToCart, currentSale]
  );

  /**
   * Save cart item to sale (POST to API)
   */
  const saveCartItem = useCallback(
    async (temp_id: string) => {
      if (!currentSale) {
        throw new Error('No hay venta activa');
      }

      const item = cartItems.find((i) => i.temp_id === temp_id);
      if (!item) {
        throw new Error('Item no encontrado en carrito');
      }

      setIsOperating(true);
      try {
        const params: AddSaleLineRequest = {
          id_complementog: item.id_complementog,
          cantidad: item.cantidad,
          observaciones: item.observaciones,
        };

        const result = await salesApi.addSaleLine(currentSale.id_venta, params);

        // Update sale with new line
        setSale(result.venta);

        // Remove from cart
        removeFromCart(temp_id);

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al guardar producto';
        setError(errorMsg);
        throw err;
      } finally {
        setIsOperating(false);
      }
    },
    [currentSale, cartItems, removeFromCart, setSale, setError]
  );

  /**
   * Save all cart items
   */
  const saveAllCartItems = useCallback(async () => {
    if (cartItems.length === 0) return;

    setIsOperating(true);
    try {
      for (const item of cartItems) {
        if (item.temp_id) {
          await saveCartItem(item.temp_id);
        }
      }
    } finally {
      setIsOperating(false);
    }
  }, [cartItems, saveCartItem]);

  /**
   * Update existing sale line
   */
  const updateLine = useCallback(
    async (id_linea: number, updates: UpdateSaleLineRequest) => {
      if (!currentSale) {
        throw new Error('No hay venta activa');
      }

      setIsOperating(true);
      try {
        const updatedSale = await salesApi.updateSaleLine(currentSale.id_venta, id_linea, updates);
        setSale(updatedSale);
        return updatedSale;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al actualizar línea';
        setError(errorMsg);
        throw err;
      } finally {
        setIsOperating(false);
      }
    },
    [currentSale, setSale, setError]
  );

  /**
   * Delete sale line
   */
  const deleteLine = useCallback(
    async (id_linea: number) => {
      if (!currentSale) {
        throw new Error('No hay venta activa');
      }

      setIsOperating(true);
      try {
        const updatedSale = await salesApi.deleteSaleLine(currentSale.id_venta, id_linea);
        setSale(updatedSale);
        return updatedSale;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al eliminar línea';
        setError(errorMsg);
        throw err;
      } finally {
        setIsOperating(false);
      }
    },
    [currentSale, setSale, setError]
  );

  /**
   * Change sale table
   */
  const changeTable = useCallback(
    async (nueva_mesa: string) => {
      if (!currentSale) {
        throw new Error('No hay venta activa');
      }

      setIsOperating(true);
      try {
        const updatedSale = await salesApi.changeSaleTable(currentSale.id_venta, { nueva_mesa });
        setSale(updatedSale);
        return updatedSale;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al cambiar mesa';
        setError(errorMsg);
        throw err;
      } finally {
        setIsOperating(false);
      }
    },
    [currentSale, setSale, setError]
  );

  /**
   * Finalize sale
   */
  const finalize = useCallback(
    async (params: FinalizeSaleRequest) => {
      if (!currentSale) {
        throw new Error('No hay venta activa');
      }

      setIsOperating(true);
      try {
        const result = await salesApi.finalizeSale(currentSale.id_venta, params);

        // Clear current sale
        setSale(null);
        clearCart();

        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al finalizar venta';
        setError(errorMsg);
        throw err;
      } finally {
        setIsOperating(false);
      }
    },
    [currentSale, setSale, clearCart, setError]
  );

  /**
   * Park/pause sale
   */
  const park = useCallback(async () => {
    if (!currentSale) {
      throw new Error('No hay venta activa');
    }

    setIsOperating(true);
    try {
      await salesApi.parkSale(currentSale.id_venta);

      // Clear current sale
      setSale(null);
      clearCart();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al aparcar venta';
      setError(errorMsg);
      throw err;
    } finally {
      setIsOperating(false);
    }
  }, [currentSale, setSale, clearCart, setError]);

  /**
   * Cancel sale
   */
  const cancel = useCallback(async () => {
    if (!currentSale) {
      throw new Error('No hay venta activa');
    }

    setIsOperating(true);
    try {
      await salesApi.cancelSale(currentSale.id_venta);

      // Clear current sale
      setSale(null);
      clearCart();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cancelar venta';
      setError(errorMsg);
      throw err;
    } finally {
      setIsOperating(false);
    }
  }, [currentSale, setSale, clearCart, setError]);

  return {
    // State
    currentSale,
    isLoading,
    error,
    isOperating,
    cartItems,

    // Actions
    createSale,
    loadSale,
    addProductToCart,
    saveCartItem,
    saveAllCartItems,
    updateCartItem,
    removeFromCart,
    clearCart,
    updateLine,
    deleteLine,
    changeTable,
    finalize,
    park,
    cancel,

    // Computed
    cartTotal: getCartTotal(),
    cartItemsCount: getCartItemsCount(),
    saleTotal: getSaleTotal(),
    saleItemsCount: getSaleItemsCount(),
  };
}
