import { formatPrice } from '../data/products';
import starIcon from '../assets/star-icon.svg';
import './BuyBox.css';

export default function BuyBox({ name, reference, stars, rating, price, priceDiscount, description, children, onBuy }) {
  return (
    <div className="buy-box">
      <h1 className="buy-box__name">{name}</h1>
      {reference && <p className="buy-box__reference">{reference}</p>}

      {(stars !== undefined || rating !== undefined) && (
        <div className="buy-box__rating">
          {stars !== undefined && (
            <span className="buy-box__stars">
              {stars}
              <img src={starIcon} alt="estrelas" width={16} height={16} />
            </span>
          )}
          {rating !== undefined && <span className="buy-box__reviews">({rating} avaliações)</span>}
        </div>
      )}

      <div className="buy-box__prices">
        {priceDiscount ? (
          <>
            <span className="buy-box__price buy-box__price--discount">{formatPrice(priceDiscount)}</span>
            <span className="buy-box__price buy-box__price--old">{formatPrice(price)}</span>
          </>
        ) : (
          <span className="buy-box__price buy-box__price--discount">{formatPrice(price)}</span>
        )}
      </div>

      {description && (
        <div className="buy-box__description">
          <h4>Descrição do produto</h4>
          <p>{description}</p>
        </div>
      )}

      {children}

      <button type="button" className="buy-box__cta" onClick={onBuy}>COMPRAR</button>
    </div>
  );
}
