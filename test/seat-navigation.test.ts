import assert from 'node:assert/strict';
import { test } from 'node:test';
import { staleSeatDestination } from '../src/modules/orders/seat-navigation.ts';

test('keeps the current customer table and replaces a stale table URL', () => {
  const seat = { branchId: 'branch-a', tableId: 'table-a', number: 2 };
  assert.equal(staleSeatDestination('branch-a', 'table-a', seat), null);
  assert.equal(staleSeatDestination('branch-b', 'table-b', seat), '/?branchId=branch-a&tableId=table-a');
  assert.equal(staleSeatDestination('branch-b', 'table-b', null), '/?branchId=branch-b');
  assert.equal(staleSeatDestination(null, 'table-b', null), '/');
  assert.equal(staleSeatDestination('branch-a', null, seat), null);
});
