const apiBase = import.meta.env.VITE_API_URL ?? '';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('drip-store-token');
  let response;
  try {
    response = await fetch(`${apiBase}/v1${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Não foi possível conectar à API da loja. Inicie o MySQL e a API em backend (npm run dev) e tente novamente.', { cause: error });
    }
    throw error;
  }

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message ?? `A solicitação falhou (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

export function normalizeProduct(product) {
  const firstImage = product.images?.find((image) => image.enabled !== false)?.content;
  const categories = product.categories ?? [];
  return {
    ...product,
    image: firstImage ?? product.image ?? '/product-thumb-1.jpeg',
    priceDiscount: Number(product.price_with_discount) > 0
      ? Number(product.price_with_discount)
      : product.priceDiscount,
    category: product.category ?? categories[0]?.slug ?? '',
  };
}

export async function fetchProducts() {
  const response = await apiRequest('/product/search?limit=-1');
  if (!Array.isArray(response?.data)) throw new Error('A API retornou uma lista de produtos inválida.');
  return response.data.map(normalizeProduct);
}

export async function fetchProduct(id) {
  return normalizeProduct(await apiRequest(`/product/${encodeURIComponent(id)}`));
}
