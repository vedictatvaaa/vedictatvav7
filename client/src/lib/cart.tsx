import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "@shared/schema";
import { trackAddToCart, trackRemoveFromCart } from "./analytics";

export type CartItem = {
  product: Product;
  quantity: number;
  variationLabel?: string;
};

type CartContextType = {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addToCart: (product: Product, quantity?: number, variationLabel?: string) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "vedic-tatva-cart";

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {}
  return [];
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  function addToCart(product: Product, quantity: number = 1, variationLabel?: string) {
    trackAddToCart(product, quantity, variationLabel);
    setItems((prev) => {
      const cartKey = variationLabel ? `${product.id}-${variationLabel}` : `${product.id}`;
      const existing = prev.find((item) => {
        const itemKey = item.variationLabel ? `${item.product.id}-${item.variationLabel}` : `${item.product.id}`;
        return itemKey === cartKey;
      });
      if (existing) {
        return prev.map((item) => {
          const itemKey = item.variationLabel ? `${item.product.id}-${item.variationLabel}` : `${item.product.id}`;
          return itemKey === cartKey
            ? { ...item, quantity: item.quantity + quantity }
            : item;
        });
      }
      return [...prev, { product, quantity, variationLabel }];
    });
  }

  function removeFromCart(productId: number) {
    setItems((prev) => {
      // A single product.id can have multiple cart rows (one per variation).
      // Track every removed row so GA4 sees the full quantity.
      const removedRows = prev.filter((i) => i.product.id === productId);
      for (const row of removedRows) {
        trackRemoveFromCart(row.product, row.quantity, row.variationLabel);
      }
      return prev.filter((item) => item.product.id !== productId);
    });
  }

  function updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  return (
    <CartContext.Provider
      value={{ items, totalItems, totalAmount, addToCart, removeFromCart, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
