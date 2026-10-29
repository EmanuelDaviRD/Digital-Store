import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import HomeHeroCarousel from '../components/HomeHeroCarousel';
import Section from '../components/Section';
import ProductListing from '../components/ProductListing';
import { products } from '../data/products';
import { fetchProducts } from '../services/api';
import './HomePage.css';

const collections = ['/collection-1.png', '/collection-2.png', '/collection-3.png'];
const featuredCategories = [
  { label: 'Esporte e lazer', filter: 'esporte', icon: 'sport' },
  { label: 'Casual', filter: 'casual', icon: 'casual' },
  { label: 'Corrida', filter: 'corrida', icon: 'run' },
  { label: 'Masculino', filter: 'masculino', icon: 'person' },
  { label: 'Feminino', filter: 'feminino', icon: 'person' },
];

function CategoryIcon({ type }) {
  const paths = {
    sport: <><path d="M4 16.5 8.5 12l3-5 3 2 2.5 4 3 1.5v3H4z" /><path d="M9 12h5m-7 3h11" /></>,
    casual: <><path d="M4 16.5 8.5 12l3-5 3 2 2.5 4 3 1.5v3H4z" /><path d="m10 10 4 2m-7 4h12" /></>,
    run: <><circle cx="15.5" cy="5" r="1.5" /><path d="m13 9 3-1 2 3-3 2-2-3-3 3-3-1-3 5h7l4-4 4 2 2 3" /></>,
    person: <><circle cx="12" cy="7" r="3" /><path d="M6 20v-2a6 6 0 0 1 12 0v2" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {paths[type]}
    </svg>
  );
}

export default function HomePage() {
  const [catalog, setCatalog] = useState(products);
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((items) => { if (active) setCatalog(items); })
      .catch((error) => { if (active) setCatalogError(error.message); });
    return () => { active = false; };
  }, []);

  return (
    <Layout>
      <HomeHeroCarousel />

      <div className="container">
        <Section title="Coleções em destaque" titleAlign="center">
          <div className="home-collections">
            {collections.map((src, i) => (
              <img key={src} src={src} alt={`Coleção em destaque ${i + 1}`} />
            ))}
          </div>
        </Section>

        <Section title="Categorias em destaque" titleAlign="center">
          <nav className="home-categories" aria-label="Categorias em destaque">
            {featuredCategories.map(({ label, filter, icon }) => (
              <Link className="home-category" key={label} to={`/products?filter=${filter}`}>
                <span className="home-category__icon"><CategoryIcon type={icon} /></span>
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </Section>

        <Section
          title="Produtos em alta"
          titleAlign="left"
          link={{ text: 'Ver todos →', href: '/products' }}
        >
          {catalogError && <p className="catalog-notice" role="status">Catálogo de demonstração: a API não está disponível ({catalogError}).</p>}
          <ProductListing products={catalog.slice(0, 8)} />
        </Section>

        <section className="home-promo" aria-labelledby="home-promo-title">
          <div className="home-promo__visual">
            <img src="/produc-image-1.jpeg" alt="Tênis esportivo de coleção em destaque" />
          </div>
          <div className="home-promo__copy">
            <p className="home-promo__eyebrow">Oferta especial</p>
            <h2 id="home-promo-title">Air Jordan edição de colecionador</h2>
            <p>Modelos icônicos para quem busca estilo e exclusividade.</p>
            <Link to="/products?filter=nike" className="home-promo__cta">Ver Coleção</Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
