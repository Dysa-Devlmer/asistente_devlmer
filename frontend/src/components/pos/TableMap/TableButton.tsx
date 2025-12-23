/**
 * TableButton Component
 * Individual table button for the table map
 * Replicates MISTURA table button styling and behavior
 */

import React from 'react';
import { Table } from '../../../types/pos';

interface TableButtonProps {
  table: Table;
  onClick: () => void;
  scaleFactor: number;
}

export const TableButton: React.FC<TableButtonProps> = ({
  table,
  onClick,
  scaleFactor
}) => {
  const isOccupied = table.estado === 'ocupada' || !!table.venta_activa?.id_venta;
  const isReserved = table.estado === 'reservada';

  // Calculate scaled dimensions and position
  const style: React.CSSProperties = {
    position: 'absolute',
    width: `${table.width * scaleFactor}px`,
    height: `${table.height * scaleFactor}px`,
    top: `${table.top * scaleFactor}px`,
    left: `${table.izq * scaleFactor}px`,
  };

  // Determine button style based on state
  const getButtonClass = () => {
    const baseClass = "w-full h-full rounded-lg border-2 shadow-lg transition-all duration-200 active:scale-95 flex flex-col items-center justify-center font-semibold text-center p-2";

    if (isOccupied) {
      // Mesa ocupada - orange/amber (MISTURA: botonmesa2)
      return `${baseClass} bg-orange-500 hover:bg-orange-600 border-orange-600 text-white animate-pulse`;
    } else if (isReserved) {
      // Mesa reservada - blue
      return `${baseClass} bg-blue-500 hover:bg-blue-600 border-blue-600 text-white`;
    } else {
      // Mesa libre - green (MISTURA: botonmesa)
      return `${baseClass} bg-green-500 hover:bg-green-600 border-green-600 text-white`;
    }
  };

  return (
    <div style={style}>
      <button
        onClick={onClick}
        className={getButtonClass()}
        title={`Mesa ${table.Num_Mesa} - ${table.descripcion}`}
      >
        {/* Table Number */}
        <div className="text-lg sm:text-xl md:text-2xl font-bold">
          {table.Num_Mesa}
        </div>

        {/* Table Description */}
        <div className="text-xs sm:text-sm opacity-90 mt-1 line-clamp-2">
          {table.descripcion}
        </div>

        {/* Sale Info (if occupied) */}
        {isOccupied && table.venta_activa && (
          <div className="mt-2 text-xs bg-white bg-opacity-20 rounded px-2 py-1">
            <div className="font-semibold">
              {table.venta_activa.num_items || 0} items
            </div>
            {table.venta_activa.venta_total !== undefined && (
              <div className="font-bold">
                ${table.venta_activa.venta_total.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Reserved indicator */}
        {isReserved && (
          <div className="mt-2 text-xs">
            <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </button>
    </div>
  );
};
