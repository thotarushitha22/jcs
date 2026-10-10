// src/utils/orderItems.js
//
// Reads the products of an order, whatever shape the server sends them in.
// Used by the Orders list and the Order detail page, so both always agree.
//
// Accepted places for the list:
//   items | orderItems | order_items | orderProducts | order_products |
//   products | lineItems | line_items | cartItems | cart_items
// (also when the server sends the list as a JSON string)
//
// Accepted names for each product line:
//   name:     title | name | productName | product_name | product.title | product.name
//   quantity: qty | quantity | count
//   price:    price | unitPrice | unit_price | priceAtPurchase | product.price
//
// Nothing is invented: if the server sends no products, an empty list is returned.

const LIST_KEYS = [
  "items",
  "orderItems",
  "order_items",
  "orderProducts",
  "order_products",
  "products",
  "lineItems",
  "line_items",
  "cartItems",
  "cart_items",
];

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const readList = (value) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value;
};

const text = (value) => (typeof value === "string" ? value.trim() : "");

const normalizeItem = (raw) => {
  const item = raw && typeof raw === "object" ? raw : {};
  const product = item.product && typeof item.product === "object" ? item.product : {};

  const productId =
    product.id ??
    product._id ??
    (typeof item.product === "string" || typeof item.product === "number" ? item.product : undefined) ??
    item.productId ??
    item.product_id;

  const title =
    text(item.title) ||
    text(item.name) ||
    text(item.productName) ||
    text(item.product_name) ||
    text(product.title) ||
    text(product.name) ||
    (productId !== undefined && productId !== null ? `Product #${productId}` : "Product");

  const qty = toNumber(item.qty ?? item.quantity ?? item.count, 1);

  const price = toNumber(
    item.price ?? item.unitPrice ?? item.unit_price ?? item.priceAtPurchase ?? product.price,
    0
  );

  const image =
    text(item.image) ||
    text(item.imageUrl) ||
    text(product.image) ||
    (Array.isArray(product.images) && text(product.images[0])) ||
    "";

  return { productId, title, qty, price, image };
};

/** Normalised product lines of an order: [{ productId, title, qty, price, image }] */
export const getOrderItems = (order) => {
  if (!order || typeof order !== "object") return [];

  for (const key of LIST_KEYS) {
    const list = readList(order[key]);
    if (Array.isArray(list) && list.length > 0) {
      return list.map(normalizeItem);
    }
  }

  return [];
};

/** Sum of qty x price for all lines */
export const getItemsTotal = (items) =>
  items.reduce((sum, item) => sum + item.qty * item.price, 0);