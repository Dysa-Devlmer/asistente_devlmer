/**
 * JARVIS Skill: Información del Menú
 * Responde preguntas sobre el menú, ingredientes, precios, etc.
 */

import { dbService } from '../../backend/src/config/database.js';

class MenuInfoSkill {
  constructor() {
    this.name = 'menu-info';
    this.intents = [
      'menu', 'carta', 'platos', 'que tienen',
      'vegetariano', 'vegano', 'sin gluten', 'alérgenos',
      'precio', 'cuanto cuesta', 'cuánto vale',
      'ingredientes', 'que lleva', 'contiene',
      'recomendación', 'recomiendas', 'sugieres',
      'especialidad', 'plato del día', 'promoción'
    ];
  }

  /**
   * Obtener menú completo organizado por categorías
   */
  async getFullMenu(branchId = 1) {
    try {
      const categories = await dbService.findMany('categories', { is_active: true }, {
        orderBy: { field: 'sort_order', direction: 'asc' }
      });

      const menu = [];

      for (const category of categories) {
        const products = await dbService.findMany('products', {
          category_id: category.id,
          is_active: true
        }, {
          orderBy: { field: 'name', direction: 'asc' }
        });

        if (products.length > 0) {
          menu.push({
            category: category.name,
            description: category.description,
            items: products.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              preparationTime: p.preparation_time,
              tags: this.parseTags(p.tags)
            }))
          });
        }
      }

      return menu;
    } catch (error) {
      console.error('Error getting menu:', error);
      return [];
    }
  }

  /**
   * Buscar productos por criterio
   */
  async searchProducts(query, filters = {}) {
    try {
      let sql = `
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
      `;
      const params = [];

      // Búsqueda por nombre o descripción
      if (query) {
        sql += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
        params.push(`%${query}%`, `%${query}%`);
      }

      // Filtro por categoría
      if (filters.category) {
        sql += ` AND c.name LIKE ?`;
        params.push(`%${filters.category}%`);
      }

      // Filtro por precio máximo
      if (filters.maxPrice) {
        sql += ` AND p.price <= ?`;
        params.push(filters.maxPrice);
      }

      // Filtro por tags (vegetariano, vegano, etc.)
      if (filters.dietary) {
        sql += ` AND p.tags LIKE ?`;
        params.push(`%${filters.dietary}%`);
      }

      sql += ` ORDER BY p.name ASC LIMIT 20`;

      return await dbService.query(sql, params);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  /**
   * Obtener información detallada de un producto
   */
  async getProductDetails(productId) {
    try {
      const product = await dbService.findById('products', productId);
      if (!product) return null;

      // Obtener modificadores disponibles
      const modifiers = await dbService.query(`
        SELECT m.* FROM modifiers m
        JOIN product_modifiers pm ON m.id = pm.modifier_id
        WHERE pm.product_id = ?
      `, [productId]);

      // Obtener receta/ingredientes si existe
      const recipe = await dbService.findOne('recipes', { product_id: productId });

      return {
        ...product,
        modifiers,
        recipe: recipe ? JSON.parse(recipe.ingredients || '[]') : []
      };
    } catch (error) {
      console.error('Error getting product details:', error);
      return null;
    }
  }

  /**
   * Obtener productos por restricción dietética
   */
  async getDietaryOptions(restriction) {
    const restrictions = {
      'vegetariano': ['vegetariano', 'vegetarian'],
      'vegano': ['vegano', 'vegan'],
      'sin gluten': ['sin gluten', 'gluten-free', 'celiaco'],
      'sin lactosa': ['sin lactosa', 'lactose-free'],
      'sin mariscos': ['sin mariscos', 'no seafood'],
      'sin nueces': ['sin nueces', 'nut-free']
    };

    const tags = restrictions[restriction.toLowerCase()] || [restriction];

    try {
      const products = await dbService.query(`
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
        AND (${tags.map(() => 'p.tags LIKE ?').join(' OR ')})
      `, tags.map(t => `%${t}%`));

      return products;
    } catch (error) {
      console.error('Error getting dietary options:', error);
      return [];
    }
  }

  /**
   * Obtener recomendaciones
   */
  async getRecommendations(type = 'popular') {
    try {
      let products;

      switch (type) {
        case 'popular':
          // Productos más vendidos
          products = await dbService.query(`
            SELECT p.*, COUNT(si.id) as sales_count, c.name as category_name
            FROM products p
            LEFT JOIN sale_items si ON p.id = si.product_id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1
            GROUP BY p.id
            ORDER BY sales_count DESC
            LIMIT 5
          `);
          break;

        case 'especial':
          // Platos especiales/destacados
          products = await dbService.query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1 AND p.is_featured = 1
            LIMIT 5
          `);
          break;

        case 'promocion':
          // Productos en promoción
          products = await dbService.query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = 1 AND p.promotion_price IS NOT NULL
            LIMIT 5
          `);
          break;

        default:
          products = await this.searchProducts('', { limit: 5 });
      }

      return products;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Procesar mensaje de usuario
   */
  async processMessage(message, context = {}) {
    const lowerMessage = message.toLowerCase();

    // Consulta sobre opciones vegetarianas/veganas
    if (lowerMessage.includes('vegetarian') || lowerMessage.includes('vegano') || lowerMessage.includes('vegana')) {
      const restriction = lowerMessage.includes('vegano') || lowerMessage.includes('vegana') ? 'vegano' : 'vegetariano';
      const options = await this.getDietaryOptions(restriction);

      if (options.length > 0) {
        const list = options.map(p => `• ${p.name} - $${p.price.toLocaleString('es-CL')}`).join('\n');
        return {
          action: 'show_dietary_options',
          data: options,
          response: `Tenemos estas opciones ${restriction}s:\n\n${list}\n\n¿Le gustaría más información sobre alguno?`
        };
      }
      return {
        action: 'no_options',
        response: `Lo siento, actualmente no tenemos opciones ${restriction}s disponibles. ¿Puedo ayudarle con algo más?`
      };
    }

    // Sin gluten
    if (lowerMessage.includes('gluten') || lowerMessage.includes('celiaco') || lowerMessage.includes('celíaco')) {
      const options = await this.getDietaryOptions('sin gluten');
      if (options.length > 0) {
        const list = options.map(p => `• ${p.name} - $${p.price.toLocaleString('es-CL')}`).join('\n');
        return {
          action: 'show_dietary_options',
          data: options,
          response: `Tenemos estas opciones sin gluten:\n\n${list}`
        };
      }
    }

    // Consulta de precio
    if (lowerMessage.includes('precio') || lowerMessage.includes('cuanto') || lowerMessage.includes('cuánto') || lowerMessage.includes('vale')) {
      // Extraer nombre del producto
      const productName = this.extractProductName(message);
      if (productName) {
        const products = await this.searchProducts(productName);
        if (products.length > 0) {
          const product = products[0];
          return {
            action: 'show_price',
            data: product,
            response: `${product.name} tiene un precio de $${product.price.toLocaleString('es-CL')}. ${product.description || ''}`
          };
        }
      }
      return {
        action: 'request_product',
        response: '¿De qué plato le gustaría saber el precio?'
      };
    }

    // Recomendaciones
    if (lowerMessage.includes('recomiend') || lowerMessage.includes('sugier') || lowerMessage.includes('especialidad') || lowerMessage.includes('popular')) {
      const recommendations = await this.getRecommendations('popular');
      if (recommendations.length > 0) {
        const list = recommendations.map(p => `• ${p.name} - $${p.price.toLocaleString('es-CL')}`).join('\n');
        return {
          action: 'show_recommendations',
          data: recommendations,
          response: `Nuestros platos más populares son:\n\n${list}\n\n¿Le gustaría ordenar alguno?`
        };
      }
    }

    // Menú completo
    if (lowerMessage.includes('menu') || lowerMessage.includes('carta') || lowerMessage.includes('que tienen')) {
      const menu = await this.getFullMenu();
      const summary = menu.map(cat =>
        `*${cat.category}*\n${cat.items.slice(0, 3).map(i => `  • ${i.name} - $${i.price.toLocaleString('es-CL')}`).join('\n')}`
      ).join('\n\n');

      return {
        action: 'show_menu',
        data: menu,
        response: `Este es un resumen de nuestra carta:\n\n${summary}\n\n¿Le gustaría más detalles de alguna categoría?`
      };
    }

    // Ingredientes
    if (lowerMessage.includes('ingrediente') || lowerMessage.includes('que lleva') || lowerMessage.includes('contiene')) {
      const productName = this.extractProductName(message);
      if (productName) {
        const products = await this.searchProducts(productName);
        if (products.length > 0) {
          const details = await this.getProductDetails(products[0].id);
          if (details && details.recipe.length > 0) {
            const ingredients = details.recipe.map(i => i.name).join(', ');
            return {
              action: 'show_ingredients',
              data: details,
              response: `${details.name} lleva: ${ingredients}. ¿Tiene alguna alergia o restricción alimentaria?`
            };
          }
          return {
            action: 'show_description',
            data: details,
            response: `${details.name}: ${details.description || 'Sin descripción detallada disponible.'}`
          };
        }
      }
    }

    return null; // No es una consulta sobre menú
  }

  // Helpers
  extractProductName(message) {
    // Remover palabras comunes para encontrar el nombre del producto
    const stopWords = ['precio', 'de', 'del', 'la', 'el', 'un', 'una', 'cuanto', 'cuánto', 'cuesta', 'vale', 'tiene', 'lleva', 'ingredientes'];
    const words = message.toLowerCase().split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 2);
    return words.join(' ');
  }

  parseTags(tagsString) {
    if (!tagsString) return [];
    try {
      return JSON.parse(tagsString);
    } catch {
      return tagsString.split(',').map(t => t.trim());
    }
  }
}

export default new MenuInfoSkill();
