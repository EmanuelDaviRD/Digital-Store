import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import Layout from './Layout';
import { useStore } from '../context/StoreContext';
import { apiRequest } from '../services/api';
import { formatPrice } from '../data/products';
import './ReceiptPage.css';

const paymentMethodLabels = {
  pix: 'Pix (simulado)',
  credit_card: 'Cartão de crédito (simulado)',
  boleto: 'Boleto (simulado)',
};

export default function ReceiptPage() {
  const { user } = useStore();
  const location = useLocation();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !localStorage.getItem('drip-store-token')) return undefined;
    let active = true;
    setLoading(true);
    setError('');
    apiRequest(`/orders/${encodeURIComponent(id)}`)
      .then((result) => { if (active) setOrder(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, user]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `Comprovante de venda - Pedido ${id} - Drip Store`;
    return () => { document.title = previousTitle; };
  }, [id]);

  if (!user || !localStorage.getItem('drip-store-token')) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return (
    <Layout>
      <div className="container receipt-page">
        <div className="receipt-toolbar">
          <Link to={`/orders/${id}`}>Voltar ao pedido</Link>
          {order?.status === 'paid' && (
            <button type="button" onClick={() => window.print()}>Imprimir / salvar como PDF</button>
          )}
        </div>

        {loading && <p className="receipt-state">Carregando comprovante...</p>}
        {error && <section className="receipt-state receipt-state--error" role="alert">
          <p>{error}</p>
          <Link to="/orders">Ir para meus pedidos</Link>
        </section>}
        {!loading && !error && order && order.status !== 'paid' && (
          <section className="receipt-state">
            <h1>Comprovante indisponível</h1>
            <p>Este pedido não foi aprovado no ambiente de teste. O comprovante de venda é gerado somente para pedidos aprovados.</p>
            <Link to={`/orders/${id}`}>Ver status do pedido</Link>
          </section>
        )}
        {!loading && !error && order?.status === 'paid' && (
          <article className="receipt-document">
            <header className="receipt-header">
              <div>
                <p className="receipt-brand">DRIP STORE</p>
                <h1>Comprovante de venda</h1>
                <p>Pedido de teste aprovado</p>
              </div>
              <div className="receipt-number">
                <span>Número do pedido</span>
                <strong>#{order.id}</strong>
              </div>
            </header>

            <p className="receipt-warning">
              DOCUMENTO DEMONSTRATIVO — SEM VALIDADE FISCAL. Pagamento simulado; nenhuma cobrança real foi realizada.
            </p>

            <section className="receipt-details">
              <div>
                <h2>Dados da compra</h2>
                <p><span>Data</span><strong>{new Date(order.createdAt ?? order.created_at).toLocaleString('pt-BR')}</strong></p>
                <p><span>Status</span><strong>Aprovado (simulação)</strong></p>
                <p><span>Forma de pagamento</span><strong>{paymentMethodLabels[order.payment_method] ?? 'Pagamento de teste'}</strong></p>
              </div>
              <div>
                <h2>Cliente</h2>
                <p><span>Nome</span><strong>{[user.firstname, user.surname].filter(Boolean).join(' ')}</strong></p>
                <p><span>E-mail</span><strong>{user.email}</strong></p>
              </div>
              <div className="receipt-details__address">
                <h2>Endereço de entrega</h2>
                <p><span>Destinatário</span><strong>{order.shipping_address?.recipient}</strong></p>
                <p><span>Endereço</span><strong>{order.shipping_address?.street}, {order.shipping_address?.number}{order.shipping_address?.complement ? `, ${order.shipping_address.complement}` : ''}</strong></p>
                <p><span>Bairro</span><strong>{order.shipping_address?.neighborhood}</strong></p>
                <p><span>Cidade / UF</span><strong>{order.shipping_address?.city} / {order.shipping_address?.state}</strong></p>
                <p><span>CEP</span><strong>{order.postal_code}</strong></p>
              </div>
            </section>

            <section className="receipt-products">
              <h2>Produtos</h2>
              <div className="receipt-table-wrap">
                <table>
                  <thead>
                    <tr><th>Item</th><th>Opções</th><th>Qtd.</th><th>Valor unitário</th><th>Total</th></tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>{Object.entries(item.selected_options ?? {}).map(([key, value]) => `${key}: ${value}`).join(' · ') || '—'}</td>
                        <td>{item.quantity}</td>
                        <td>{formatPrice(item.unit_price)}</td>
                        <td>{formatPrice(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="receipt-totals">
              <p><span>Subtotal</span><strong>{formatPrice(order.subtotal)}</strong></p>
              <p><span>Frete estimado (demonstrativo)</span><strong>{formatPrice(order.shipping_cost)}</strong></p>
              <p className="receipt-totals__grand"><span>Total do pedido</span><strong>{formatPrice(order.total)}</strong></p>
            </section>

            <footer className="receipt-footer">
              <p>Comprovante gerado pela Drip Store em ambiente de teste.</p>
              <p>Não é nota fiscal, não comprova recolhimento de tributos e não tem validade fiscal.</p>
            </footer>
          </article>
        )}
      </div>
    </Layout>
  );
}
