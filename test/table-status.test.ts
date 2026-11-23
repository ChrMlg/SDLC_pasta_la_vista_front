import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLOCKED_TABLE_STATUSES,
  isOrderableTable,
  TABLE_STATUS_LABELS,
} from '../src/shared/table-status.ts';

test('traduce los estados de mesa visibles y marca estados bloqueados', () => {
  assert.equal(TABLE_STATUS_LABELS.AVAILABLE, 'Disponible');
  assert.equal(TABLE_STATUS_LABELS.NEEDS_CLEANING, 'Por limpiar');
  assert.deepEqual(BLOCKED_TABLE_STATUSES, ['NEEDS_CLEANING', 'OUT_OF_SERVICE']);
});

test('solo permite pedir en mesas ocupadas', () => {
  assert.equal(isOrderableTable('OCCUPIED'), true);
  for (const status of ['AVAILABLE', 'NEEDS_CLEANING', 'RESERVED', 'OUT_OF_SERVICE', undefined]) {
    assert.equal(isOrderableTable(status), false, String(status));
  }
});
