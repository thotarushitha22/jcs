// Reads the products of an order, whatever name or shape the server uses.
// Returns a clean list: [{ title, qty, price, image, productId }]

// places where the server may keep the products (first one that has items is used)
const LIST_KEYS = [
  "orderItems",
  "order_items",
  "OrderItems",
  "items",
  "orderProducts",
  "products",
  "cartItems",
  "lineItems",
  "line_items",
];

// a list can arrive as an array, a JSON text, or an object like { items: [...] } / { data: [...] }
function toList(value) {
  if (!value) return [];

  if (typeof value === "string") {
    try {
      return toList(JSON.parse(value));
    } catch {
      return [];
    }
  }

  if (Array.isArray(value)) return value;

  if (typeof value === "object") {
    for (const key of ["items", "data", "rows", "products"]) {
      if (Array.isArray(value[key])) return value[key];
    }
  }

  return [];
}

function normalizeItem(raw) {
  if (!raw || typeof raw !== "object") return null;

  // some servers nest the product: { product: { title, price }, qty }
  const nested =
    raw.product && typeof raw.product === "object" ? raw.product : {};

  const title =
    raw.title ||
    raw.name ||
    raw.productName ||
    raw.product_name ||
    raw.product_title ||
    nested.title ||
    nested.name ||
    "Product";

  const qty = Number(raw.qty ?? raw.quantity ?? raw.count ?? 1) || 1;

  const price =
    Number(
      raw.price ?? raw.unitPrice ?? raw.unit_price ?? nested.price ?? 0
    ) || 0;

  const image =
    raw.image ||
    raw.imageUrl ||
    nested.image ||
    (Array.isArray(nested.images) ? nested.images[0] : "") ||
    "";

  const productId =
    raw.productId ??
    raw.product_id ??
    (typeof raw.product === "object"
      ? nested.id ?? nested._id
      : raw.product) ??
    raw.id ??
    null;

  return { title, qty, price, image, productId };
}

export function getOrderItems(order) {
  if (!order) return [];

  for (const key of LIST_KEYS) {
    const list = toList(order[key]);

    if (list.length > 0) {
      return list.map(normalizeItem).filter(Boolean);
    }
  }

  return [];
}