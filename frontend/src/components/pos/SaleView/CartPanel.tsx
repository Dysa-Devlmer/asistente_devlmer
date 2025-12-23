/**
 * CartPanel Component
 * Display and manage sale lines (cart)
 * Replicates MISTURA lineas_venta.php functionality
 */

import React, { useState } from 'react';
import { SaleLine, CartItem } from '../../../types/pos';

interface CartPanelProps {
  lines: (SaleLine | CartItem)[];
  subtotal: number;
  totalIva: number;
  total: number;
  onUpdateLine?: (id_linea: number, cantidad: number) => void;
  onDeleteLine?: (id_linea: number) => void;
  onUpdateCartItem?: (temp_id: string, cantidad: number) => void;
  onDeleteCartItem?: (temp_id: string) => void;
  isLoading?: boolean;
}

interface LineEditModalProps {
  line: SaleLine | CartItem;
  onConfirm: (cantidad: number) => void;
  onCancel: () => void;
}

const LineEditModal: React.FC<LineEditModalProps> = ({ line, onConfirm, onCancel }) => {
  const [cantidad, setCantidad] = useState(line.cantidad);

  const handleKeypadClick = (value: string) => {
    if (value === 'C') {
      setCantidad(1);
    } else if (value === '+') {
      setCantidad(prev => prev + 1);
    } else if (value === '-') {
      setCantidad(prev => Math.max(1, prev - 1));
    } else {
      const num = parseInt(value, 10);
      setCantidad(prev => parseInt(`${prev}${num}`, 10));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full m-4">
        <div className="bg-blue-600 text-white p-4 rounded-t-xl">
          <h3 className="text-lg font-bold">Modificar Cantidad</h3>
          <p className="text-sm opacity-90 line-clamp-1">
            {line.producto?.des_complementog || 'Producto'}
          </p>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <div className="text-4xl font-bold text-center py-4 bg-gray-100 rounded-lg">
              {cantidad}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '+'].map((key) => (
              <button
                key={key}
                onClick={() => handleKeypadClick(key)}
                className={`
                  py-4 rounded-lg font-semibold text-lg transition-colors
                  ${key === 'C' ? 'bg-red-500 text-white hover:bg-red-600' :
                    key === '+' ? 'bg-green-500 text-white hover:bg-green-600' :
                    'bg-gray-200 hover:bg-gray-300 text-gray-800'}
                  active:scale-95
                `}
              >
                {key}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
              className="py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600"
            >
              - Menos
            </button>
            <button
              onClick={() => setCantidad(prev => prev + 1)}
              className="py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
            >
              + Más
            </button>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-b-xl grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(cantidad)}
            className="py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  );
};

export const CartPanel: React.FC<CartPanelProps> = ({
  lines,
  subtotal,
  totalIva,
  total,
  onUpdateLine,
  onDeleteLine,
  onUpdateCartItem,
  onDeleteCartItem,
  isLoading = false,
}) => {
  const [editingLine, setEditingLine] = useState<SaleLine | CartItem | null>(null);

  const handleEditClick = (line: SaleLine | CartItem) => {
    setEditingLine(line);
  };

  const handleEditConfirm = (cantidad: number) => {
    if (!editingLine) return;

    if ('temp_id' in editingLine && editingLine.temp_id && onUpdateCartItem) {
      onUpdateCartItem(editingLine.temp_id, cantidad);
    } else if ('id_linea' in editingLine && onUpdateLine) {
      onUpdateLine(editingLine.id_linea, cantidad);
    }

    setEditingLine(null);
  };

  const handleDeleteClick = (line: SaleLine | CartItem) => {
    if (confirm('¿Eliminar este producto?')) {
      if ('temp_id' in line && line.temp_id && onDeleteCartItem) {
        onDeleteCartItem(line.temp_id);
      } else if ('id_linea' in line && onDeleteLine) {
        onDeleteLine(line.id_linea);
      }
    }
  };

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <svg className="w-24 h-24 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-xl font-semibold">Carrito vacío</p>
        <p className="text-sm">Selecciona productos para agregar</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Lines List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {lines.map((line, index) => {
            const isCartItem = 'temp_id' in line;
            const isNew = isCartItem && line.is_new;
            const isModified = isCartItem && line.is_modified;

            return (
              <div
                key={isCartItem ? line.temp_id : `line-${line.id_linea}`}
                className={`
                  bg-white rounded-lg shadow-md p-3 transition-all
                  ${isNew ? 'border-2 border-green-400 bg-green-50' :
                    isModified ? 'border-2 border-yellow-400 bg-yellow-50' :
                    'border border-gray-200'}
                `}
              >
                <div className="flex justify-between items-start">
                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {line.producto?.des_complementog || 'Producto'}
                        </div>
                        {line.observaciones && (
                          <div className="text-xs text-gray-600 italic mt-1">
                            {line.observaciones}
                          </div>
                        )}
                        {isNew && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-green-500 text-white rounded-full">
                            Nuevo
                          </span>
                        )}
                        {line.servido === 'S' && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                            Servido
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity and Price */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Quantity Button */}
                        <button
                          onClick={() => handleEditClick(line)}
                          disabled={isLoading}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          <span className="font-semibold">{line.cantidad}</span>
                          <span className="text-xs">x</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>

                        {/* Unit Price */}
                        <div className="text-sm text-gray-600">
                          ${line.precio.toFixed(2)} c/u
                        </div>
                      </div>

                      {/* Line Total */}
                      <div className="text-lg font-bold text-gray-900">
                        ${line.total.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteClick(line)}
                    disabled={isLoading}
                    className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals Footer */}
        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold text-gray-800">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">IVA:</span>
            <span className="font-semibold text-gray-800">${(totalIva - subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t border-gray-300 pt-2">
            <span className="text-gray-900">TOTAL:</span>
            <span className="text-blue-600">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingLine && (
        <LineEditModal
          line={editingLine}
          onConfirm={handleEditConfirm}
          onCancel={() => setEditingLine(null)}
        />
      )}
    </>
  );
};
