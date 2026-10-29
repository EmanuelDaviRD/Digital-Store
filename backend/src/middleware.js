import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const authorization = req.get('authorization') ?? '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token de autenticação não enviado.' });
  }

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Token de autenticação inválido ou expirado.' });
  }
}

export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function notFound(req, res) {
  res.status(404).json({ message: `Rota não encontrada: ${req.method} ${req.path}` });
}

export function errorHandler(error, _req, res, _next) {
  if (error.name === 'SequelizeUniqueConstraintError' && error.errors?.some(({ path }) => path === 'email')) {
    return res.status(409).json({ message: 'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.' });
  }

  if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Dados inválidos.',
      errors: error.errors?.map(({ path, message }) => ({ field: path, message })) ?? [],
    });
  }

  if (error.type === 'INVALID_REQUEST') {
    return res.status(400).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: 'Erro interno do servidor.' });
}

export function invalidRequest(message) {
  return Object.assign(new Error(message), { type: 'INVALID_REQUEST' });
}
