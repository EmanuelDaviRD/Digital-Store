import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const StoreContext = createContext(null);
const CART_KEY = 'drip-store-cart';

function readCart() {
  const saved = localStorage.getItem(CART_KEY);
  if (!saved) return [];
  try {
    const items = JSON.parse(saved);
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error('Não foi possível ler o carrinho salvo.', error);
    return [];
  }
}

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(readCart);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('drip-store-user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Não foi possível ler o usuário salvo.', error);
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product, options = {}) => {
    setCart((current) => {
      const selectedOptions = options.selectedOptions ?? Object.fromEntries(
        [['Tamanho', options.size], ['Cor', options.color]].filter(([, value]) => value !== undefined)
      );
      const optionKey = JSON.stringify(Object.entries(selectedOptions).sort(([left], [right]) => left.localeCompare(right)));
      const key = `${product.id}:${optionKey}`;
      const found = current.find((item) => item.key === key);
      const next = found
        ? current.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current, {
            key,
            id: product.id,
            name: product.name,
            image: product.image,
            price: product.price,
            priceDiscount: product.priceDiscount,
            size: options.size,
            color: options.color,
            options: selectedOptions,
            quantity: 1,
          }];
      return next;
    });
  };

  const updateQuantity = (key, quantity) => {
    setCart((current) => {
      const next = quantity < 1
        ? current.filter((item) => item.key !== key)
        : current.map((item) => item.key === key ? { ...item, quantity } : item);
      return next;
    });
  };

  const clearCart = () => setCart([]);

  const setAuth = (token, nextUser) => {
    localStorage.setItem('drip-store-token', token);
    localStorage.setItem('drip-store-user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const signOut = () => {
    localStorage.removeItem('drip-store-token');
    localStorage.removeItem('drip-store-user');
    setUser(null);
  };

  const value = useMemo(() => ({
    cart,
    user,
    cartCount: cart.reduce((total, item) => total + item.quantity, 0),
    cartSubtotal: cart.reduce((total, item) => total + (item.priceDiscount ?? item.price) * item.quantity, 0),
    addToCart,
    updateQuantity,
    clearCart,
    setAuth,
    signOut,
  }), [cart, user]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore precisa ser usado dentro de StoreProvider.');
  return context;
}
