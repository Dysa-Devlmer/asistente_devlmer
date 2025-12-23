/**
 * Sale Store (Zustand)
 * Global state for current sale and cart
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Sale, SaleLine, CartItem } from '../types/pos';

interface SaleState {
  // Current sale
  currentSale: Sale | null;
  isLoading: boolean;
  error: string | null;

  // Cart (temporary items before saving)
  cartItems: CartItem[];

  // Actions
  setSale: (sale: Sale | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Cart actions
  addToCart: (item: CartItem) => void;
  updateCartItem: (temp_id: string, updates: Partial<CartItem>) => void;
  removeFromCart: (temp_id: string) => void;
  clearCart: () => void;

  // Sale actions
  updateSale: (updates: Partial<Sale>) => void;
  addSaleLine: (line: SaleLine) => void;
  updateSaleLine: (id_linea: number, updates: Partial<SaleLine>) => void;
  removeSaleLine: (id_linea: number) => void;

  // Computed
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  getSaleTotal: () => number;
  getSaleItemsCount: () => number;
}

export const useSaleStore = create<SaleState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentSale: null,
      isLoading: false,
      error: null,
      cartItems: [],

      // Basic setters
      setSale: (sale) => set({ currentSale: sale, error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error, isLoading: false }),

      // Cart actions
      addToCart: (item) =>
        set((state) => ({
          cartItems: [...state.cartItems, { ...item, temp_id: item.temp_id || crypto.randomUUID(), is_new: true }],
        })),

      updateCartItem: (temp_id, updates) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.temp_id === temp_id ? { ...item, ...updates, is_modified: true } : item
          ),
        })),

      removeFromCart: (temp_id) =>
        set((state) => ({
          cartItems: state.cartItems.filter((item) => item.temp_id !== temp_id),
        })),

      clearCart: () => set({ cartItems: [] }),

      // Sale actions
      updateSale: (updates) =>
        set((state) => ({
          currentSale: state.currentSale ? { ...state.currentSale, ...updates } : null,
        })),

      addSaleLine: (line) =>
        set((state) => ({
          currentSale: state.currentSale
            ? {
                ...state.currentSale,
                lineas: [...(state.currentSale.lineas || []), line],
                num_items: (state.currentSale.num_items || 0) + 1,
              }
            : null,
        })),

      updateSaleLine: (id_linea, updates) =>
        set((state) => ({
          currentSale: state.currentSale
            ? {
                ...state.currentSale,
                lineas: (state.currentSale.lineas || []).map((line) =>
                  line.id_linea === id_linea ? { ...line, ...updates } : line
                ),
              }
            : null,
        })),

      removeSaleLine: (id_linea) =>
        set((state) => ({
          currentSale: state.currentSale
            ? {
                ...state.currentSale,
                lineas: (state.currentSale.lineas || []).filter((line) => line.id_linea !== id_linea),
                num_items: Math.max(0, (state.currentSale.num_items || 0) - 1),
              }
            : null,
        })),

      // Computed getters
      getCartTotal: () => {
        const { cartItems } = get();
        return cartItems.reduce((sum, item) => sum + (item.total || 0), 0);
      },

      getCartItemsCount: () => {
        const { cartItems } = get();
        return cartItems.reduce((sum, item) => sum + (item.cantidad || 0), 0);
      },

      getSaleTotal: () => {
        const { currentSale } = get();
        return currentSale?.total_iva || 0;
      },

      getSaleItemsCount: () => {
        const { currentSale } = get();
        return currentSale?.num_items || 0;
      },
    }),
    { name: 'sale-store' }
  )
);
