import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { useStore } from '../context/StoreContext';
import { apiRequest } from '../services/api';
import { formatPrice } from '../data/products';
import './CheckoutPage.css';

const initialAddress = {
  recipient: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  postalCode: '',
};

const paymentMethods = [
  { value: 'pix', label: 'Pix' },
  { value: 'credit_card', label: 'Cartão de crédito' },
  { value: 'boleto', label: 'Boleto' },
];

const paymentScenarios = [
  { value: 'approved', label: 'Aprovado', description: 'Pedido aprovado no ambiente de teste.' },
  { value: 'pending', label: 'Pendente', description: 'Simula uma confirmação ainda não recebida.' },
  { value: 'rejected', label: 'Recusado', description: 'Simula uma tentativa recusada.' },
];

function orderItems(cart) {
  return cart.map((item) => ({
    productId: item.id,
    quantity: item.quantity,
    options: item.options ?? Object.fromEntries(
      [['Tamanho', item.size], ['Cor', item.color]].filter(([, value]) => value !== undefined)
    ),
  }));
}

export default function CheckoutPage() {
  const { cart, cartSubtotal, user, clearCart } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [address, setAddress] = useState(() => ({
    ...initialAddress,
    recipient: [user?.firstname, user?.surname].filter(Boolean).join(' '),
  }));
  const [quote, setQuote] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [paymentScenario, setPaymentScenario] = useState('approved');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const subtotal = useMemo(() => Number(cartSubtotal), [cartSubtotal]);
  const displayedSubtotal = quote?.subtotal ?? subtotal;
  const postalCodeDigits = address.postalCode.replace(/\D/g, '');

  if (!user || !localStorage.getItem('drip-store-token')) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  const changeAddress = (event) => {
    const { name, value } = event.target;
    setAddress((current) => ({ ...current, [name]: value }));
    if (name === 'postalCode') setQuote(null);
  };

  const requestQuote = async () => {
    setError('');
    setQuote(null);
    setQuoting(true);
    try {
      const result = await apiRequest('/shipping/quote', {
        method: 'POST',
        body: JSON.stringify({ postalCode: address.postalCode, items: orderItems(cart) }),
      });
      setQuote(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setQuoting(false);
    }
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setError('');
    if (!quote || quote.postalCode !== postalCodeDigits) {
      setError('Calcule o frete para este CEP antes de finalizar o pedido.');
      return;
    }
    setLoading(true);
    try {
      const result = await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: orderItems(cart),
          postalCode: address.postalCode,
          shippingAddress: {
            recipient: address.recipient,
            street: address.street,
            number: address.number,
            complement: address.complement,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
          },
          paymentMethod,
          paymentScenario,
        }),
      });
      if (result.order.status === 'paid') clearCart();
      navigate(`/orders/${result.order.id}`, { replace: true, state: { message: result.message } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container checkout-page">
        <header className="checkout-page__heading">
          <p>FINALIZAÇÃO</p>
          <h1>Checkout</h1>
          <span>Confira seus dados e conclua seu pedido em ambiente de teste.</span>
        </header>

        {!cart.length ? (
          <section className="checkout-empty">
            <h2>Seu carrinho está vazio</h2>
            <p>Adicione produtos para continuar com a compra.</p>
            <Link to="/products">Ver produtos</Link>
          </section>
        ) : (
          <form className="checkout-layout" onSubmit={submitOrder}>
            <div className="checkout-sections">
              <section className="checkout-card">
                <h2>1. Endereço de entrega</h2>
                <div className="checkout-form-grid">
                  <label className="checkout-field checkout-field--full">
                    Nome de quem recebe
                    <input name="recipient" autoComplete="name" value={address.recipient} onChange={changeAddress} required />
                  </label>
                  <label className="checkout-field checkout-field--postal">
                    CEP
                    <input name="postalCode" inputMode="numeric" autoComplete="postal-code" maxLength="9" placeholder="00000-000" value={address.postalCode} onChange={changeAddress} disabled={quoting} required />
                  </label>
                  <button className="checkout-quote" type="button" onClick={requestQuote} disabled={quoting || postalCodeDigits.length !== 8}>
                    {quoting ? 'Calculando...' : 'Calcular frete'}
                  </button>
                  <label className="checkout-field checkout-field--full">
                    Endereço
                    <input name="street" autoComplete="street-address" value={address.street} onChange={changeAddress} required />
                  </label>
                  <label className="checkout-field">
                    Número
                    <input name="number" value={address.number} onChange={changeAddress} required />
                  </label>
                  <label className="checkout-field">
                    Complemento <span>(opcional)</span>
                    <input name="complement" value={address.complement} onChange={changeAddress} />
                  </label>
                  <label className="checkout-field">
                    Bairro
                    <input name="neighborhood" autoComplete="address-level3" value={address.neighborhood} onChange={changeAddress} required />
                  </label>
                  <label className="checkout-field">
                    Cidade
                    <input name="city" autoComplete="address-level2" value={address.city} onChange={changeAddress} required />
                  </label>
                  <label className="checkout-field">
                    Estado (UF)
                    <input name="state" autoComplete="address-level1" maxLength="2" value={address.state} onChange={changeAddress} required />
                  </label>
                </div>
                {quote && (
                  <p className="checkout-quote-result" role="status">
                    {quote.service}: <strong>{formatPrice(quote.cost)}</strong> · estimativa de {quote.estimatedDays} dias úteis.
                  </p>
                )}
                <p className="checkout-demo-note">O valor e o prazo são estimativas demonstrativas, calculadas pelo CEP. Não consultamos os Correios.</p>
              </section>

              <section className="checkout-card">
                <h2>2. Forma de pagamento</h2>
                <div className="checkout-choice-list">
                  {paymentMethods.map((method) => (
                    <label className="checkout-choice" key={method.value}>
                      <input type="radio" name="paymentMethod" value={method.value} checked={paymentMethod === method.value} onChange={() => setPaymentMethod(method.value)} />
                      <span>{method.label}</span>
                    </label>
                  ))}
                </div>
                <p className="checkout-demo-note">A escolha é apenas para demonstração. Não informe dados de cartão: nenhuma cobrança será feita.</p>
              </section>

              <section className="checkout-card">
                <h2>3. Resultado simulado</h2>
                <label className="checkout-field">
                  Cenário de teste
                  <select value={paymentScenario} onChange={(event) => setPaymentScenario(event.target.value)}>
                    {paymentScenarios.map((scenario) => (
                      <option key={scenario.value} value={scenario.value}>{scenario.label} — {scenario.description}</option>
                    ))}
                  </select>
                </label>
                <p className="checkout-demo-note">Este controle existe apenas para testar os estados do pedido; não processa pagamentos reais.</p>
              </section>
              {error && <p className="checkout-error" role="alert">{error}</p>}
            </div>

            <aside className="checkout-summary">
              <h2>Resumo do pedido</h2>
              <ul>
                {cart.map((item) => (
                  <li key={item.key}>
                    <span>{item.quantity} × {item.name}</span>
                    <strong>{formatPrice((item.priceDiscount ?? item.price) * item.quantity)}</strong>
                  </li>
                ))}
              </ul>
              <div><span>Subtotal</span><strong>{formatPrice(displayedSubtotal)}</strong></div>
              <div><span>Frete</span><strong>{quote ? formatPrice(quote.cost) : 'A calcular'}</strong></div>
              <hr />
              <div className="checkout-summary__total">
                <span>Total estimado</span>
                <strong>{formatPrice(displayedSubtotal + (quote?.cost ?? 0))}</strong>
              </div>
              <p>O frete final é recalculado no servidor ao criar o pedido.</p>
              <button type="submit" disabled={loading || quoting || !quote || quote.postalCode !== postalCodeDigits}>
                {loading ? 'Registrando pedido...' : 'FINALIZAR PEDIDO DE TESTE'}
              </button>
              <Link className="checkout-summary__back" to="/cart">Voltar ao carrinho</Link>
            </aside>
          </form>
        )}
      </div>
    </Layout>
  );
}
