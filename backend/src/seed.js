import 'dotenv/config';
import { sequelize } from './database.js';
import { Category, Product, ProductImage, ProductOption } from './models.js';

const categories = [
  { name: 'Esporte e lazer', slug: 'esporte', use_in_menu: true },
  { name: 'Casual', slug: 'casual', use_in_menu: true },
  { name: 'Corrida', slug: 'corrida', use_in_menu: true },
];

const products = [
  { name: 'K-Swiss V8 - Masculino', slug: 'k-swiss-v8-masculino', price: 200, price_with_discount: 100, brand: 'k-swiss', category: 'esporte', gender: 'masculino', state: 'novo', image: '/product-thumb-1.jpeg' },
  { name: 'Nike Air Max 270', slug: 'nike-air-max-270', price: 649.9, brand: 'nike', category: 'casual', gender: 'unisex', state: 'novo', image: '/product-thumb-2.jpeg' },
  { name: 'Adidas Ultraboost Light', slug: 'adidas-ultraboost-light', price: 799.9, price_with_discount: 599.9, brand: 'adidas', category: 'corrida', gender: 'feminino', state: 'novo', image: '/product-thumb-3.jpeg' },
  { name: 'Puma RS-X Efekt', slug: 'puma-rs-x-efekt', price: 499.9, brand: 'puma', category: 'casual', gender: 'masculino', state: 'usado', image: '/product-thumb-4.jpeg' },
  { name: 'Nike Pegasus 40', slug: 'nike-pegasus-40', price: 699.9, price_with_discount: 549.9, brand: 'nike', category: 'corrida', gender: 'unisex', state: 'novo', image: '/product-thumb-5.jpeg' },
  { name: 'Adidas Samba OG', slug: 'adidas-samba-og', price: 549.9, brand: 'adidas', category: 'casual', gender: 'feminino', state: 'novo', image: '/product-thumb-1.jpeg' },
  { name: 'K-Swiss Classic 88', slug: 'k-swiss-classic-88', price: 329.9, price_with_discount: 249.9, brand: 'k-swiss', category: 'casual', gender: 'masculino', state: 'usado', image: '/product-thumb-2.jpeg' },
  { name: 'Puma Suede Classic', slug: 'puma-suede-classic', price: 399.9, brand: 'puma', category: 'esporte', gender: 'unisex', state: 'novo', image: '/product-thumb-3.jpeg' },
  { name: 'Nike Revolution 7', slug: 'nike-revolution-7', price: 299.9, price_with_discount: 229.9, brand: 'nike', category: 'esporte', gender: 'feminino', state: 'novo', image: '/product-thumb-4.jpeg' },
  { name: 'Adidas Runfalcon 3', slug: 'adidas-runfalcon-3', price: 259.9, brand: 'adidas', category: 'corrida', gender: 'masculino', state: 'usado', image: '/product-thumb-5.jpeg' },
];

try {
  await sequelize.authenticate();
  await sequelize.sync();
  const categoryBySlug = new Map();
  for (const data of categories) {
    const [category] = await Category.findOrCreate({ where: { slug: data.slug }, defaults: data });
    categoryBySlug.set(data.slug, category);
  }

  for (const data of products) {
    const [product] = await Product.findOrCreate({
      where: { slug: data.slug },
      defaults: {
        enabled: true,
        name: data.name,
        slug: data.slug,
        use_in_menu: false,
        stock: 20,
        description: `${data.name}. Conforto e estilo para acompanhar sua rotina.`,
        price: data.price,
        price_with_discount: data.price_with_discount ?? 0,
        brand: data.brand,
        gender: data.gender,
        state: data.state,
      },
    });
    await product.setCategories([categoryBySlug.get(data.category)]);
    await ProductImage.findOrCreate({
      where: { product_id: product.id, path: data.image },
      defaults: { enabled: true, product_id: product.id, path: data.image },
    });
    if (!(await ProductOption.count({ where: { product_id: product.id } }))) {
      await ProductOption.bulkCreate([
        { product_id: product.id, title: 'Tamanho', shape: 'square', radius: 4, type: 'text', values: '39,40,41,42,43' },
        { product_id: product.id, title: 'Cor', shape: 'circle', radius: 0, type: 'color', values: '#6FEEFF,#FF6969,#5E5E5E,#6D70B7' },
      ]);
    }
  }
  console.log(`Seed concluído: ${categories.length} categorias e ${products.length} produtos disponíveis.`);
} catch (error) {
  console.error('Não foi possível popular o banco de dados.', error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
