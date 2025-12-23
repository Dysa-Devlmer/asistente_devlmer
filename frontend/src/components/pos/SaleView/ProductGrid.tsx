/**
 * ProductGrid Component
 * Touch-friendly product selector with quantity modal
 * Replicates MISTURA productos.php functionality
 */

import React, { useEffect, useState } from 'react';
import { Product } from '../../../types/pos';

interface ProductGridProps {
  categoryId?: number;
  subcategoryId?: number;
  onProductSelect: (product: Product, cantidad: number, observaciones?: string) => void;
}

interface QuantityModalProps {
  product: Product;
  onConfirm: (cantidad: number, observaciones?: string) => void;
  onCancel: () => void;
}

const QuantityModal: React.FC<QuantityModalProps> = ({ product, onConfirm, onCancel }) => {
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState('');

  const handleConfirm = () => {
    if (cantidad > 0) {
      onConfirm(cantidad, observaciones || undefined);
    }
  };

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
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full m-4">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-xl">
          <h3 className="text-lg font-bold line-clamp-2">{product.des_complementog}</h3>
          <p className="text-sm opacity-90">
            ${product.pvp.toFixed(2)} {product.categoria && `• ${product.categoria}`}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Quantity Display */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
            <div className="text-4xl font-bold text-center py-4 bg-gray-100 rounded-lg">
              {cantidad}
            </div>
          </div>

          {/* Numeric Keypad */}
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

          {/* Quick Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
              className="py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 active:scale-95"
            >
              - Menos
            </button>
            <button
              onClick={() => setCantidad(prev => prev + 1)}
              className="py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 active:scale-95"
            >
              + Más
            </button>
          </div>

          {/* Observaciones */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: Sin cebolla, extra queso..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Total */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700">Total:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${(product.pvp * cantidad).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-xl grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-3 px-4 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:scale-95"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

export const ProductGrid: React.FC<ProductGridProps> = ({
  categoryId,
  subcategoryId,
  onProductSelect,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!categoryId) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        params.append('id_categoria', categoryId.toString());
        if (subcategoryId) {
          params.append('id_subcategoria', subcategoryId.toString());
        }

        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();

        if (data.success) {
          setProducts(data.data);
        } else {
          throw new Error(data.error || 'Error al cargar productos');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, subcategoryId]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleQuantityConfirm = (cantidad: number, observaciones?: string) => {
    if (selectedProduct) {
      onProductSelect(selectedProduct, cantidad, observaciones);
      setSelectedProduct(null);
    }
  };

  const handleQuantityCancel = () => {
    setSelectedProduct(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
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

  if (!categoryId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <p className="font-semibold">Selecciona una categoría</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
        {products.map((product) => (
          <button
            key={product.id_complementog}
            onClick={() => handleProductClick(product)}
            className="
              relative bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-md
              hover:from-yellow-100 hover:to-yellow-200 transition-all duration-200
              active:scale-95 p-4 flex flex-col items-center
            "
          >
            {/* Product Image */}
            {product.imagen ? (
              <div className="w-20 h-20 mb-2 rounded-lg overflow-hidden bg-white">
                <img
                  src={`/api/images/products/${product.imagen}`}
                  alt={product.des_complementog}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/no-image.jpg';
                  }}
                />
              </div>
            ) : (
              <div className="w-20 h-20 mb-2 rounded-lg bg-white flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Product Name */}
            <div className="text-sm font-semibold text-gray-800 text-center line-clamp-2 mb-2">
              {product.des_complementog}
            </div>

            {/* Price */}
            <div className="text-lg font-bold text-green-600">
              ${product.pvp.toFixed(2)}
            </div>

            {/* Stock indicator (if low) */}
            {product.stock !== undefined && product.stock < 5 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                ¡Poco stock!
              </div>
            )}
          </button>
        ))}

        {products.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="font-semibold">No hay productos en esta categoría</p>
          </div>
        )}
      </div>

      {/* Quantity Modal */}
      {selectedProduct && (
        <QuantityModal
          product={selectedProduct}
          onConfirm={handleQuantityConfirm}
          onCancel={handleQuantityCancel}
        />
      )}
    </>
  );
};
