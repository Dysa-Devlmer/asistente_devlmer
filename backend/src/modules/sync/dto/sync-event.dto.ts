import {
  IsString,
  IsUUID,
  IsObject,
  IsInt,
  IsEnum,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export enum EventType {
  // Pagos (prioridad 1)
  PAGO_REGISTRADO = 'PAGO_REGISTRADO',
  PAGO_ANULADO = 'PAGO_ANULADO',

  // Caja (prioridad 2)
  CAJA_ABIERTA = 'CAJA_ABIERTA',
  CAJA_CERRADA = 'CAJA_CERRADA',

  // Pedidos (prioridad 3)
  PEDIDO_CREADO = 'PEDIDO_CREADO',
  PEDIDO_ACTUALIZADO = 'PEDIDO_ACTUALIZADO',
  PEDIDO_COMPLETADO = 'PEDIDO_COMPLETADO',
  PEDIDO_CANCELADO = 'PEDIDO_CANCELADO',

  // Mesas (prioridad 4)
  MESA_OCUPADA = 'MESA_OCUPADA',
  MESA_LIBERADA = 'MESA_LIBERADA',

  // Otros (prioridad 5+)
  PRODUCTO_ACTUALIZADO = 'PRODUCTO_ACTUALIZADO',
  EMPLEADO_ACTUALIZADO = 'EMPLEADO_ACTUALIZADO',
}

export enum EntityType {
  PAGO = 'pago',
  SESION_CAJA = 'sesion_caja',
  PEDIDO = 'pedido',
  DETALLE_PEDIDO = 'detalle_pedido',
  MESA = 'mesa',
  PRODUCTO = 'producto',
  EMPLEADO = 'empleado',
}

export class SyncEventDto {
  @IsEnum(EventType)
  event_type: EventType;

  @IsEnum(EntityType)
  entity_type: EntityType;

  @IsUUID()
  entity_id: string;

  @IsString()
  idempotency_key: string; // Formato: {entity_type}:{entity_id}:{action}

  @IsObject()
  payload: Record<string, any>; // Datos completos del evento

  @IsUUID()
  dispositivo_id: string;

  @IsUUID()
  sucursal_id: string;

  @IsUUID()
  @IsOptional()
  user_id?: string; // Empleado que generó el evento

  @IsString()
  client_timestamp: string; // ISO 8601

  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  sync_priority?: number; // 1=MÁXIMA, 10=BAJA
}

export class SyncEventsResponseDto {
  processed: number;
  errors: number;
  pending: number; // Eventos con dependencias pendientes
  results: Array<{
    idempotency_key: string;
    status: 'PROCESADO' | 'ERROR' | 'IGNORADO' | 'DEPENDENCIA_PENDIENTE';
    message?: string;
    missing_dependencies?: string[]; // FKs faltantes
  }>;
}
