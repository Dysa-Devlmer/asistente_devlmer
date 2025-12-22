/**
 * Auth Store (Zustand)
 * Global state for employee session
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { EmployeeSession } from '../types/pos';

interface AuthState {
  // Session
  session: EmployeeSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSession: (session: EmployeeSession | null) => void;
  login: (id_camarero: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Getters
  getEmployeeName: () => string;
  getCashRegister: () => string;
  getWarehouse: () => string;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        setSession: (session) =>
          set({
            session,
            isAuthenticated: !!session,
            error: null,
          }),

        login: async (id_camarero, password) => {
          set({ isLoading: true, error: null });

          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/pos/employees/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_camarero, password }),
            });

            if (!response.ok) {
              throw new Error('Credenciales inválidas');
            }

            const data = await response.json();

            if (data.success) {
              const session: EmployeeSession = {
                id_camarero: data.data.id_camarero,
                nombre: data.data.nombre,
                id_caja: data.data.id_caja,
                id_almacen: data.data.id_almacen,
                almacen: data.data.almacen,
                tpv: data.data.tpv,
                idioma: data.data.idioma || 'es',
                moneda: data.data.moneda || '$',
              };

              set({
                session,
                isAuthenticated: true,
                isLoading: false,
                error: null,
              });
            } else {
              throw new Error(data.error || 'Error al iniciar sesión');
            }
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Error desconocido',
            });
            throw error;
          }
        },

        logout: () =>
          set({
            session: null,
            isAuthenticated: false,
            error: null,
          }),

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error, isLoading: false }),

        // Getters
        getEmployeeName: () => get().session?.nombre || 'Usuario',
        getCashRegister: () => get().session?.tpv || 'N/A',
        getWarehouse: () => get().session?.almacen || 'N/A',
      }),
      {
        name: 'auth-storage', // localStorage key
        partialize: (state) => ({
          // Only persist session
          session: state.session,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'auth-store' }
  )
);
