import test from 'node:test';
import assert from 'node:assert/strict';
import { isCompanionPath, toInnerPath } from '../src/modules/companion/companion-routes.ts';

test('identifica las rutas de los módulos compañero', () => {
  for (const path of [
    '/seating',
    '/checkout?orderId=abc',
    '/management/inventory',
    '/waiter/billing/xyz',
    '/branches/branch-id/orders/order-id/billing',
    '/my-receipts/1',
  ]) {
    assert.equal(isCompanionPath(path), true, path);
  }
});

test('rechaza rutas administradas por otros módulos', () => {
  for (const path of [
    '/branches/menu',
    '/management/menu',
    '/notifications',
    '/orders/new',
    '/kitchen',
  ]) {
    assert.equal(isCompanionPath(path), false, path);
  }
});

test('convierte rutas externas a rutas internas', () => {
  assert.equal(toInnerPath('/seating'), '/');
  assert.equal(toInnerPath('/reservations'), '/reservations/new');
  assert.equal(toInnerPath('/checkout?orderId=abc'), '/checkout?orderId=abc');
});
