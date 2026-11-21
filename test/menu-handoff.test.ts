import assert from 'node:assert/strict';
import { orderHandoff } from '../src/modules/menu/handoff.ts';

const url = new URL(orderHandoff('branch-1', 'dish-1', 2, 'café', 'DESSERT', 'table-1'), 'http://localhost');
assert.equal(url.pathname, '/orders/new');
assert.equal(url.searchParams.get('dishId'), 'dish-1');
assert.equal(url.searchParams.get('branchId'), 'branch-1');
assert.equal(url.searchParams.get('tableId'), 'table-1');
assert.equal(url.searchParams.get('page'), '2');
assert.equal(url.searchParams.get('search'), 'café');
assert.equal(url.searchParams.get('category'), 'DESSERT');
assert.equal(url.searchParams.has('price'), false);
assert.equal(new URL(orderHandoff('b', 'd', 1), 'http://localhost').searchParams.has('tableId'), false);
console.log('menu handoff tests passed');
