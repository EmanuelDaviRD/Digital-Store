import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from './Layout';
import Section from '../components/Section';
import ProductListing from '../components/ProductListing';
import FilterGroup from '../components/FilterGroup';
import { products, filterOptions } from '../data/products';
import { fetchProducts } from '../services/api';
import './ProductListingPage.css';

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function ProductListingPage() {
  const [params] = useSearchParams();
  const query = params.get('filter') ?? '';

  const [sort, setSort] = useState('');
  const [filters, setFilters] = useState({ brand: [], category: [], gender: [], state: [] });
  const [catalog, setCatalog] = useState(products);
  const [catalogError, setCatalogError] = useState('');

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((items) => { if (active) setCatalog(items); })
      .catch((error) => { if (active) setCatalogError(error.message); });
    return () => { active = false; };
  }, []);

  const toggle = (key, inputType) => (value, checked) =>
    setFilters((prev) => ({
      ...prev,
      [key]: inputType === 'radio' ? [value] : checked ? [...prev[key], value] : prev[key].filter((v) => v !== value),
    }));

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    const list = catalog.filter(
      (p) =>
        (!q ||
          normalize(p.name).includes(q) ||
          normalize(p.brand).includes(q) ||
          normalize(p.category).includes(q) ||
          normalize(p.gender).includes(q)) &&
        Object.entries(filters).every(([key, values]) => values.length === 0 || values.includes(p[key]))
    );
    const unitPrice = (p) => p.priceDiscount ?? p.price;
    if (sort === 'asc') return [...list].sort((a, b) => unitPrice(a) - unitPrice(b));
    if (sort === 'desc') return [...list].sort((a, b) => unitPrice(b) - unitPrice(a));
    return list;
  }, [catalog, query, filters, sort]);

  const title = `${visible.length} ${visible.length === 1 ? 'produto encontrado' : 'produtos encontrados'}${
    query ? ` para "${query}"` : ''
  }`;

  return (
    <Layout>
      <div className="container listing-page">
        <aside className="listing-page__sidebar">
          <label className="listing-page__sort">
            <span>Ordenar por</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="">Selecione</option>
              <option value="asc">Menor preço</option>
              <option value="desc">Maior preço</option>
            </select>
          </label>

          <div className="listing-page__filters">
            <h3>Filtrar por</h3>
            <hr />
            <FilterGroup title="Marca" inputType="checkbox" options={filterOptions.brand} selected={filters.brand} onChange={toggle('brand', 'checkbox')} />
            <FilterGroup title="Categoria" inputType="checkbox" options={filterOptions.category} selected={filters.category} onChange={toggle('category', 'checkbox')} />
            <FilterGroup title="Gênero" inputType="checkbox" options={filterOptions.gender} selected={filters.gender} onChange={toggle('gender', 'checkbox')} />
            <FilterGroup title="Estado" inputType="radio" options={filterOptions.state} selected={filters.state} onChange={toggle('state', 'radio')} />
          </div>
          {catalogError && <p className="catalog-notice" role="status">Catálogo de demonstração: a API não está disponível ({catalogError}).</p>}
        </aside>

        <div className="listing-page__results">
          <Section title={title} titleAlign="left">
            {visible.length ? (
              <ProductListing products={visible} columns={3} />
            ) : (
              <p>Nenhum produto corresponde aos filtros. Remova algum filtro ou tente outra busca.</p>
            )}
          </Section>
        </div>
      </div>
    </Layout>
  );
}
