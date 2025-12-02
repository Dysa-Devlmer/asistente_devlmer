<?php
/*
* Productos típicos chilenos para restaurantes
* Precarga automática de menú local
* 32 productos en 11 categorías
*/

$productos_chilenos = [
    // EMPANADAS
    [
        'categoria' => 'Empanadas',
        'nombre' => 'Empanada de Pino',
        'descripcion' => 'Empanada tradicional con carne, cebolla, huevo y aceitunas',
        'precio' => 1500,
        'codigo' => 'EMP001',
        'stock_minimo' => 20,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Empanadas',
        'nombre' => 'Empanada de Queso',
        'descripcion' => 'Empanada de queso derretido',
        'precio' => 1200,
        'codigo' => 'EMP002',
        'stock_minimo' => 15,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Empanadas',
        'nombre' => 'Empanada de Mariscos',
        'descripcion' => 'Empanada rellena con mariscos frescos',
        'precio' => 2500,
        'codigo' => 'EMP003',
        'stock_minimo' => 10,
        'unidad' => 'UN'
    ],

    // COMPLETOS
    [
        'categoria' => 'Completos',
        'nombre' => 'Completo Italiano',
        'descripcion' => 'Completo con palta, tomate y mayonesa',
        'precio' => 2800,
        'codigo' => 'COMP001',
        'stock_minimo' => 30,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Completos',
        'nombre' => 'Completo As',
        'descripcion' => 'Completo con palta',
        'precio' => 2500,
        'codigo' => 'COMP002',
        'stock_minimo' => 30,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Completos',
        'nombre' => 'Completo Dinámico',
        'descripcion' => 'Completo con tomate y mayonesa',
        'precio' => 2200,
        'codigo' => 'COMP003',
        'stock_minimo' => 30,
        'unidad' => 'UN'
    ],

    // PLATOS PRINCIPALES
    [
        'categoria' => 'Platos Principales',
        'nombre' => 'Cazuela de Cordero',
        'descripcion' => 'Cazuela tradicional con cordero y verduras',
        'precio' => 8500,
        'codigo' => 'PLATO001',
        'stock_minimo' => 5,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Platos Principales',
        'nombre' => 'Pastel de Choclo',
        'descripcion' => 'Pastel tradicional con choclo, carne y pollo',
        'precio' => 7200,
        'codigo' => 'PLATO002',
        'stock_minimo' => 8,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Platos Principales',
        'nombre' => 'Curanto',
        'descripcion' => 'Plato típico del sur con mariscos, carnes y papas',
        'precio' => 12000,
        'codigo' => 'PLATO003',
        'stock_minimo' => 3,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Platos Principales',
        'nombre' => 'Cordero al Palo',
        'descripcion' => 'Cordero asado a la parrilla estilo patagónico',
        'precio' => 15000,
        'codigo' => 'PLATO004',
        'stock_minimo' => 2,
        'unidad' => 'UN'
    ],

    // MARISCOS
    [
        'categoria' => 'Mariscos',
        'nombre' => 'Centolla Austral',
        'descripcion' => 'Centolla fresca del sur de Chile',
        'precio' => 18000,
        'codigo' => 'MAR001',
        'stock_minimo' => 2,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Mariscos',
        'nombre' => 'Machas a la Parmesana',
        'descripcion' => 'Machas gratinadas con queso parmesano',
        'precio' => 9500,
        'codigo' => 'MAR002',
        'stock_minimo' => 5,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Mariscos',
        'nombre' => 'Chupe de Centolla',
        'descripcion' => 'Chupe cremoso con centolla y queso',
        'precio' => 14500,
        'codigo' => 'MAR003',
        'stock_minimo' => 3,
        'unidad' => 'UN'
    ],

    // PESCADOS
    [
        'categoria' => 'Pescados',
        'nombre' => 'Salmón a la Plancha',
        'descripcion' => 'Salmón fresco a la plancha con ensalada',
        'precio' => 11200,
        'codigo' => 'PESC001',
        'stock_minimo' => 8,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Pescados',
        'nombre' => 'Congrio Frito',
        'descripcion' => 'Congrio frito con papas doradas',
        'precio' => 8900,
        'codigo' => 'PESC002',
        'stock_minimo' => 6,
        'unidad' => 'UN'
    ],

    // BEBIDAS
    [
        'categoria' => 'Bebidas',
        'nombre' => 'Mote con Huesillo',
        'descripcion' => 'Bebida tradicional chilena',
        'precio' => 1800,
        'codigo' => 'BEB001',
        'stock_minimo' => 20,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Bebidas',
        'nombre' => 'Chicha de Uva',
        'descripcion' => 'Chicha natural de uva',
        'precio' => 2200,
        'codigo' => 'BEB002',
        'stock_minimo' => 15,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Bebidas',
        'nombre' => 'Agua Mineral',
        'descripcion' => 'Agua mineral 500ml',
        'precio' => 1200,
        'codigo' => 'BEB003',
        'stock_minimo' => 50,
        'unidad' => 'UN'
    ],

    // CERVEZAS CHILENAS
    [
        'categoria' => 'Cervezas',
        'nombre' => 'Cristal Lata',
        'descripcion' => 'Cerveza Cristal 330ml',
        'precio' => 1800,
        'codigo' => 'CERV001',
        'stock_minimo' => 48,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Cervezas',
        'nombre' => 'Escudo Botella',
        'descripcion' => 'Cerveza Escudo 330ml',
        'precio' => 1900,
        'codigo' => 'CERV002',
        'stock_minimo' => 48,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Cervezas',
        'nombre' => 'Kunstmann Lager',
        'descripcion' => 'Cerveza artesanal Kunstmann',
        'precio' => 3200,
        'codigo' => 'CERV003',
        'stock_minimo' => 24,
        'unidad' => 'UN'
    ],

    // VINOS CHILENOS
    [
        'categoria' => 'Vinos',
        'nombre' => 'Carmenère Reserva',
        'descripcion' => 'Vino tinto Carmenère cepa emblemática',
        'precio' => 8500,
        'codigo' => 'VINO001',
        'stock_minimo' => 12,
        'unidad' => 'BOT'
    ],
    [
        'categoria' => 'Vinos',
        'nombre' => 'Sauvignon Blanc',
        'descripcion' => 'Vino blanco del Valle de Casablanca',
        'precio' => 7200,
        'codigo' => 'VINO002',
        'stock_minimo' => 12,
        'unidad' => 'BOT'
    ],

    // PISCO Y CÓCTELES
    [
        'categoria' => 'Pisco y Cócteles',
        'nombre' => 'Pisco Sour',
        'descripcion' => 'Cóctel tradicional chileno con pisco',
        'precio' => 4500,
        'codigo' => 'COCK001',
        'stock_minimo' => 10,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Pisco y Cócteles',
        'nombre' => 'Piscola',
        'descripcion' => 'Pisco con cola, bebida popular chilena',
        'precio' => 3200,
        'codigo' => 'COCK002',
        'stock_minimo' => 15,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Pisco y Cócteles',
        'nombre' => 'Terremoto',
        'descripcion' => 'Cóctel con vino pipeño, helado de piña y fernet',
        'precio' => 4200,
        'codigo' => 'COCK003',
        'stock_minimo' => 8,
        'unidad' => 'UN'
    ],

    // POSTRES
    [
        'categoria' => 'Postres',
        'nombre' => 'Sopaipillas Pasadas',
        'descripcion' => 'Sopaipillas con chancaca',
        'precio' => 2800,
        'codigo' => 'POST001',
        'stock_minimo' => 20,
        'unidad' => 'PORCION'
    ],
    [
        'categoria' => 'Postres',
        'nombre' => 'Leche Asada',
        'descripcion' => 'Postre tradicional chileno',
        'precio' => 3200,
        'codigo' => 'POST002',
        'stock_minimo' => 8,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Postres',
        'nombre' => 'Mil Hojas',
        'descripcion' => 'Torta mil hojas con manjar',
        'precio' => 3800,
        'codigo' => 'POST003',
        'stock_minimo' => 6,
        'unidad' => 'TROZO'
    ],

    // ENTRADAS/APERITIVOS
    [
        'categoria' => 'Entradas',
        'nombre' => 'Humitas',
        'descripcion' => 'Humitas de choclo tierno',
        'precio' => 2200,
        'codigo' => 'ENT001',
        'stock_minimo' => 15,
        'unidad' => 'UN'
    ],
    [
        'categoria' => 'Entradas',
        'nombre' => 'Sopaipillas',
        'descripcion' => 'Sopaipillas con pebre',
        'precio' => 1800,
        'codigo' => 'ENT002',
        'stock_minimo' => 30,
        'unidad' => 'PORCION'
    ],
    [
        'categoria' => 'Entradas',
        'nombre' => 'Pebre',
        'descripcion' => 'Pebre tradicional chileno',
        'precio' => 1500,
        'codigo' => 'ENT003',
        'stock_minimo' => 10,
        'unidad' => 'PORCION'
    ]
];

/**
 * Función para insertar productos en la base de datos
 */
function cargarProductosChilenos($db) {
    global $productos_chilenos;
    
    $insertados = 0;
    $errores = 0;
    
    foreach ($productos_chilenos as $producto) {
        try {
            // Verificar si la categoría existe, si no crearla
            $categoria_id = obtenerOCrearCategoria($db, $producto['categoria']);
            
            // Insertar producto
            $sql = "INSERT INTO items (name, description, category_id, unit_price, cost_price, item_number, quantity, reorder_level) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $db->prepare($sql);
            $stmt->execute([
                $producto['nombre'],
                $producto['descripcion'],
                $categoria_id,
                $producto['precio'],
                $producto['precio'] * 0.6, // Costo estimado 60% del precio
                $producto['codigo'],
                100, // Stock inicial
                $producto['stock_minimo']
            ]);
            
            $insertados++;
            
        } catch (Exception $e) {
            $errores++;
            echo "Error insertando {$producto['nombre']}: " . $e->getMessage() . "\n";
        }
    }
    
    return [
        'insertados' => $insertados,
        'errores' => $errores,
        'total' => count($productos_chilenos)
    ];
}

/**
 * Obtiene o crea una categoría
 */
function obtenerOCrearCategoria($db, $nombre_categoria) {
    // Buscar categoría existente
    $sql = "SELECT category_id FROM categories WHERE category_name = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute([$nombre_categoria]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        return $result['category_id'];
    }
    
    // Crear nueva categoría
    $sql = "INSERT INTO categories (category_name, category_colour) VALUES (?, ?)";
    $stmt = $db->prepare($sql);
    $colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    $color = $colors[array_rand($colors)];
    $stmt->execute([$nombre_categoria, $color]);
    
    return $db->lastInsertId();
}

?>
