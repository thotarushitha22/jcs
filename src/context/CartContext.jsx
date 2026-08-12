import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ product, qty }]

  const addToCart = (product, qty) => {
    const quantity = qty ?? 1; // plain "Add to Cart" always adds 1 unit
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + quantity } : i
        );
      }
      return [...prev, { product, qty: quantity }];
    });
  };

  const updateQty = (id, qty) => {
    setItems((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
  };

  const removeFromCart = (id) => setItems((prev) => prev.filter((i) => i.product.id !== id));
  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.qty, 0);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, updateQty, removeFromCart, clearCart, subtotal, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);