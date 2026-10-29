const thumb = (n) => `/product-thumb-${n}.jpeg`;

export const products = [
  { id: 1, name: 'K-Swiss V8 - Masculino', image: thumb(1), price: 200, priceDiscount: 100, brand: 'k-swiss', category: 'esporte', gender: 'masculino', state: 'novo' },
  { id: 2, name: 'Nike Air Max 270', image: thumb(2), price: 649.9, brand: 'nike', category: 'casual', gender: 'unisex', state: 'novo' },
  { id: 3, name: 'Adidas Ultraboost Light', image: thumb(3), price: 799.9, priceDiscount: 599.9, brand: 'adidas', category: 'corrida', gender: 'feminino', state: 'novo' },
  { id: 4, name: 'Puma RS-X Efekt', image: thumb(4), price: 499.9, brand: 'puma', category: 'casual', gender: 'masculino', state: 'usado' },
  { id: 5, name: 'Nike Pegasus 40', image: thumb(5), price: 699.9, priceDiscount: 549.9, brand: 'nike', category: 'corrida', gender: 'unisex', state: 'novo' },
  { id: 6, name: 'Adidas Samba OG', image: thumb(1), price: 549.9, brand: 'adidas', category: 'casual', gender: 'feminino', state: 'novo' },
  { id: 7, name: 'K-Swiss Classic 88', image: thumb(2), price: 329.9, priceDiscount: 249.9, brand: 'k-swiss', category: 'casual', gender: 'masculino', state: 'usado' },
  { id: 8, name: 'Puma Suede Classic', image: thumb(3), price: 399.9, brand: 'puma', category: 'esporte', gender: 'unisex', state: 'novo' },
  { id: 9, name: 'Nike Revolution 7', image: thumb(4), price: 299.9, priceDiscount: 229.9, brand: 'nike', category: 'esporte', gender: 'feminino', state: 'novo' },
  { id: 10, name: 'Adidas Runfalcon 3', image: thumb(5), price: 259.9, brand: 'adidas', category: 'corrida', gender: 'masculino', state: 'usado' },
];

export const homeSlides = Array.from({ length: 8 }, (_, i) => ({ src: `/home-slide-${i + 1}.jpeg` }));

export const productImages = Array.from({ length: 5 }, (_, i) => ({ src: `/produc-image-${i + 1}.jpeg` }));

export const filterOptions = {
  brand: [
    { text: 'Adidas', value: 'adidas' },
    { text: 'K-Swiss', value: 'k-swiss' },
    { text: 'Nike', value: 'nike' },
    { text: 'Puma', value: 'puma' },
  ],
  category: [
    { text: 'Esporte e lazer', value: 'esporte' },
    { text: 'Casual', value: 'casual' },
    { text: 'Corrida', value: 'corrida' },
  ],
  gender: [
    { text: 'Masculino', value: 'masculino' },
    { text: 'Feminino', value: 'feminino' },
    { text: 'Unisex', value: 'unisex' },
  ],
  state: [
    { text: 'Novo', value: 'novo' },
    { text: 'Usado', value: 'usado' },
  ],
};

export const formatPrice = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
