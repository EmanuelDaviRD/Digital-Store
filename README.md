# Drip Store

# projeto_Digital-Store_1

Loja virtual demonstrativa construída com React e Vite no frontend e Express,
Sequelize e MySQL na API. A interface se adapta automaticamente a telas desktop,
tablet e celular.

## Requisitos

- Node.js 20 ou superior
- MySQL 8 ou compatível

## Configuração

### Banco de dados e API

1. Crie um banco MySQL chamado `drip_store`.
2. Copie `backend/.env.example` para `backend/.env` e configure a conexão com o
   banco. Defina também um `JWT_SECRET` longo, aleatório e exclusivo.
3. No terminal, instale as dependências, carregue os dados de demonstração e
   inicie a API:

```sh
cd backend
npm install
npm run seed
npm run dev
```

A API inicia, por padrão, em `http://localhost:3001`. O Sequelize cria as tabelas
na primeira execução. O seed é idempotente e pode ser executado novamente.

### Frontend

Em outro terminal, na raiz do projeto:

```sh
npm install
npm run dev
```

Abra o endereço informado pelo Vite, normalmente `http://localhost:5173`.
O Vite encaminha as chamadas `/v1` e `/uploads` para a API local. Para apontar
para outra API, defina `VITE_API_URL` antes de iniciar o frontend.

Se a API estiver indisponível, a interface continua funcionando com o catálogo
local de demonstração e exibe um aviso sobre a conexão.

**Não consegue criar uma conta?** Cadastro e login precisam da API e do MySQL
ativos. Confirme que `backend/.env` existe e contém os dados corretos do banco,
que o serviço MySQL está em execução e que `npm run dev` foi iniciado dentro de
`backend`. A API deve responder em `http://localhost:3001/health`; sem banco
configurado, a API não inicia e não é possível registrar usuários.

## Interface adaptável

O layout usa o tamanho da janela para ajustar automaticamente o conteúdo, sem
seletor de modo:

- **Desktop:** carrossel em duas colunas, coleções lado a lado, navegação completa
  e grade de produtos com até quatro colunas.
- **Tablet:** conteúdo e cards se redimensionam; os filtros do catálogo ficam
  acima dos resultados quando o espaço horizontal é menor.
- **Celular:** carrossel empilhado, coleções em coluna, categorias em grade e
  produtos em duas colunas.

## Funcionalidades

- Home com carrossel promocional, coleções, categorias em destaque, produtos e
  faixa promocional.
- Catálogo com busca por nome, marca, categoria ou gênero, filtros e ordenação
  por preço.
- Detalhes de produto, seleção de opções e carrinho persistido no navegador.
- Cadastro e login com JWT.
- Checkout autenticado com endereço de entrega e cotação demonstrativa de frete por CEP.
- Criação e consulta de pedidos, incluindo histórico por usuário.
- Comprovante demonstrativo de pedidos aprovados, imprimível ou salvável como PDF, sem validade fiscal.
- Pagamentos simulados com cenários aprovado, pendente ou recusado. Nenhuma cobrança real é feita.
- API com operações autenticadas para usuários, categorias, produtos, cotações e pedidos.
- Upload de imagens JPEG, PNG e WebP de até 5 MB, além de imagens por URL.

O frete é apenas uma estimativa local por faixa do CEP, sem consulta aos Correios
ou a outro provedor. Para aceitar pagamentos reais, ainda é necessário integrar
um gateway de pagamento. A interface administrativa não faz parte desta
implementação.

Pedidos aprovados exibem a opção **Comprovante de venda** no histórico. Na tela
do comprovante, use **Imprimir / salvar como PDF** e escolha “Salvar como PDF”
na janela de impressão do navegador. Esse documento é apenas demonstrativo,
não é NF-e/NFC-e e não tem validade fiscal.

Para comprar, faça login ou crie uma conta, adicione produtos ao carrinho e
acesse o checkout. A cotação e os pedidos exigem o token JWT e estão disponíveis
em `POST /v1/shipping/quote`, `POST /v1/orders`, `GET /v1/orders` e
`GET /v1/orders/:id`. O checkout só limpa o carrinho após um pedido aprovado;
cenários pendentes ou recusados permanecem no histórico e mantêm os itens no
carrinho.

## Build e testes

Para gerar a versão de produção do frontend:

```sh
npm run build
npm run preview
```

Para executar os testes da API:

```sh
cd backend
npm test
```
