import 'dotenv/config';
import app from './app.js';
import { sequelize } from './database.js';

const port = Number(process.env.API_PORT ?? 3001);

try {
  await sequelize.authenticate();
  await sequelize.sync();
  app.listen(port, () => console.log(`Drip Store API disponível em http://localhost:${port}`));
} catch (error) {
  console.error('Não foi possível iniciar a API. Confira as variáveis do banco de dados e sua disponibilidade.', error);
  process.exitCode = 1;
}
