<?php
/*
* Configuración específica para Restaurantes Chilenos
* Sistema POS OSPOS adaptado para cumplimiento normativo Chile
* Actualizado: Octubre 2025
*/

// Configuración monetaria Chile
define('CURRENCY_CODE', 'CLP');
define('CURRENCY_SYMBOL', '$');
define('CURRENCY_DECIMALS', 0); // Pesos chilenos no usan decimales
define('THOUSAND_SEPARATOR', '.');
define('DECIMAL_SEPARATOR', ',');

// Configuración de impuestos Chile
define('DEFAULT_TAX_RATE', 19.0); // IVA Chile 19%
define('TAX_NAME', 'IVA');
define('TAX_INCLUDED_IN_PRICE', true);

// Zona horaria Chile
define('TIMEZONE', 'America/Santiago');

// Configuración regional
define('LOCALE', 'es_CL');
define('DATE_FORMAT', 'd/m/Y');
define('DATETIME_FORMAT', 'd/m/Y H:i:s');

// Configuración de facturación electrónica SII
define('SII_ENABLED', true);
define('SII_ENVIRONMENT', 'production'); // 'production' o 'testing'
define('SII_RUT_EMPRESA', ''); // RUT de la empresa (configurar por el usuario)
define('SII_CERTIFICADO_DIGITAL', ''); // Ruta al certificado digital

// URLs del SII
define('SII_URL_PRODUCCION', 'https://palena.sii.cl');
define('SII_URL_CERTIFICACION', 'https://maullin.sii.cl');

// Configuración de documentos tributarios
define('BOLETA_ELECTRONICA_ENABLED', true);
define('FACTURA_ELECTRONICA_ENABLED', true);
define('GUIA_DESPACHO_ENABLED', true);
define('NOTA_CREDITO_ENABLED', true);
define('NOTA_DEBITO_ENABLED', true);

// Configuración de propinas (común en restaurantes chilenos)
define('PROPINA_ENABLED', true);
$propina_sugerida = [10, 12, 15]; // Porcentajes sugeridos
define('PROPINA_DEFAULT', 10);

// Configuración de delivery
define('DELIVERY_ENABLED', true);
define('DELIVERY_ZONES_ENABLED', true);
define('DELIVERY_MIN_ORDER', 5000); // Pedido mínimo en CLP

// Configuración de mesas (para restaurantes)
define('MESA_SYSTEM_ENABLED', true);
define('MESA_QR_ENABLED', true);

// Configuración de tipos de pago comunes en Chile
$payment_types_chile = [
    'efectivo' => 'Efectivo',
    'debito' => 'Tarjeta de Débito',
    'credito' => 'Tarjeta de Crédito',
    'transferencia' => 'Transferencia Electrónica',
    'cheque' => 'Cheque',
    'vale_restaurant' => 'Vale Restaurant',
    'sodexo' => 'Sodexo',
    'ticket_restaurant' => 'Ticket Restaurant'
];

// Configuración de bancos chilenos principales
$bancos_chile = [
    'banco_chile' => 'Banco de Chile',
    'banco_estado' => 'BancoEstado',
    'santander' => 'Santander',
    'bci' => 'BCI',
    'scotiabank' => 'Scotiabank',
    'itau' => 'Itaú',
    'security' => 'Banco Security',
    'falabella' => 'Banco Falabella',
    'ripley' => 'Banco Ripley'
];

// Configuración de comunas principales de Chile
$comunas_chile = [
    // Región Metropolitana
    'santiago' => 'Santiago',
    'providencia' => 'Providencia',
    'las_condes' => 'Las Condes',
    'vitacura' => 'Vitacura',
    'nunoa' => 'Ñuñoa',
    'maipú' => 'Maipú',
    'puente_alto' => 'Puente Alto',
    'la_florida' => 'La Florida',
    
    // Valparaíso
    'valparaiso' => 'Valparaíso',
    'vina_del_mar' => 'Viña del Mar',
    'concon' => 'Concón',
    'quilpue' => 'Quilpué',
    
    // Concepción
    'concepcion' => 'Concepción',
    'talcahuano' => 'Talcahuano',
    'chiguayante' => 'Chiguayante',
    
    // Antofagasta
    'antofagasta' => 'Antofagasta',
    'calama' => 'Calama',
    
    // La Serena
    'la_serena' => 'La Serena',
    'coquimbo' => 'Coquimbo',
    
    // Temuco
    'temuco' => 'Temuco',
    'padre_las_casas' => 'Padre Las Casas'
];

// Configuración de tipos de comida típicos en Chile
$categorias_comida_chile = [
    'empanadas' => 'Empanadas',
    'completos' => 'Completos',
    'cazuela' => 'Cazuelas',
    'asados' => 'Asados',
    'mariscos' => 'Mariscos',
    'pescados' => 'Pescados',
    'pastel_choclo' => 'Pastel de Choclo',
    'humitas' => 'Humitas',
    'sopaipillas' => 'Sopaipillas',
    'mote_con_huesillo' => 'Mote con Huesillo',
    'bebidas' => 'Bebidas',
    'cervezas' => 'Cervezas',
    'vinos' => 'Vinos',
    'pisco' => 'Pisco y Cócteles',
    'postres' => 'Postres'
];

// Configuración horarios típicos restaurantes Chile
define('HORARIO_ALMUERZO_INICIO', '12:00');
define('HORARIO_ALMUERZO_FIN', '15:00');
define('HORARIO_ONCE_INICIO', '17:00');
define('HORARIO_ONCE_FIN', '19:00');
define('HORARIO_CENA_INICIO', '19:30');
define('HORARIO_CENA_FIN', '23:00');

// Configuración de alertas de stock para productos típicos
$stock_alerts_chile = [
    'empanadas' => 20,
    'completos' => 50, // panes
    'bebidas' => 100,
    'cervezas' => 50,
    'general' => 10
];

// Mensaje de bienvenida personalizado
define('WELCOME_MESSAGE', '¡Bienvenido al Sistema POS para Restaurantes Chilenos!');

?>
