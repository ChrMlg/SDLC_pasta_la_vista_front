import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BLOCKED_TABLE_STATUSES,
  isOrderableTable,
  TABLE_STATUS_LABELS,
} from '../src/shared/table-status.ts';

test('provides Spanish labels for known table statuses', () => {
  assert.deepEqual(TABLE_STATUS_LABELS, {
    AVAILABLE: 'Disponible',
    OCCUPIED: 'Ocupada',
    NEEDS_CLEANING: 'Por limpiar',
    RESERVED: 'Reservada',
    OUT_OF_SERVICE: 'Fuera de servicio',
  });
});

test('only OCCUPIED tables can receive waiter orders', () => {
  assert.equal(isOrderableTable('OCCUPIED'), true);

  for (const status of [...BLOCKED_TABLE_STATUSES, 'UNKNOWN']) {
    assert.equal(isOrderableTable(status), false);
  }
  assert.equal(isOrderableTable(undefined), false);
});
