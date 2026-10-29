const shippingZones = {
  0: { priceCents: 1090, days: 2 },
  1: { priceCents: 1390, days: 3 },
  2: { priceCents: 1590, days: 3 },
  3: { priceCents: 1590, days: 4 },
  4: { priceCents: 1890, days: 5 },
  5: { priceCents: 1890, days: 5 },
  6: { priceCents: 2290, days: 7 },
  7: { priceCents: 1790, days: 5 },
  8: { priceCents: 1590, days: 4 },
  9: { priceCents: 1790, days: 5 },
};

export function normalizePostalCode(value) {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

export function calculateDemoShipping(postalCode, quantity) {
  const normalized = normalizePostalCode(postalCode);
  if (!/^\d{8}$/.test(normalized)) {
    throw new TypeError('Informe um CEP válido com 8 dígitos.');
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new TypeError('A quantidade de itens para o frete é inválida.');
  }

  const zone = shippingZones[normalized[0]];
  return {
    postalCode: normalized,
    service: 'Frete demonstrativo',
    priceCents: zone.priceCents + (quantity - 1) * 250,
    estimatedDays: zone.days,
  };
}
