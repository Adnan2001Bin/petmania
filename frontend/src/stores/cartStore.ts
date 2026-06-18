import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import type { Product, CartItem } from '../types';

const cartItems = persistentAtom<CartItem[]>('petmania-cart', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
});

export const cartCount = computed(cartItems, (items) =>
  items.reduce((total, item) => total + item.quantity, 0)
);

export const cartTotal = computed(cartItems, (items) =>
  items.reduce((total, item) => total + item.product.price * item.quantity, 0)
);

export function addToCart(product: Product, quantity = 1) {
  const items = cartItems.get();
  const existing = items.find((item) => item.product.id === product.id);

  if (existing) {
    cartItems.set(
      items.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      )
    );
  } else {
    cartItems.set([...items, { product, quantity }]);
  }
}

export function removeFromCart(productId: string) {
  cartItems.set(cartItems.get().filter((item) => item.product.id !== productId));
}

export function updateQuantity(productId: string, quantity: number) {
  if (quantity < 1) {
    removeFromCart(productId);
    return;
  }
  cartItems.set(
    cartItems.get().map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    )
  );
}

export function clearCart() {
  cartItems.set([]);
}

export { cartItems };
