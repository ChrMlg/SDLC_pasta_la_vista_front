import assert from 'node:assert/strict';
import test from 'node:test';
import { validateMenuForm } from '../src/modules/menu/validation.ts';

test('menu form rejects invalid fields before request', () => {
  const errors = validateMenuForm({ name: ' ', description: 'a'.repeat(301), category: '', price: '0.001' });
  assert.deepEqual(Object.keys(errors).sort(), ['category', 'description', 'name', 'price']);
});

test('menu form accepts valid dish', () => {
  assert.deepEqual(validateMenuForm({ name: 'Café', description: '', category: 'DRINK', price: '2.50' }), {});
});


test('menu form enforces name, description and price boundaries', () => {
  const valid = { name: 'Ab', description: '', category: 'STARTER' as const, price: '0.01' };
  for (const name of ['A', 'a'.repeat(81), '  ']) assert.ok(validateMenuForm({ ...valid, name }).name);
  for (const name of ['Ab', 'a'.repeat(80)]) assert.equal(validateMenuForm({ ...valid, name }).name, undefined);
  assert.equal(validateMenuForm({ ...valid, description: 'a'.repeat(300) }).description, undefined);
  assert.ok(validateMenuForm({ ...valid, description: 'a'.repeat(301) }).description);
  for (const price of ['0', '0.00', '100000', '1.001', '-1', '1,50', '']) assert.ok(validateMenuForm({ ...valid, price }).price, price);
  for (const price of ['0.01', '99999.99', '1', '1.2']) assert.equal(validateMenuForm({ ...valid, price }).price, undefined, price);
});
