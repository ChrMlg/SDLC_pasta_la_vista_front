export const TABLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupada',
  NEEDS_CLEANING: 'Por limpiar',
  RESERVED: 'Reservada',
  OUT_OF_SERVICE: 'Fuera de servicio',
};

export const BLOCKED_TABLE_STATUSES: readonly string[] = [
  'AVAILABLE',
  'NEEDS_CLEANING',
  'RESERVED',
  'OUT_OF_SERVICE',
] as const;

export function isOrderableTable(status: string | null | undefined): boolean {
  return status === 'OCCUPIED';
}
