import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Router } from 'express';
import { User } from '../models.js';
import { asyncRoute, invalidRequest, requireAuth } from '../middleware.js';

const router = Router();
const publicUser = (user) => ({
  id: user.id,
  firstname: user.firstname,
  surname: user.surname,
  email: user.email,
});

router.post(
  '/user',
  asyncRoute(async (req, res) => {
    const { firstname, surname, email, password, confirmPassword } = req.body;
    if (![firstname, surname, email, password, confirmPassword].every((value) => typeof value === 'string' && value.trim())) {
      throw invalidRequest('Informe nome, sobrenome, e-mail, senha e confirmação da senha.');
    }
    if (password !== confirmPassword) throw invalidRequest('A confirmação da senha não confere.');
    if (password.length < 8) throw invalidRequest('A senha deve conter pelo menos 8 caracteres.');

    const user = await User.create({ firstname: firstname.trim(), surname: surname.trim(), email: email.trim().toLowerCase(), password });
    return res.status(201).json(publicUser(user));
  })
);

router.post(
  '/user/token',
  asyncRoute(async (req, res) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!email || !password) throw invalidRequest('Informe e-mail e senha.');

    const user = await User.unscoped().findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '12h' });
    return res.json({ token, user: publicUser(user) });
  })
);

router.get(
  '/user/:id',
  asyncRoute(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    return res.json(publicUser(user));
  })
);

router.put(
  '/user/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    if (Number(req.auth.sub) !== Number(req.params.id)) {
      return res.status(403).json({ message: 'Você não pode atualizar este usuário.' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

    const { firstname, surname, email } = req.body;
    if (![firstname, surname, email].every((value) => typeof value === 'string' && value.trim())) {
      throw invalidRequest('Nome, sobrenome e e-mail são obrigatórios.');
    }
    await user.update({ firstname: firstname.trim(), surname: surname.trim(), email: email.trim().toLowerCase() });
    return res.status(204).end();
  })
);

router.delete(
  '/user/:id',
  requireAuth,
  asyncRoute(async (req, res) => {
    if (Number(req.auth.sub) !== Number(req.params.id)) {
      return res.status(403).json({ message: 'Você não pode excluir este usuário.' });
    }
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
    await user.destroy();
    return res.status(204).end();
  })
);

export default router;
