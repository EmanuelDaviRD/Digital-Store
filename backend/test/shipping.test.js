import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDemoShipping, normalizePostalCode } from '../src/shipping.js';

test('normalizes CEP values to eight digits', () => {
  assert.equal(normalizePostalCode('01310-100'), '01310100');
});

test('calculates the demo rate by CEP zone and quantity', () => {
  assert.deepEqual(calculateDemoShipping('01310-100', 3), {
    postalCode: '01310100',
    service: 'Frete demonstrativo',
    priceCents: 1590,
    estimatedDays: 2,
  });
});

test('rejects invalid CEPs and item quantities', () => {
  assert.throws(() => calculateDemoShipping('1234', 1), /CEP válido/);
  assert.throws(() => calculateDemoShipping('01310-100', 0), /quantidade de itens/);
});
