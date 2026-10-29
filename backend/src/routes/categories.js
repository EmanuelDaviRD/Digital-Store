import { Router } from 'express';
import { Category } from '../models.js';
import { asyncRoute, invalidRequest, requireAuth } from '../middleware.js';

const router = Router();
const selectableFields = new Set(['id', 'name', 'slug', 'use_in_menu', 'created_at', 'updated_at']);

function pagination(query) {
  const limit = query.limit === undefined ? 12 : Number(query.limit);
  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isInteger(limit) || (limit !== -1 && (limit < 1 || limit > 100))) {
    throw invalidRequest('O parâmetro limit deve ser -1 ou um inteiro entre 1 e 100.');
  }
  if (!Number.isInteger(page) || page < 1) throw invalidRequest('O parâmetro page deve ser um inteiro positivo.');
  return { limit, page, offset: limit === -1 ? undefined : (page - 1) * limit };
}

router.get(
  '/category/search',
  asyncRoute(async (req, res) => {
    const { limit, page, offset } = pagination(req.query);
    const fields = req.query.fields?.split(',').map((field) => field.trim()).filter(Boolean);
    if (fields?.some((field) => !selectableFields.has(field))) throw invalidRequest('O parâmetro fields contém campos inválidos.');

    const where = {};
    if (req.query.use_in_menu !== undefined) {
      if (!['true', 'false'].includes(req.query.use_in_menu)) throw invalidRequest('use_in_menu deve ser true ou false.');
      where.use_in_menu = req.query.use_in_menu === 'true';
    }

    const { rows, count } = await Category.findAndCountAll({
      where,
      ...(fields ? { attributes: fields } : {}),
      ...(limit === -1 ? {} : { limit, offset }),
      order: [['id', 'ASC']],
    });
    return res.json({ data: rows, total: count, limit, page });
  })
);

router.get(
  '/category/:id',
  asyncRoute(async (req, res) => {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada.' });
    return res.json(category);
  })
);

router.post(
  '/category',
  requireAuth,
  asyncRoute(async (req, res) => {
    const { name, slug, use_in_menu = false } = req.body;
    if (![name, slug].every((value) => typeof value === 'string' && value.trim())) {
      throw invalidRequest('Nome e slug da categoria são obrigatórios.');
    }
    if (typeof use_in_menu !== 'boolean') throw invalidRequest('use_in_menu deve ser booleano.');
    const category = await Category.create({ name: name.trim(), slug: slug.trim(), use_in_menu });
    return res.status(201).json(category);
  })
);

router.put(
  '/category/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada.' });
    const { name, slug, use_in_menu } = req.body;
    if (![name, slug].every((value) => typeof value === 'string' && value.trim())) {
      throw invalidRequest('Nome e slug da categoria são obrigatórios.');
    }
    if (typeof use_in_menu !== 'boolean') throw invalidRequest('use_in_menu deve ser booleano.');
    await category.update({ name: name.trim(), slug: slug.trim(), use_in_menu });
    return res.status(204).end();
  })
);

router.delete(
  '/category/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Categoria não encontrada.' });
    await category.destroy();
    return res.status(204).end();
  })
);

export default router;
