import ProductCard from './ProductCard';
import './ProductListing.css';

export default function ProductListing({ products = [], columns = 4 }) {
  return (
    <div className="product-listing" style={{ '--cols': columns }}>
      {products.map((p) => (
        <ProductCard key={p.id ?? p.name} {...p} />
      ))}
    </div>
  );
}
