import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import ProductCard from '../components/ProductCard';
import { formatPrice } from '../data/products';
import { useStore } from '../context/StoreContext';
import { products } from '../data/products';
import { apiRequest } from '../services/api';
import './CartPage.css';

export default function CartPage() {
  const { cart, cartSubtotal, updateQuantity } = useStore();
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingMessage, setShippingMessage] = useState('');

  const relatedProducts = useMemo(() => {
    const cartIds = new Set(cart.map((item) => item.id));
    return products.filter((product) => !cartIds.has(product.id)).slice(0, 4);
  }, [cart]);

  const handleCoupon = () => {
    if (coupon.trim().toUpperCase() === '30OFF') {
      setDiscount(30);
      setCouponMessage('Cupom aplicado.');
      return;
    }
    setDiscount(0);
    setCouponMessage('Cupom inválido. Use 30OFF.');
  };

  const handleShipping = async () => {
    setShippingMessage('Calculando...');
    try {
      const response = await apiRequest('/shipping/quote', {
        method: 'POST',
        body: JSON.stringify({
          postalCode,
          items: cart.map((item) => ({ productId: item.id, quantity: item.quantity, options: item.options ?? {} })),
        }),
      });
      setShippingCost(Number(response.cost));
      setShippingMessage(`${response.service} - ${response.estimatedDays} dias úteis`);
    } catch (error) {
      setShippingCost(0);
      setShippingMessage(error.message);
    }
  };

  const total = Math.max(0, cartSubtotal + shippingCost - discount);

  return (
    <Layout>
      <div className="container cart-page">
        {!cart.length ? (
          <div className="cart-page__empty">
            <p>Seu carrinho está vazio.</p>
            <Link to="/products">Continuar comprando</Link>
          </div>
        ) : (
          <>
            <div className="cart-page__layout">
              <div className="cart-page__items">
                <div className="cart-page__heading">
                  <h1>Meu carrinho</h1>
                  <span>Quantidade</span>
                  <span>Unitário</span>
                  <span>Total</span>
                </div>
                {cart.map((item) => {
                  const unitPrice = item.priceDiscount ?? item.price;
                  return (
                    <article className="cart-item" key={item.key}>
                      <img src={item.image} alt={item.name} />
                      <div className="cart-item__details">
                        <h2>{item.name}</h2>
                        {item.color && <p>Cor: {item.color}</p>}
                        {item.size && <p>Tamanho: {item.size}</p>}
                        <button type="button" onClick={() => updateQuantity(item.key, 0)}>Remover item</button>
                      </div>
                      <div className="cart-item__quantity">
                        <label htmlFor={`quantity-${item.key}`}>Quantidade</label>
                        <div className="quantity-control">
                          <button type="button" aria-label="Diminuir quantidade" onClick={() => updateQuantity(item.key, item.quantity - 1)}>-</button>
                          <input
                            id={`quantity-${item.key}`}
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(event) => updateQuantity(item.key, Number(event.target.value))}
                          />
                          <button type="button" aria-label="Aumentar quantidade" onClick={() => updateQuantity(item.key, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                      <strong className="cart-item__unit">{formatPrice(unitPrice)}</strong>
                      <strong className="cart-item__total">{formatPrice(unitPrice * item.quantity)}</strong>
                    </article>
                  );
                })}
                <div className="cart-tools">
                  <div className="cart-tool">
                    <h2>Cupom de desconto</h2>
                    <div className="cart-tool__row">
                      <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Insira seu código" aria-label="Código do cupom" />
                      <button type="button" onClick={handleCoupon}>OK</button>
                    </div>
                    {couponMessage && <small>{couponMessage}</small>}
                  </div>
                  <div className="cart-tool">
                    <h2>Calcular frete</h2>
                    <div className="cart-tool__row">
                      <input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} placeholder="Insira seu CEP" aria-label="CEP para calcular frete" />
                      <button type="button" onClick={handleShipping}>OK</button>
                    </div>
                    {shippingMessage && <small>{shippingMessage}</small>}
                  </div>
                </div>
              </div>
              <aside className="cart-summary">
                <h2>Resumo</h2>
                <div><span>Subtotal:</span><strong>{formatPrice(cartSubtotal)}</strong></div>
                <div><span>Frete:</span><strong>{formatPrice(shippingCost)}</strong></div>
                <div><span>Desconto:</span><strong>{formatPrice(discount)}</strong></div>
                <hr />
                <div className="cart-summary__total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
                <p>ou 10x de {formatPrice(total / 10)} sem juros</p>
                <Link to="/checkout">Continuar</Link>
              </aside>
            </div>

            <section className="related-products" aria-labelledby="related-products-title">
              <div className="related-products__heading">
                <h2 id="related-products-title">Produtos relacionados</h2>
                <Link to="/products">Ver todos <span aria-hidden="true">&#8594;</span></Link>
              </div>
              <div className="related-products__grid">
                {relatedProducts.map((product) => <ProductCard key={product.id} {...product} />)}
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
