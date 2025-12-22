/**
 * CheckoutModal Component
 * Payment processing and sale finalization
 * Replicates MISTURA finaliza_venta.php functionality
 */

import React, { useState } from 'react';
import { useSale } from '../../../hooks/pos/useSale';

interface CheckoutModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, onSuccess }) => {
  const { currentSale, finalize, isOperating } = useSale();

  const [formaPago, setFormaPago] = useState<'efectivo' | 'tarjeta' | 'mixto'>('efectivo');
  const [importePagado, setImportePagado] = useState<string>('');
  const [importeEfectivo, setImporteEfectivo] = useState<string>('');
  const [importeTarjeta, setImporteTarjeta] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const total = currentSale?.total_iva || 0;
  const cambio =
    formaPago === 'mixto'
      ? Math.max(0, parseFloat(importeEfectivo || '0') + parseFloat(importeTarjeta || '0') - total)
      : Math.max(0, parseFloat(importePagado || '0') - total);

  const handleKeypadClick = (value: string) => {
    const currentInput = formaPago === 'mixto' ? importeEfectivo : importePagado;
    const setCurrentInput = formaPago === 'mixto' ? setImporteEfectivo : setImportePagado;

    if (value === 'C') {
      setCurrentInput('');
    } else if (value === '.') {
      if (!currentInput.includes('.')) {
        setCurrentInput(currentInput + '.');
      }
    } else if (value === '←') {
      setCurrentInput(currentInput.slice(0, -1));
    } else {
      setCurrentInput(currentInput + value);
    }
  };

  const handleExactAmount = () => {
    if (formaPago === 'efectivo') {
      setImportePagado(total.toString());
    } else if (formaPago === 'tarjeta') {
      setImportePagado(total.toString());
    }
  };

  const handleFinalize = async () => {
    setError(null);

    const importe = formaPago === 'mixto'
      ? parseFloat(importeEfectivo || '0') + parseFloat(importeTarjeta || '0')
      : parseFloat(importePagado || '0');

    if (importe < total) {
      setError('El importe pagado es insuficiente');
      return;
    }

    try {
      await finalize({
        forma_pago: formaPago,
        importe_pagado: importe,
        importe_efectivo: formaPago === 'mixto' ? parseFloat(importeEfectivo || '0') : undefined,
        importe_tarjeta: formaPago === 'mixto' ? parseFloat(importeTarjeta || '0') : undefined,
      });

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar venta');
    }
  };

  if (!currentSale) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Finalizar Venta</h2>
              <p className="text-sm opacity-90">Mesa {currentSale.Num_Mesa}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Total */}
          <div className="mt-6 text-center">
            <div className="text-sm opacity-90">TOTAL A PAGAR</div>
            <div className="text-5xl font-bold mt-2">${total.toFixed(2)}</div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Forma de Pago</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setFormaPago('efectivo')}
                className={`
                  py-4 px-4 rounded-lg font-semibold transition-all
                  ${formaPago === 'efectivo'
                    ? 'bg-green-600 text-white ring-4 ring-green-300'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                `}
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Efectivo
              </button>

              <button
                onClick={() => setFormaPago('tarjeta')}
                className={`
                  py-4 px-4 rounded-lg font-semibold transition-all
                  ${formaPago === 'tarjeta'
                    ? 'bg-blue-600 text-white ring-4 ring-blue-300'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                `}
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Tarjeta
              </button>

              <button
                onClick={() => setFormaPago('mixto')}
                className={`
                  py-4 px-4 rounded-lg font-semibold transition-all
                  ${formaPago === 'mixto'
                    ? 'bg-purple-600 text-white ring-4 ring-purple-300'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                `}
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mixto
              </button>
            </div>
          </div>

          {/* Amount Input */}
          {formaPago !== 'mixto' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Importe Pagado
              </label>
              <div className="text-5xl font-bold text-center py-6 bg-gray-100 rounded-lg">
                ${importePagado || '0.00'}
              </div>
            </div>
          ) : (
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Efectivo</label>
                <div className="text-3xl font-bold text-center py-4 bg-green-50 rounded-lg border-2 border-green-300">
                  ${importeEfectivo || '0.00'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarjeta</label>
                <div className="text-3xl font-bold text-center py-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  ${importeTarjeta || '0.00'}
                </div>
              </div>
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {['7', '8', '9', '←', '4', '5', '6', 'C', '1', '2', '3', '.', '0', '00', 'Exacto'].map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (key === 'Exacto') {
                    handleExactAmount();
                  } else {
                    handleKeypadClick(key);
                  }
                }}
                disabled={key === 'Exacto' && formaPago === 'mixto'}
                className={`
                  py-4 rounded-lg font-semibold text-lg transition-colors
                  ${key === 'C' ? 'bg-red-500 text-white hover:bg-red-600' :
                    key === '←' ? 'bg-orange-500 text-white hover:bg-orange-600' :
                    key === 'Exacto' ? 'bg-green-500 text-white hover:bg-green-600 col-span-2 disabled:opacity-50 disabled:cursor-not-allowed' :
                    'bg-gray-200 hover:bg-gray-300 text-gray-800'}
                  active:scale-95
                `}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Cambio */}
          <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Cambio:</span>
              <span className="text-3xl font-bold text-yellow-600">
                ${cambio.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-center space-x-2 text-red-700">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 rounded-b-xl grid grid-cols-2 gap-4">
          <button
            onClick={onClose}
            disabled={isOperating}
            className="py-4 px-6 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 active:scale-95 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleFinalize}
            disabled={isOperating || (formaPago !== 'mixto' && !importePagado)}
            className="py-4 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isOperating ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Finalizar Venta</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
