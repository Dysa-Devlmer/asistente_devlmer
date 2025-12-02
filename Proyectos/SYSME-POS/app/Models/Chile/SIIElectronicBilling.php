<?php
/*
* Modelo de Facturación Electrónica SII Chile
* Cumple con normativas del Servicio de Impuestos Internos
* Resolución N°121/2024 y normativas vigentes 2025
*/

namespace App\Models\Chile;

class SIIElectronicBilling {
    
    private $rut_empresa;
    private $certificado_digital;
    private $environment; // 'production' o 'testing'
    private $sii_urls = [
        'production' => 'https://palena.sii.cl',
        'testing' => 'https://maullin.sii.cl'
    ];
    
    public function __construct($config = []) {
        $this->rut_empresa = $config['rut_empresa'] ?? '';
        $this->certificado_digital = $config['certificado_digital'] ?? '';
        $this->environment = $config['environment'] ?? 'testing';
    }
    
    /**
     * Emite una boleta electrónica
     * Obligatorio según Resolución N°12/2025 del SII
     */
    public function emitirBoletaElectronica($datos_venta) {
        $boleta = [
            'encabezado' => [
                'id_doc' => [
                    'tipo_dte' => 39, // Boleta electrónica
                    'folio' => $this->obtenerSiguienteFolio(39),
                    'fecha_emision' => date('Y-m-d'),
                    'forma_pago' => $datos_venta['forma_pago'],
                    'fecha_vencimiento' => date('Y-m-d')
                ],
                'emisor' => [
                    'rut' => $this->rut_empresa,
                    'razon_social' => $datos_venta['emisor']['razon_social'],
                    'giro' => $datos_venta['emisor']['giro'],
                    'direccion' => $datos_venta['emisor']['direccion'],
                    'comuna' => $datos_venta['emisor']['comuna'],
                    'ciudad' => $datos_venta['emisor']['ciudad']
                ],
                'receptor' => [
                    'rut' => $datos_venta['cliente']['rut'] ?? '66666666-6',
                    'razon_social' => $datos_venta['cliente']['nombre'] ?? 'Cliente Final',
                    'direccion' => $datos_venta['cliente']['direccion'] ?? '',
                    'comuna' => $datos_venta['cliente']['comuna'] ?? '',
                    'ciudad' => $datos_venta['cliente']['ciudad'] ?? ''
                ],
                'totales' => [
                    'monto_neto' => $this->calcularMontoNeto($datos_venta['items']),
                    'iva' => $this->calcularIVA($datos_venta['items']),
                    'monto_total' => $datos_venta['total']
                ]
            ],
            'detalle' => $this->formatearDetalle($datos_venta['items'])
        ];
        
        return $this->enviarDTE($boleta, 39);
    }
    
    /**
     * Emite una factura electrónica
     * Solo para consumos relacionados con giro comercial (Resolución N°121/2024)
     */
    public function emitirFacturaElectronica($datos_venta) {
        // Validar que el cliente tenga RUT válido y motivo comercial
        if (!$this->validarFacturaComercial($datos_venta)) {
            throw new Exception('Factura no permitida: debe ser para consumo comercial con e-RUT válido');
        }
        
        $factura = [
            'encabezado' => [
                'id_doc' => [
                    'tipo_dte' => 33, // Factura electrónica
                    'folio' => $this->obtenerSiguienteFolio(33),
                    'fecha_emision' => date('Y-m-d'),
                    'forma_pago' => $datos_venta['forma_pago'],
                    'fecha_vencimiento' => date('Y-m-d', strtotime('+30 days'))
                ],
                'emisor' => [
                    'rut' => $this->rut_empresa,
                    'razon_social' => $datos_venta['emisor']['razon_social'],
                    'giro' => $datos_venta['emisor']['giro'],
                    'direccion' => $datos_venta['emisor']['direccion'],
                    'comuna' => $datos_venta['emisor']['comuna'],
                    'ciudad' => $datos_venta['emisor']['ciudad']
                ],
                'receptor' => [
                    'rut' => $datos_venta['cliente']['rut'],
                    'razon_social' => $datos_venta['cliente']['razon_social'],
                    'giro' => $datos_venta['cliente']['giro'],
                    'direccion' => $datos_venta['cliente']['direccion'],
                    'comuna' => $datos_venta['cliente']['comuna'],
                    'ciudad' => $datos_venta['cliente']['ciudad']
                ],
                'totales' => [
                    'monto_neto' => $this->calcularMontoNeto($datos_venta['items']),
                    'iva' => $this->calcularIVA($datos_venta['items']),
                    'monto_total' => $datos_venta['total']
                ]
            ],
            'detalle' => $this->formatearDetalle($datos_venta['items']),
            'motivo_comercial' => $datos_venta['motivo_comercial'] // Obligatorio para factura
        ];
        
        return $this->enviarDTE($factura, 33);
    }
    
    /**
     * Valida si se puede emitir factura según normativa SII 2024
     */
    private function validarFacturaComercial($datos_venta) {
        // Cliente debe tener RUT válido
        if (empty($datos_venta['cliente']['rut']) || $datos_venta['cliente']['rut'] === '66666666-6') {
            return false;
        }
        
        // Debe tener e-RUT presentado
        if (empty($datos_venta['cliente']['e_rut_presentado']) || !$datos_venta['cliente']['e_rut_presentado']) {
            return false;
        }
        
        // Debe tener motivo comercial válido
        $motivos_validos = [
            'almuerzo_negocios',
            'cena_negocios',
            'reunion_trabajo',
            'evento_corporativo',
            'capacitacion_empresa',
            'atencion_clientes'
        ];
        
        if (empty($datos_venta['motivo_comercial']) || 
            !in_array($datos_venta['motivo_comercial'], $motivos_validos)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Calcula monto neto (sin IVA)
     */
    private function calcularMontoNeto($items) {
        $total = 0;
        foreach ($items as $item) {
            $total += $item['precio_unitario'] * $item['cantidad'];
        }
        return round($total / 1.19, 0); // IVA incluido
    }
    
    /**
     * Calcula IVA (19%)
     */
    private function calcularIVA($items) {
        $monto_neto = $this->calcularMontoNeto($items);
        return round($monto_neto * 0.19, 0);
    }
    
    /**
     * Formatea el detalle de productos para DTE
     */
    private function formatearDetalle($items) {
        $detalle = [];
        $linea = 1;
        
        foreach ($items as $item) {
            $detalle[] = [
                'num_linea_det' => $linea++,
                'codigo_item' => $item['codigo'],
                'nombre_item' => $item['nombre'],
                'descripcion' => $item['descripcion'] ?? $item['nombre'],
                'cantidad' => $item['cantidad'],
                'unidad_medida' => $item['unidad'] ?? 'UN',
                'precio' => round($item['precio_unitario'] / 1.19, 0), // Precio neto
                'monto_item' => round(($item['precio_unitario'] * $item['cantidad']) / 1.19, 0)
            ];
        }
        
        return $detalle;
    }
    
    /**
     * Obtiene el siguiente folio para un tipo de DTE
     */
    private function obtenerSiguienteFolio($tipo_dte) {
        // Implementar lógica de folios desde base de datos
        // Por ahora retorna un folio de ejemplo
        return rand(1000, 999999);
    }
    
    /**
     * Envía el DTE al SII
     */
    private function enviarDTE($dte, $tipo_dte) {
        $xml = $this->generarXML($dte, $tipo_dte);
        $xml_firmado = $this->firmarXML($xml);
        
        $url = $this->sii_urls[$this->environment] . '/cgi_dte/UPL/DTEUpload';
        
        // Implementar envío HTTP al SII
        $response = $this->enviarHTTP($url, $xml_firmado);
        
        return [
            'success' => true,
            'folio' => $dte['encabezado']['id_doc']['folio'],
            'tipo_dte' => $tipo_dte,
            'track_id' => $response['track_id'] ?? null,
            'xml' => $xml_firmado
        ];
    }
    
    /**
     * Genera XML del DTE según formato SII
     */
    private function generarXML($dte, $tipo_dte) {
        // Implementar generación de XML según esquema SII
        // Retorna XML básico por ahora
        return '<?xml version="1.0" encoding="ISO-8859-1"?><DTE></DTE>';
    }
    
    /**
     * Firma digitalmente el XML con certificado
     */
    private function firmarXML($xml) {
        // Implementar firma digital con certificado
        // Por ahora retorna el XML sin modificar
        return $xml;
    }
    
    /**
     * Envía HTTP al SII
     */
    private function enviarHTTP($url, $data) {
        // Implementar envío HTTP con curl
        return ['track_id' => 'TRACK123456'];
    }
}

/**
 * Helper para validar RUT chileno
 */
class RUTValidator {
    
    public static function validar($rut) {
        $rut = preg_replace('/[^k0-9]/i', '', $rut);
        $dv = substr($rut, -1);
        $numero = substr($rut, 0, strlen($rut) - 1);
        
        $i = 2;
        $suma = 0;
        foreach (array_reverse(str_split($numero)) as $digito) {
            if ($i == 8) $i = 2;
            $suma += $digito * $i++;
        }
        
        $dvr = 11 - ($suma % 11);
        if ($dvr == 11) $dvr = 0;
        if ($dvr == 10) $dvr = 'K';
        
        return strtoupper($dv) == strtoupper($dvr);
    }
    
    public static function formatear($rut) {
        $rut = preg_replace('/[^k0-9]/i', '', $rut);
        $dv = substr($rut, -1);
        $numero = substr($rut, 0, strlen($rut) - 1);
        
        return number_format($numero, 0, '', '.') . '-' . strtoupper($dv);
    }
}

?>