import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { apiRequest } from '../services/api';
import { useStore } from '../context/StoreContext';
import './AuthPage.css';

export default function AuthPage({ mode = 'login' }) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useStore();
  const [form, setForm] = useState({ firstname: '', surname: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await apiRequest('/user', { method: 'POST', body: JSON.stringify(form) });
      }
      const result = await apiRequest('/user/token', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      setAuth(result.token, result.user);
      navigate(location.state?.from ?? '/');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="auth-page container">
        <form className="auth-card" onSubmit={submit}>
          <p className="auth-card__eyebrow">DRIP STORE</p>
          <h1>{isSignup ? 'Crie sua conta' : 'Acesse sua conta'}</h1>
          <p className="auth-card__intro">{isSignup ? 'Preencha seus dados para começar.' : 'Informe seus dados para continuar.'}</p>

          {isSignup && (
            <div className="auth-card__name-fields">
              <label>Nome<input name="firstname" autoComplete="given-name" value={form.firstname} onChange={change} required /></label>
              <label>Sobrenome<input name="surname" autoComplete="family-name" value={form.surname} onChange={change} required /></label>
            </div>
          )}
          <label>E-mail<input name="email" type="email" autoComplete="email" value={form.email} onChange={change} required /></label>
          <label>Senha<input name="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} minLength="8" value={form.password} onChange={change} required /></label>
          {isSignup && (
            <label>Confirme sua senha<input name="confirmPassword" type="password" autoComplete="new-password" minLength="8" value={form.confirmPassword} onChange={change} required /></label>
          )}
          {error && <p className="auth-card__error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>{loading ? 'Aguarde...' : isSignup ? 'CRIAR CONTA' : 'ENTRAR'}</button>
          <p className="auth-card__switch">
            {isSignup ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}{' '}
            <Link to={isSignup ? '/login' : '/signup'} state={location.state}>{isSignup ? 'Entrar' : 'Cadastre-se'}</Link>
          </p>
        </form>
      </section>
    </Layout>
  );
}
