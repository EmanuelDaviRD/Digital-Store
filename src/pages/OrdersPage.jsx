import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import Layout from './Layout';
import { useStore } from '../context/StoreContext';
import { apiRequest } from '../services/api';
import { formatPrice } from '../data/products';
import './OrdersPage.css';

const statusLabels = {
  paid: 'Pagamento de teste aprovado',
  pending_payment: 'Pagamento pendente',
  payment_failed: 'Pagamento de teste recusado',
};

export default function OrdersPage() {
  const { user } = useStore();
  const location = useLocation();
  const { id } = useParams();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !localStorage.getItem('drip-store-token')) return undefined;
    let active = true;
    setLoading(true);
    setError('');
    setSelectedOrder(null);
    const request = id ? apiRequest(`/orders/${encodeURIComponent(id)}`) : apiRequest('/orders');
    request
      .then((result) => {
        if (!active) return;
        if (id) setSelectedOrder(result);
        else setOrders(result);
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, user]);

  if (!user || !localStorage.getItem('drip-store-token')) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  const orderList = selectedOrder ? [selectedOrder] : orders;
  const title = id ? `Pedido #${id}` : 'Meus pedidos';

  return (
    <Layout>
      <div className="container orders-page">
        <header className="orders-page__heading">
          <h1>{title}</h1>
          {id && <Link to="/orders">Voltar para meus pedidos</Link>}
        </header>
        {location.state?.message && <p className="orders-page__notice" role="status">{location.state.message}</p>}
        {loading && <p className="orders-page__message">Carregando pedidos...</p>}
        {error && <div className="orders-page__error" role="alert"><p>{error}</p><Link to="/checkout">Voltar ao checkout</Link></div>}
        {!loading && !error && orderList.length === 0 && (
          <section className="orders-page__empty">
            <p>Você ainda não tem pedidos.</p>
            <Link to="/products">Explorar produtos</Link>
          </section>
        )}
        {!loading && !error && orderList.map((order) => (
          <article className="order-card" key={order.id}>
            <header className="order-card__heading">
              <div>
                <p>Pedido #{order.id}</p>
                <span>{new Date(order.createdAt ?? order.created_at).toLocaleString('pt-BR')}</span>
              </div>
              <strong className={`order-status order-status--${order.status}`}>{statusLabels[order.status] ?? order.status}</strong>
            </header>
            <ul className="order-card__items">
              {order.items?.map((item) => (
                <li key={item.id}>
                  {item.product_image && <img src={item.product_image} alt="" />}
                  <span>{item.quantity} × {item.product_name}</span>
                  <strong>{formatPrice(item.line_total)}</strong>
                </li>
              ))}
            </ul>
            <div className="order-card__totals">
              <p><span>Subtotal</span><strong>{formatPrice(order.subtotal)}</strong></p>
              <p><span>Frete demonstrativo</span><strong>{formatPrice(order.shipping_cost)}</strong></p>
              <p className="order-card__total"><span>Total</span><strong>{formatPrice(order.total)}</strong></p>
            </div>
            <p className="order-card__disclaimer">Pagamento e frete deste pedido são demonstrativos. Nenhuma cobrança real foi realizada.</p>
            <div className="order-card__actions">
              {!id && <Link className="order-card__link" to={`/orders/${order.id}`}>Ver detalhes</Link>}
              {order.status === 'paid' && (
                <Link className="order-card__link" to={`/orders/${order.id}/receipt`}>Comprovante de venda</Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </Layout>
  );
}
