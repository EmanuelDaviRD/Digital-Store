import { Router } from 'express';
import { Op } from 'sequelize';
import { Order, OrderItem, Product, ProductImage, ProductOption } from '../models.js';
import { sequelize } from '../database.js';
import { asyncRoute, invalidRequest, requireAuth } from '../middleware.js';
import { calculateDemoShipping, normalizePostalCode } from '../shipping.js';

const router = Router();
const paymentMethods = new Set(['pix', 'credit_card', 'boleto']);
const paymentScenarios = new Set(['approved', 'pending', 'rejected']);
const addressFields = ['recipient', 'street', 'number', 'neighborhood', 'city', 'state'];

function toCents(value) {
  return Math.round(Number(value) * 100);
}

function fromCents(value) {
  return (value / 100).toFixed(2);
}

function validateItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    throw invalidRequest('O pedido precisa ter entre 1 e 50 itens.');
  }
  return items.map((item) => {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw invalidRequest('Um ou mais itens do pedido são inválidos.');
    }
    const options = item.options ?? {};
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      throw invalidRequest('As opções de um item são inválidas.');
    }
    return { productId, quantity, options };
  });
}

function validateAddress(address) {
  if (!address || typeof address !== 'object' || Array.isArray(address)) {
    throw invalidRequest('Informe o endereço de entrega.');
  }
  const clean = Object.fromEntries(
    [...addressFields, 'complement'].map((field) => [
      field,
      typeof address[field] === 'string' ? address[field].trim() : '',
    ])
  );
  if (addressFields.some((field) => !clean[field])) {
    throw invalidRequest('Preencha todos os campos obrigatórios do endereço.');
  }
  if (!/^[A-Z]{2}$/.test(clean.state.toUpperCase())) {
    throw invalidRequest('Informe a sigla do estado com 2 letras.');
  }
  clean.state = clean.state.toUpperCase();
  return clean;
}

function getShipping(postalCode, items) {
  try {
    return calculateDemoShipping(postalCode, items.reduce((sum, item) => sum + item.quantity, 0));
  } catch (error) {
    throw invalidRequest(error.message);
  }
}

function serializeOrder(order) {
  const result = order.get({ plain: true });
  for (const field of ['subtotal', 'shipping_cost', 'total']) result[field] = Number(result[field]);
  result.items = (result.items ?? []).map((item) => ({
    ...item,
    unit_price: Number(item.unit_price),
    line_total: Number(item.line_total),
  }));
  return result;
}

router.post(
  '/shipping/quote',
  requireAuth,
  asyncRoute(async (req, res) => {
    const items = validateItems(req.body.items);
    const quote = getShipping(req.body.postalCode, items);
    const quantityByProduct = new Map();
    for (const item of items) {
      quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity);
    }
    const products = await Product.findAll({
      attributes: ['id', 'price', 'price_with_discount'],
      where: { id: { [Op.in]: [...quantityByProduct.keys()] }, enabled: true },
    });
    if (products.length !== quantityByProduct.size) {
      throw invalidRequest('Um ou mais produtos não estão disponíveis para compra.');
    }
    const productsById = new Map(products.map((product) => [product.id, product]));
    const subtotalCents = items.reduce((sum, item) => {
      const product = productsById.get(item.productId);
      const unitPriceCents = toCents(product.price_with_discount) > 0
        ? toCents(product.price_with_discount)
        : toCents(product.price);
      return sum + unitPriceCents * item.quantity;
    }, 0);
    return res.json({
      postalCode: quote.postalCode,
      service: quote.service,
      cost: Number(fromCents(quote.priceCents)),
      subtotal: Number(fromCents(subtotalCents)),
      estimatedDays: quote.estimatedDays,
      testMode: true,
    });
  })
);

router.post(
  '/orders',
  requireAuth,
  asyncRoute(async (req, res) => {
    const items = validateItems(req.body.items);
    const postalCode = normalizePostalCode(req.body.postalCode);
    const address = validateAddress(req.body.shippingAddress);
    const paymentMethod = req.body.paymentMethod;
    const paymentScenario = req.body.paymentScenario;
    if (!paymentMethods.has(paymentMethod)) throw invalidRequest('Selecione uma forma de pagamento de teste válida.');
    if (!paymentScenarios.has(paymentScenario)) throw invalidRequest('Selecione um cenário de pagamento válido.');
    if (address.state.length !== 2) throw invalidRequest('Informe a sigla do estado com 2 letras.');

    const shipping = getShipping(postalCode, items);
    const quantityByProduct = new Map();
    for (const item of items) {
      quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity);
    }

    const transaction = await sequelize.transaction();
    let orderId;
    try {
      const products = await Product.findAll({
        where: { id: { [Op.in]: [...quantityByProduct.keys()] }, enabled: true },
        include: [
          { model: ProductOption, as: 'options', required: false },
          { model: ProductImage, as: 'images', where: { enabled: true }, required: false },
        ],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (products.length !== quantityByProduct.size) {
        throw invalidRequest('Um ou mais produtos não estão disponíveis para compra.');
      }

      const productsById = new Map(products.map((product) => [product.id, product]));
      const lines = items.map((item) => {
        const product = productsById.get(item.productId);
        if (product.stock < quantityByProduct.get(item.productId)) {
          throw invalidRequest(`Estoque insuficiente para "${product.name}".`);
        }

        const selectedOptions = {};
        for (const option of product.options ?? []) {
          const selected = item.options[option.title];
          const values = option.values.split(',').map((value) => value.trim()).filter(Boolean);
          if (selected === undefined || !values.includes(String(selected))) {
            throw invalidRequest(`Selecione uma opção válida de ${option.title} para "${product.name}".`);
          }
          selectedOptions[option.title] = String(selected);
        }

        const priceCents = toCents(product.price_with_discount) > 0
          ? toCents(product.price_with_discount)
          : toCents(product.price);
        return {
          product,
          quantity: item.quantity,
          selectedOptions,
          unitPriceCents: priceCents,
          lineTotalCents: priceCents * item.quantity,
        };
      });

      const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
      const totalCents = subtotalCents + shipping.priceCents;
      const status = {
        approved: 'paid',
        pending: 'pending_payment',
        rejected: 'payment_failed',
      }[paymentScenario];
      const order = await Order.create({
        user_id: Number(req.auth.sub),
        status,
        payment_method: paymentMethod,
        payment_scenario: paymentScenario,
        postal_code: postalCode,
        shipping_address: address,
        subtotal: fromCents(subtotalCents),
        shipping_cost: fromCents(shipping.priceCents),
        total: fromCents(totalCents),
      }, { transaction });
      orderId = order.id;

      await OrderItem.bulkCreate(lines.map((line) => ({
        order_id: order.id,
        product_id: line.product.id,
        product_name: line.product.name,
        product_image: line.product.images?.find((image) => image.enabled)?.path ?? '',
        unit_price: fromCents(line.unitPriceCents),
        quantity: line.quantity,
        line_total: fromCents(line.lineTotalCents),
        selected_options: line.selectedOptions,
      })), { transaction });

      if (paymentScenario === 'approved') {
        for (const [productId, quantity] of quantityByProduct) {
          const product = productsById.get(productId);
          await product.update({ stock: product.stock - quantity }, { transaction });
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    const created = await Order.findByPk(orderId, { include: [{ model: OrderItem, as: 'items' }] });
    return res.status(201).json({
      order: serializeOrder(created),
      message: {
        approved: 'Pagamento de teste aprovado. Nenhuma cobrança real foi realizada.',
        pending: 'Pedido de teste registrado como pagamento pendente. Nenhuma cobrança real foi realizada.',
        rejected: 'Pagamento de teste recusado. Nenhuma cobrança real foi realizada.',
      }[paymentScenario],
    });
  })
);

router.get(
  '/orders',
  requireAuth,
  asyncRoute(async (req, res) => {
    const orders = await Order.findAll({
      where: { user_id: Number(req.auth.sub) },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
    });
    return res.json(orders.map(serializeOrder));
  })
);

router.get(
  '/orders/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: Number(req.auth.sub) },
      include: [{ model: OrderItem, as: 'items' }],
    });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado.' });
    return res.json(serializeOrder(order));
  })
);

export default router;
