import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ShoppingCart, Heart, Image as ImageIcon, PackageCheck } from "lucide-react";
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

const getId = (item) => Number(item?.productId || item?.id || item?._id);

// Same image logic as the product cards on the home page
const getImage = (product) => {
  const first = Array.isArray(product.images) ? product.images[0] : null;
  const raw =
    (typeof first === "string" ? first : first?.url || first?.image) ||
    product.image ||
    product.imageUrl ||
    product.productImage ||
    "";
  return typeof raw === "string" && !raw.includes("undefined") ? raw.trim() : "";
};

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUser = user || storedUser;
  const userId = currentUser?.id || currentUser?.userId;

  const [wishlistItems, setWishlistItems] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [wishlistRes, productsRes] = await Promise.all([
          axios.get(`${API_BASE}/wishlist/${userId}`).catch(() => ({ data: { data: [] } })),
          axios.get(`${API_BASE}/products`).catch(() => ({ data: [] })),
        ]);

        let items = wishlistRes.data?.data || wishlistRes.data || [];
        if (!Array.isArray(items)) items = [];

        const prodData = productsRes.data?.data || productsRes.data;
        const products = Array.isArray(prodData) ? prodData : [];
        setAllProducts(products);

        // hearts added on this device but not (yet) saved on the server
        const localAdded = readList(`added_wishlist_${userId}`);
        const serverIds = items.map(getId);
        localAdded.forEach((id) => {
          if (!serverIds.includes(id)) {
            const found = products.find((p) => getId(p) === id);
            if (found) items.push({ productId: id });
          }
        });

        // hearts removed on this device
        const localDeleted = readList(`deleted_wishlist_${userId}`);
        items = items.filter((i) => !localDeleted.includes(getId(i)));

        setWishlistItems(items);
      } catch (error) {
        // ignore - empty state is shown
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const removeFromList = (item, silent = false) => {
    const prodId = getId(item);

    setWishlistItems((prev) => prev.filter((i) => getId(i) !== prodId));

    const localDeleted = readList(`deleted_wishlist_${userId}`);
    if (!localDeleted.includes(prodId)) localDeleted.push(prodId);
    localStorage.setItem(`deleted_wishlist_${userId}`, JSON.stringify(localDeleted));

    // keep the heart buttons in sync
    const localAdded = readList(`added_wishlist_${userId}`).filter((id) => id !== prodId);
    localStorage.setItem(`added_wishlist_${userId}`, JSON.stringify(localAdded));

    if (!silent) toast.success("Removed from wishlist");
  };

  const handleMoveToCart = (item, product) => {
    addToCart(product, 1);
    removeFromList(item, true);
    toast.success("Moved to cart");
  };

  // live product data first, saved wishlist data fills any gaps
  const getProductDetails = (item) => {
    const prodId = getId(item);
    const matched = allProducts.find((p) => getId(p) === prodId) || {};
    const merged = { ...item, ...matched };

    return {
      ...merged,
      id: prodId || matched.id || matched._id,
      title: merged.title || merged.name || "Product",
      price: Number(merged.price || 0),
      mrp: Number(merged.mrp || 0),
      stock: merged.stock === undefined ? null : Number(merged.stock),
      image: getImage(merged),
    };
  };

  /* ---------------- states ---------------- */

  if (!userId) {
    return (
      <div className="page wl-page">
        <div className="wl-empty">
          <Heart size={44} />
          <h2>Sign in to view your wishlist</h2>
          <p>Keep track of the items you want to buy later.</p>
          <Link to="/login" className="btn btn-primary">Sign in</Link>
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
          <Link to="/" className="btn btn-primary">Start shopping</Link>
        </div>
      </div>
    );
  }

  /* ---------------- list ---------------- */

  return (
    <div className="page wl-page">
      <div className="wl-head">
        <h1 className="wl-title">
          <Heart size={26} fill="currentColor" />
          My wishlist
        </h1>
        <span className="wl-count mono">
          {wishlistItems.length} {wishlistItems.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="wl-grid">
        {wishlistItems.map((item) => {
          const product = getProductDetails(item);
          const outOfStock = product.stock !== null && product.stock <= 0;
          const discount =
            product.mrp > product.price && product.mrp > 0
              ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
              : 0;

          return (
            <div key={product.id || item._id} className="wl-card">
              <Link to={`/product/${product.id}`} className="wl-image">
                {product.image ? (
                  <img src={product.image} alt={product.title} loading="lazy" />
                ) : (
                  <span className="wl-no-image">
                    <ImageIcon size={34} />
                    No image
                  </span>
                )}
                {outOfStock && <span className="wl-oos">Out of stock</span>}
              </Link>

              <div className="wl-body">
                {product.brand && <span className="wl-brand">{product.brand}</span>}

                <Link to={`/product/${product.id}`} className="wl-name">
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
                  {discount > 0 && <span className="wl-off">{discount}% off</span>}
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
                    disabled={outOfStock}
                  >
                    <ShoppingCart size={16} />
                    {outOfStock ? "Unavailable" : "Move to cart"}
                  </button>

                  <button
                    type="button"
                    className="wl-remove"
                    onClick={() => removeFromList(item)}
                    title="Remove from wishlist"
                    aria-label="Remove from wishlist"
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