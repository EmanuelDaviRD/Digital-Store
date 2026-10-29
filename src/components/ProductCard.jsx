import { Link } from 'react-router-dom';
import { formatPrice } from '../data/products';
import './ProductCard.css';

export default function ProductCard({ id, image, name, price, priceDiscount }) {
  const content = (
    <>
      <div className="product-card__image">
        <img src={image} alt={name} width={292} height={321} />
      </div>
      <h3 className="product-card__name">{name}</h3>
      <div className="product-card__prices">
        {priceDiscount ? (
          <>
            <span className="product-card__price product-card__price--old">{formatPrice(price)}</span>
            <span className="product-card__price">{formatPrice(priceDiscount)}</span>
          </>
        ) : (
          <span className="product-card__price">{formatPrice(price)}</span>
        )}
      </div>
    </>
  );

  return id ? (
    <Link to={`/product/${id}`} className="product-card">{content}</Link>
  ) : (
    <div className="product-card">{content}</div>
  );
}
