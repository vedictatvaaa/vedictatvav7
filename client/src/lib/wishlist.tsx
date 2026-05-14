import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Product } from "@shared/schema";

type WishlistContextType = {
  items: Product[];
  totalItems: number;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "vedic-tatva-wishlist";

function loadWishlist(): Product[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveWishlist(items: Product[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>(loadWishlist);

  useEffect(() => {
    saveWishlist(items);
  }, [items]);

  const totalItems = items.length;

  function addToWishlist(product: Product) {
    setItems((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  }

  function removeFromWishlist(productId: number) {
    setItems((prev) => prev.filter((p) => p.id !== productId));
  }

  function isInWishlist(productId: number) {
    return items.some((p) => p.id === productId);
  }

  function clearWishlist() {
    setItems([]);
  }

  return (
    <WishlistContext.Provider
      value={{ items, totalItems, addToWishlist, removeFromWishlist, isInWishlist, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
