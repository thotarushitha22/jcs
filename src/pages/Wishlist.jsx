import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Trash2,
  ShoppingCart,
  Heart,
  Image as ImageIcon,
  PackageCheck,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Wishlist.css";

const API_BASE = "https://jcs-server-1.onrender.com/api";

const readList = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const getId = (item) => {
  const id = item?.productId ?? item?.product?.id ?? item?.product?._id ?? item?.id;
  const numberId = Number(id);
  return Number.isFinite(numberId) && numberId > 0 ? numberId : null;
};

const getImage = (product) => {
  const first = Array.isArray(product?.images)
    ? product.images[0]
    : null;

  const raw =
    (typeof first === "string"
      ? first
      : first?.url || first?.image) ||
    product?.image ||
    product?.imageUrl ||
    product?.productImage ||
    "";

  if (typeof raw !== "string" || raw.includes("undefined")) {
    return "";
  }

  return raw.trim();
};

const getUserId = (user) => user?.id ?? user?.userId ?? user?._id ?? null;

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const currentUser = user || storedUser;
  const userId = getUserId(currentUser);

  const [wishlistItems, setWishlistItems] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!userId) {
        setWishlistItems([]);
        setAllProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const [wishlistResult, productsResult] = await Promise.allSettled([
          axios.get(`${API_BASE}/wishlist/${userId}`),
          axios.get(`${API_BASE}/products`),
        ]);

        if (cancelled) return;

        let items = [];

        if (wishlistResult.status === "fulfilled") {
          const data = wishlistResult.value.data;
          const result = data?.data ?? data?.wishlist ?? data;
          items = Array.isArray(result) ? [...result] : [];
        }

        let products = [];

        if (productsResult.status === "fulfilled") {
          const data = productsResult.value.data;
          const result = data?.data ?? data?.products ?? data;
          products = Array.isArray(result) ? result : [];
        }

        setAllProducts(products);

        // Restore locally added products that have not reached the server.
        const localAdded = readList(`added_wishlist_${userId}`);
        const serverProductIds = new Set(items.map(getId));

        localAdded.forEach((id) => {
          const numericId = Number(id);

          if (
            Number.isFinite(numericId) &&
            numericId > 0 &&
            !serverProductIds.has(numericId)
          ) {
            const product = products.find(
              (p) => getId(p) === numericId
            );

            if (product) {
              items.push({
                productId: numericId,
                ...product,
              });
            }
          }
        });

        // Locally removed products must not reappear on refresh.
        const deletedIds = new Set(
          readList(`deleted_wishlist_${userId}`).map(Number)
        );

        items = items.filter((item) => {
          const id = getId(item);
          return id !== null && !deletedIds.has(id);
        });

        setWishlistItems(items);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load wishlist:", error);
          toast.error("Unable to load wishlist");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const removeFromList = async (item, silent = false) => {
    const productId = getId(item);

    if (!userId || !productId) {
      toast.error("Unable to identify this wishlist product");
      return false;
    }

    if (removingIds.includes(productId)) return false;

    setRemovingIds((prev) => [...prev, productId]);

    // Update the screen immediately.
    setWishlistItems((prev) =>
      prev.filter((entry) => getId(entry) !== productId)
    );

    const deletedKey = `deleted_wishlist_${userId}`;
    const addedKey = `added_wishlist_${userId}`;

    const deletedIds = readList(deletedKey).map(Number);

    if (!deletedIds.includes(productId)) {
      deletedIds.push(productId);
    }

    localStorage.setItem(deletedKey, JSON.stringify(deletedIds));

    const addedIds = readList(addedKey).filter(
      (id) => Number(id) !== productId
    );

    localStorage.setItem(addedKey, JSON.stringify(addedIds));

    try {
      // This route must match the DELETE route implemented by your backend.
      await axios.delete(
        `${API_BASE}/wishlist/${userId}/${productId}`
      );

      if (!silent) toast.success("Removed from wishlist");

      return true;
    } catch (error) {
      console.error(
        "Wishlist deletion API failed:",
        error.response?.status,
        error.response?.data || error.message
      );

      // Keep the item hidden locally if the API route is unavailable.
      if (!silent) {
        if (error.response?.status === 404) {
          toast.error(
            "Removed on this device. Backend delete route needs fixing."
          );
        } else {
          toast.error(
            "Removed on this device, but server deletion failed."
          );
        }
      }

      return false;
    } finally {
      setRemovingIds((prev) =>
        prev.filter((id) => id !== productId)
      );
    }
  };

  const handleMoveToCart = async (item, product) => {
    if (!product?.id) {
      toast.error("Product information is unavailable");
      return;
    }

    if (product.stock !== null && product.stock <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    try {
      await Promise.resolve(addToCart(product, 1));
      await removeFromList(item, true);
      toast.success("Moved to cart");
    } catch (error) {
      console.error("Move to cart failed:", error);
      toast.error("Unable to move this product to cart");
    }
  };

  const getProductDetails = (item) => {
    const productId = getId(item);

    const matched =
      allProducts.find((product) => getId(product) === productId) || {};

    const merged = { ...item, ...matched };

    const stock =
      merged.stock === undefined || merged.stock === null
        ? null
        : Number(merged.stock);

    return {
      ...merged,
      id: productId,
      title: merged.title || merged.name || "Product",
      price: Number(merged.price || 0),
      mrp: Number(merged.mrp || 0),
      stock,
      image: getImage(merged),
    };
  };

  if (!userId) {
    return (
      <div className="page wl-page">
        <div className="wl-empty">
          <Heart size={44} />
          <h2>Sign in to view your wishlist</h2>
          <p>Keep track of the items you want to buy later.</p>
          <Link to="/login" className="btn btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page wl-page">
        <div className="wl-empty">
          <p>Loading your wishlist…</p>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="page wl-page">
        <div className="wl-empty">
          <Heart size={44} />
          <h2>Your wishlist is empty</h2>
          <p>Tap the heart on any product to save it here.</p>
          <Link to="/" className="btn btn-primary">
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page wl-page">
      <div className="wl-head">
        <h1 className="wl-title">
          <Heart size={26} fill="currentColor" />
          My wishlist
        </h1>

        <span className="wl-count mono">
          {wishlistItems.length}{" "}
          {wishlistItems.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="wl-grid">
        {wishlistItems.map((item) => {
          const product = getProductDetails(item);
          const productId = product.id;
          const outOfStock =
            product.stock !== null && product.stock <= 0;

          const discount =
            product.mrp > product.price && product.mrp > 0
              ? Math.round(
                  ((product.mrp - product.price) / product.mrp) * 100
                )
              : 0;

          return (
            <div className="wl-card" key={productId}>
              <Link to={`/product/${productId}`} className="wl-image">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    loading="lazy"
                  />
                ) : (
                  <span className="wl-no-image">
                    <ImageIcon size={34} />
                    No image
                  </span>
                )}

                {outOfStock && (
                  <span className="wl-oos">Out of stock</span>
                )}
              </Link>

              <div className="wl-body">
                {product.brand && (
                  <span className="wl-brand">{product.brand}</span>
                )}

                <Link
                  to={`/product/${productId}`}
                  className="wl-name"
                >
                  {product.title}
                </Link>

                <div className="wl-price-row">
                  <span className="wl-price mono">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>

                  {product.mrp > product.price && (
                    <span className="wl-mrp mono">
                      ₹{product.mrp.toLocaleString("en-IN")}
                    </span>
                  )}

                  {discount > 0 && (
                    <span className="wl-off">{discount}% off</span>
                  )}
                </div>

                {product.stock !== null && !outOfStock && (
                  <span className="wl-stock">
                    <PackageCheck size={13} />
                    {product.stock.toLocaleString("en-IN")} in stock
                  </span>
                )}

                <div className="wl-actions">
                  <button
                    type="button"
                    className="btn btn-primary wl-cart"
                    onClick={() => handleMoveToCart(item, product)}
                    disabled={
                      outOfStock || removingIds.includes(productId)
                    }
                  >
                    <ShoppingCart size={16} />
                    {outOfStock ? "Unavailable" : "Move to cart"}
                  </button>

                  <button
                    type="button"
                    className="wl-remove"
                    onClick={() => removeFromList(item)}
                    disabled={removingIds.includes(productId)}
                    title="Remove from wishlist"
                    aria-label={`Remove ${product.title} from wishlist`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}