import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from './Layout';
import Gallery from '../components/Gallery';
import BuyBox from '../components/BuyBox';
import ProductOptions from '../components/ProductOptions';
import Section from '../components/Section';
import ProductListing from '../components/ProductListing';
import { products, productImages } from '../data/products';
import { fetchProduct, fetchProducts } from '../services/api';
import { useStore } from '../context/StoreContext';
import './ProductViewPage.css';

const defaultOptions = [
  { title: 'Tamanho', type: 'text', shape: 'square', values: ['39', '40', '41', '42', '43'] },
  { title: 'Cor', type: 'color', shape: 'circle', values: ['#6FEEFF', '#FF6969', '#5E5E5E', '#6D70B7'] },
];
const fallbackDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

export default function ProductViewPage() {
  const { id } = useParams();
  const { addToCart } = useStore();
  const fallback = products.find((item) => String(item.id) === id) ?? products[0];
  const [product, setProduct] = useState(fallback);
  const [recommended, setRecommended] = useState(products.filter((item) => item.id !== fallback.id).slice(0, 4));
  const [selectedOptions, setSelectedOptions] = useState({});
  const [catalogError, setCatalogError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;
    setCatalogError('');
    setAdded(false);
    fetchProduct(id)
      .then((item) => { if (active) setProduct(item); })
      .catch((error) => {
        if (active) {
          setProduct(fallback);
          setCatalogError(error.message);
        }
      });
    fetchProducts()
      .then((items) => {
        if (active) setRecommended(items.filter((item) => String(item.id) !== id).slice(0, 4));
      })
      .catch((error) => { if (active) setCatalogError(error.message); });
    return () => { active = false; };
  }, [id]);

  const options = useMemo(
    () => product.options?.length
      ? product.options.map((option) => ({
          ...option,
          values: Array.isArray(option.values) ? option.values : String(option.values).split(','),
        }))
      : defaultOptions,
    [product]
  );

  useEffect(() => {
    setSelectedOptions(Object.fromEntries(options.map((option) => [option.title, option.values[0]])));
  }, [options]);

  const images = product.images?.length
    ? product.images.filter((image) => image.enabled !== false).map((image) => ({ src: image.content }))
    : product === fallback ? productImages : product.image ? [{ src: product.image }] : productImages;

  const addProduct = () => {
    const size = options.find((option) => option.type === 'text');
    const color = options.find((option) => option.type === 'color');
    addToCart(product, {
      size: size ? selectedOptions[size.title] : undefined,
      color: color ? selectedOptions[color.title] : undefined,
      selectedOptions,
    });
    setAdded(true);
  };

  return (
    <Layout>
      <div className="container product-view">
        {catalogError && <p className="catalog-notice" role="status">Exibindo dados de demonstração: {catalogError}</p>}
        <div className="product-view__main">
          <Gallery images={images} showThumbs width="700px" height="570px" radius="4px" />

          <BuyBox
            name={product.name}
            reference={`Casual | ${product.brand ?? 'Drip Store'} | REF:${String(product.id).padStart(8, '0')}`}
            stars={4.7}
            rating={90}
            price={Number(product.price)}
            priceDiscount={Number(product.priceDiscount ?? product.price_with_discount) || undefined}
            description={product.description ?? fallbackDescription}
            onBuy={addProduct}
          >
            {options.map((option) => (
              <div className="product-view__option" key={option.id ?? option.title}>
                <h4>{option.title}</h4>
                <ProductOptions
                  options={option.values}
                  shape={option.shape}
                  radius={`${option.radius ?? 4}px`}
                  type={option.type}
                  selectedValue={selectedOptions[option.title]}
                  onChange={(value) => setSelectedOptions((current) => ({ ...current, [option.title]: value }))}
                />
              </div>
            ))}
            {added && <p className="product-view__added" role="status">Produto adicionado ao carrinho. <Link to="/cart">Ver carrinho</Link></p>}
          </BuyBox>
        </div>

        <Section title="Produtos recomendados" titleAlign="left" link={{ text: 'Ver todos', href: '/products' }}>
          <ProductListing products={recommended} />
        </Section>
      </div>
    </Layout>
  );
}
