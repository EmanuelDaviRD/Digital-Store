import { Op } from 'sequelize';
import { Router } from 'express';
import { Category, Product, ProductCategory, ProductImage, ProductOption, productIncludes } from '../models.js';
import { sequelize } from '../database.js';
import { asyncRoute, invalidRequest, requireAuth } from '../middleware.js';
import { saveImage } from '../image-storage.js';

const router = Router();
const allowedFields = new Set([
  'id', 'enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description', 'price',
  'price_with_discount', 'brand', 'gender', 'state', 'category_ids', 'images', 'options', 'created_at', 'updated_at',
]);
const scalarFields = ['enabled', 'name', 'slug', 'use_in_menu', 'stock', 'description', 'price', 'price_with_discount', 'brand', 'gender', 'state'];

function parsePagination(query) {
  const limit = query.limit === undefined ? 12 : Number(query.limit);
  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isInteger(limit) || (limit !== -1 && (limit < 1 || limit > 100))) {
    throw invalidRequest('O parâmetro limit deve ser -1 ou um inteiro entre 1 e 100.');
  }
  if (!Number.isInteger(page) || page < 1) throw invalidRequest('O parâmetro page deve ser um inteiro positivo.');
  return { limit, page, offset: limit === -1 ? undefined : (page - 1) * limit };
}

function serializeProduct(product, fields) {
  const result = product.get({ plain: true });
  result.category_ids = (result.categories ?? []).map((category) => category.id);
  result.category = result.categories?.[0]?.slug ?? '';
  result.images = (result.images ?? []).map(({ id, path, enabled }) => ({ id, enabled, content: path }));
  result.options = (result.options ?? []).map((option) => ({
    ...option,
    values: option.values.split(',').map((value) => value.trim()).filter(Boolean),
  }));
  delete result.categories;
  if (fields) return Object.fromEntries(Object.entries(result).filter(([key]) => fields.includes(key)));
  return result;
}

function validateProduct(body) {
  if (![body.name, body.slug].every((value) => typeof value === 'string' && value.trim())) {
    throw invalidRequest('Nome e slug do produto são obrigatórios.');
  }
  if (!Number.isFinite(Number(body.price)) || Number(body.price) < 0) throw invalidRequest('Informe um preço válido.');
  if (body.price_with_discount !== undefined && (!Number.isFinite(Number(body.price_with_discount)) || Number(body.price_with_discount) < 0)) {
    throw invalidRequest('Informe um preço promocional válido.');
  }
  if (body.stock !== undefined && (!Number.isInteger(Number(body.stock)) || Number(body.stock) < 0)) {
    throw invalidRequest('O estoque deve ser um inteiro igual ou maior que zero.');
  }
  if (body.category_ids !== undefined && (!Array.isArray(body.category_ids) || body.category_ids.some((id) => !Number.isInteger(Number(id))))) {
    throw invalidRequest('category_ids deve ser uma lista de IDs válidos.');
  }
  if (body.options !== undefined && !Array.isArray(body.options)) throw invalidRequest('options deve ser uma lista.');
  if (body.images !== undefined && !Array.isArray(body.images)) throw invalidRequest('images deve ser uma lista.');
}

async function writeImages(product, images, transaction, replacing) {
  if (!images) return;
  const current = replacing ? await ProductImage.findAll({ where: { product_id: product.id }, transaction }) : [];
  const currentById = new Map(current.map((image) => [image.id, image]));
  const kept = new Set();

  for (const image of images) {
    if (image.id && currentById.has(Number(image.id))) {
      const existing = currentById.get(Number(image.id));
      if (image.deleted) {
        await existing.destroy({ transaction });
        continue;
      }
      if (image.content) existing.path = await saveImage(image);
      existing.enabled = image.enabled ?? true;
      await existing.save({ transaction });
      kept.add(existing.id);
      continue;
    }
    if (image.deleted) continue;
    const path = await saveImage(image);
    const created = await ProductImage.create(
      { product_id: product.id, path, enabled: image.enabled ?? true },
      { transaction }
    );
    kept.add(created.id);
  }

  if (replacing) {
    for (const image of current) {
      if (!kept.has(image.id)) await image.destroy({ transaction });
    }
  }
}

async function writeOptions(product, options, transaction, replacing) {
  if (!options) return;
  const current = replacing ? await ProductOption.findAll({ where: { product_id: product.id }, transaction }) : [];
  const currentById = new Map(current.map((option) => [option.id, option]));
  const kept = new Set();

  for (const option of options) {
    if (option.id && currentById.has(Number(option.id))) {
      const existing = currentById.get(Number(option.id));
      if (option.deleted) {
        await existing.destroy({ transaction });
        continue;
      }
      const values = option.values ?? option.value ?? existing.values.split(',');
      existing.set({
        title: option.title ?? existing.title,
        shape: option.shape ?? existing.shape,
        radius: Number.parseInt(option.radius ?? existing.radius, 10) || 0,
        type: option.type ?? existing.type,
        values: Array.isArray(values) ? values.join(',') : String(values),
      });
      await existing.save({ transaction });
      kept.add(existing.id);
      continue;
    }
    if (option.deleted) continue;
    const values = option.values ?? option.value;
    if (!option.title || !Array.isArray(values) || values.length === 0) {
      throw invalidRequest('Cada opção precisa de título e ao menos um valor.');
    }
    const created = await ProductOption.create(
      {
        product_id: product.id,
        title: option.title,
        shape: option.shape ?? 'square',
        radius: Number.parseInt(option.radius, 10) || 0,
        type: option.type ?? 'text',
        values: values.join(','),
      },
      { transaction }
    );
    kept.add(created.id);
  }

  if (replacing) {
    for (const option of current) {
      if (!kept.has(option.id)) await option.destroy({ transaction });
    }
  }
}

async function setCategories(product, categoryIds, transaction) {
  if (categoryIds === undefined) return;
  const ids = [...new Set(categoryIds.map(Number))];
  const categories = await Category.findAll({ where: { id: ids }, transaction });
  if (categories.length !== ids.length) throw invalidRequest('Uma ou mais categorias informadas não existem.');
  await product.setCategories(categories, { transaction });
}

router.get(
  '/product/search',
  asyncRoute(async (req, res) => {
    const { limit, page, offset } = parsePagination(req.query);
    const fields = req.query.fields?.split(',').map((field) => field.trim()).filter(Boolean);
    if (fields?.some((field) => !allowedFields.has(field))) throw invalidRequest('O parâmetro fields contém campos inválidos.');

    const where = { enabled: true };
    if (req.query.match !== undefined) {
      const term = String(req.query.match).trim();
      if (term) where[Op.or] = [{ name: { [Op.like]: `%${term}%` } }, { description: { [Op.like]: `%${term}%` } }];
    }
    if (req.query['price-range']) {
      const match = String(req.query['price-range']).match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
      if (!match || Number(match[1]) > Number(match[2])) throw invalidRequest('price-range deve seguir o formato mínimo-máximo.');
      where.price = { [Op.between]: [Number(match[1]), Number(match[2])] };
    }

    const categoryIds = String(req.query.category_ids ?? '')
      .split(',').map((id) => id.trim()).filter(Boolean).map(Number);
    if (categoryIds.some((id) => !Number.isInteger(id) || id < 1)) throw invalidRequest('category_ids contém IDs inválidos.');

    const optionParams = req.query.option && typeof req.query.option === 'object' ? req.query.option : {};
    const optionFilters = Object.entries(optionParams);
    const include = productIncludes.map((association) => ({ ...association }));
    if (categoryIds.length) {
      const categoryInclude = include.find((item) => item.as === 'categories');
      categoryInclude.where = { id: { [Op.in]: categoryIds } };
      categoryInclude.required = true;
    }
    if (optionFilters.length) {
      let matchingProductIds;
      for (const [id, values] of optionFilters) {
        const optionId = Number(id);
        if (!Number.isInteger(optionId) || optionId < 1) throw invalidRequest('O ID de uma opção de produto é inválido.');
        const optionValues = String(values).split(',').map((value) => value.trim()).filter(Boolean);
        const options = await ProductOption.findAll({ where: { id: optionId } });
        const matchedIds = options
          .filter((option) => optionValues.some((value) => option.values.split(',').map((item) => item.trim()).includes(value)))
          .map((option) => option.product_id);
        matchingProductIds = matchingProductIds === undefined
          ? matchedIds
          : matchingProductIds.filter((productId) => matchedIds.includes(productId));
      }
      where.id = { [Op.in]: matchingProductIds ?? [] };
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      include,
      distinct: true,
      ...(limit === -1 ? {} : { limit, offset }),
      order: [['id', 'ASC']],
    });
    return res.json({ data: rows.map((product) => serializeProduct(product, fields)), total: count, limit, page });
  })
);

router.get(
  '/product/:id',
  asyncRoute(async (req, res) => {
    const product = await Product.findByPk(req.params.id, { include: productIncludes });
    if (!product || !product.enabled) return res.status(404).json({ message: 'Produto não encontrado.' });
    return res.json(serializeProduct(product));
  })
);

router.post(
  '/product',
  requireAuth,
  asyncRoute(async (req, res) => {
    validateProduct(req.body);
    const transaction = await sequelize.transaction();
    try {
      const product = await Product.create(
        {
          enabled: req.body.enabled ?? true,
          name: req.body.name.trim(),
          slug: req.body.slug.trim(),
          use_in_menu: req.body.use_in_menu ?? false,
          stock: req.body.stock ?? 0,
          description: req.body.description ?? null,
          price: Number(req.body.price),
          price_with_discount: Number(req.body.price_with_discount ?? 0),
          brand: req.body.brand ?? null,
          gender: req.body.gender ?? null,
          state: req.body.state ?? 'novo',
        },
        { transaction }
      );
      await setCategories(product, req.body.category_ids, transaction);
      await writeImages(product, req.body.images, transaction, false);
      await writeOptions(product, req.body.options, transaction, false);
      await transaction.commit();
      const created = await Product.findByPk(product.id, { include: productIncludes });
      return res.status(201).json(serializeProduct(created));
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  })
);

router.put(
  '/product/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    validateProduct(req.body);
    const product = await Product.findByPk(req.params.id, { include: productIncludes });
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    const transaction = await sequelize.transaction();
    try {
      const updates = Object.fromEntries(scalarFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
      if (updates.name) updates.name = updates.name.trim();
      if (updates.slug) updates.slug = updates.slug.trim();
      if (updates.price !== undefined) updates.price = Number(updates.price);
      if (updates.price_with_discount !== undefined) updates.price_with_discount = Number(updates.price_with_discount);
      await product.update(updates, { transaction });
      await setCategories(product, req.body.category_ids, transaction);
      await writeImages(product, req.body.images, transaction, true);
      await writeOptions(product, req.body.options, transaction, true);
      await transaction.commit();
      return res.status(204).end();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  })
);

router.delete(
  '/product/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Produto não encontrado.' });
    await product.destroy();
    await ProductCategory.destroy({ where: { product_id: product.id } });
    return res.status(204).end();
  })
);

export default router;
