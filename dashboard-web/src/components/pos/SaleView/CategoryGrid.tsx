/**
 * CategoryGrid Component
 * Touch-friendly category selector
 * Replicates MISTURA categorias.php functionality
 */

import React, { useEffect, useState } from 'react';
import { Category } from '../../../types/pos';

interface CategoryGridProps {
  onCategorySelect: (category: Category) => void;
  selectedCategoryId?: number;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  onCategorySelect,
  selectedCategoryId,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/products/categories');
        const data = await response.json();

        if (data.success) {
          setCategories(data.data);
        } else {
          throw new Error(data.error || 'Error al cargar categorías');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4">
      {categories.map((category) => {
        const isSelected = selectedCategoryId === category.id_categoria;

        return (
          <button
            key={category.id_categoria}
            onClick={() => onCategorySelect(category)}
            className={`
              relative aspect-square rounded-xl shadow-lg transition-all duration-200
              active:scale-95 flex flex-col items-center justify-center p-4
              ${
                isSelected
                  ? 'bg-blue-600 text-white ring-4 ring-blue-300'
                  : 'bg-gradient-to-br from-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 text-gray-800'
              }
            `}
          >
            {/* Category Image */}
            {category.imagen ? (
              <div className="w-16 h-16 mb-2 rounded-lg overflow-hidden bg-white">
                <img
                  src={`/api/images/categories/${category.imagen}`}
                  alt={category.des_categoria}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder on error
                    e.currentTarget.src = '/images/no-image-cat.jpg';
                  }}
                />
              </div>
            ) : (
              <div className="w-16 h-16 mb-2 rounded-lg bg-white flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
            )}

            {/* Category Name */}
            <div className="text-center text-sm font-semibold line-clamp-2">
              {category.des_categoria}
            </div>

            {/* Selected Indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        );
      })}

      {categories.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="font-semibold">No hay categorías disponibles</p>
        </div>
      )}
    </div>
  );
};
