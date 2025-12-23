/**
 * TableMap Component
 * Visual table map for restaurant POS
 * Replicates MISTURA mapa-mesas.php functionality
 */

import React, { useEffect, useState, useRef } from 'react';
import { Table } from '../../../types/pos';
import { TableButton } from './TableButton';

interface TableMapProps {
  id_salon?: string;
  onTableClick: (table: Table) => void;
  onNewSale: (mesa: string) => void;
  anchotpv?: number;  // Base width for scaling (from config)
  altotpv?: number;   // Base height for scaling (from config)
}

export const TableMap: React.FC<TableMapProps> = ({
  id_salon,
  onTableClick,
  onNewSale,
  anchotpv = 980,
  altotpv = 700
}) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Fetch tables from API
  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        const query = id_salon ? `?id_salon=${id_salon}` : '';
        const response = await fetch(`/api/pos/tables${query}`);

        if (!response.ok) {
          throw new Error('Error al cargar mesas');
        }

        const data = await response.json();

        if (data.success) {
          setTables(data.data);
        } else {
          throw new Error(data.error || 'Error desconocido');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar mesas');
      } finally {
        setLoading(false);
      }
    };

    fetchTables();

    // Refresh every 10 seconds
    const interval = setInterval(fetchTables, 10000);

    return () => clearInterval(interval);
  }, [id_salon]);

  // Calculate scale factor based on container size
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const newScale = containerWidth / anchotpv;
        setScaleFactor(newScale);
      }
    };

    updateScale();

    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [anchotpv]);

  const handleTableClick = (table: Table) => {
    if (table.venta_activa?.id_venta) {
      // Table has active sale, open it
      onTableClick(table);
    } else {
      // Table is free, create new sale
      onNewSale(table.Num_Mesa);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando mapa de mesas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-100 overflow-auto"
      style={{
        minHeight: `${altotpv * scaleFactor}px`
      }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-blue-600 text-white p-4 shadow-md">
        <h2 className="text-xl font-bold">Mapa de Mesas</h2>
        <p className="text-sm opacity-90">
          {tables.filter(t => t.estado === 'ocupada').length} / {tables.length} mesas ocupadas
        </p>
      </div>

      {/* Table Map */}
      <div
        className="relative"
        style={{
          width: `${anchotpv * scaleFactor}px`,
          height: `${altotpv * scaleFactor}px`,
          margin: '0 auto'
        }}
      >
        {tables.map((table) => (
          <TableButton
            key={table.Num_Mesa}
            table={table}
            onClick={() => handleTableClick(table)}
            scaleFactor={scaleFactor}
          />
        ))}
      </div>

      {/* Stats Footer */}
      <div className="sticky bottom-0 bg-white border-t p-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {tables.filter(t => t.estado === 'libre').length}
          </div>
          <div className="text-xs text-gray-600">Libres</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {tables.filter(t => t.estado === 'ocupada').length}
          </div>
          <div className="text-xs text-gray-600">Ocupadas</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {tables.filter(t => t.estado === 'reservada').length}
          </div>
          <div className="text-xs text-gray-600">Reservadas</div>
        </div>
      </div>
    </div>
  );
};
