#!/bin/bash

echo "========================================="
echo "🇨🇱 OSPOS PARA RESTAURANTES CHILENOS 🇨🇱"
echo "========================================="
echo "Instalación automática y configuración"
echo "Versión 2.0 - Octubre 2025"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "README_OSPOS_PORTABLE.md" ]; then
    echo "❌ Error: Ejecute este script desde el directorio raíz del proyecto"
    exit 1
fi

# Configurar zona horaria Chile
echo "⏰ Configurando zona horaria de Chile..."
export TZ="America/Santiago"

# Verificar PHP y extensiones necesarias
echo "🔍 Verificando PHP y extensiones..."
php_version=$(php -v | head -n1 | cut -d' ' -f2)
echo "✅ PHP versión: $php_version"

# Verificar extensiones necesarias
extensions=("intl" "gd" "sqlite3" "openssl" "curl" "json")
for ext in "${extensions[@]}"; do
    if php -m | grep -q "$ext"; then
        echo "✅ Extensión $ext: Instalada"
    else
        echo "❌ Extensión $ext: NO INSTALADA - Se requiere para facturación electrónica"
    fi
done

# Configurar base de datos SQLite para Chile
echo ""
echo "🗄️ Configurando base de datos para restaurantes chilenos..."
if [ -f "posventa.db" ]; then
    echo "⚠️ Base de datos existente encontrada. Creando respaldo..."
    cp posventa.db "backup_posventa_$(date +%Y%m%d_%H%M%S).db"
fi

# Ejecutar configuración Chile
php configurar_chile_automatico.php

# Crear directorio para certificados SII
echo "📁 Creando directorios para certificados SII..."
mkdir -p certificates/sii
mkdir -p logs/sii
mkdir -p uploads/vouchers
chmod 755 certificates/sii
chmod 777 logs/sii
chmod 777 uploads/vouchers

# Configurar permisos writable
echo "🔒 Configurando permisos..."
chmod -R 777 writable/
chmod 777 posventa.db

# Poblar datos de ejemplo para restaurante chileno
echo "🍽️ Cargando productos típicos chilenos..."
php poblar_productos_chilenos.php

# Verificar configuración
echo ""
echo "🔍 Verificando configuración del sistema..."
php verificar_configuracion_chile.php

echo ""
echo "========================================="
echo "✅ INSTALACIÓN COMPLETADA"
echo "========================================="
echo ""
echo "🚀 PASOS SIGUIENTES:"
echo ""
echo "1. Configurar datos de tu restaurante:"
echo "   - Nombre del restaurante"
echo "   - RUT de la empresa"
echo "   - Dirección y comuna"
echo ""
echo "2. Configurar facturación electrónica:"
echo "   - Obtener certificado digital SII"
echo "   - Configurar RUT y razón social"
echo "   - Configurar ambiente (testing/producción)"
echo ""
echo "3. Iniciar el sistema:"
echo "   bash iniciar_ospos_chile.sh"
echo "   o"
echo "   php -S localhost:8000 -t public"
echo ""
echo "4. Acceder al sistema:"
echo "   URL: http://localhost:8000"
echo "   Usuario: admin"
echo "   Contraseña: pointofsale"
echo ""
echo "📋 CARACTERÍSTICAS PARA CHILE:"
echo "✅ Moneda: Pesos chilenos (CLP)"
echo "✅ IVA: 19% automático"
echo "✅ Zona horaria: Santiago/Chile"
echo "✅ Boletas electrónicas SII"
echo "✅ Facturas con validación e-RUT"
echo "✅ Productos típicos chilenos precargados"
echo "✅ Comunas principales de Chile"
echo "✅ Tipos de pago locales"
echo ""
echo "📞 SOPORTE:"
echo "- Documentación: README_CHILE.md"
echo "- Configuración SII: docs/SII_SETUP.md" 
echo "- Problemas: crear issue en GitHub"
echo ""
echo "¡Tu sistema POS está listo para restaurantes chilenos! 🎉"
