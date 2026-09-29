import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, ShoppingCart, Heart } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const API_BASE = "https://jcs-server-1.onrender.com/api";

export default function Wishlist() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUser = user || storedUser;
  const userId = currentUser?.id || currentUser?.userId;

  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/wishlist/${userId}`);

      if (response.data.success) {
        setWishlistItems(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Failed to load wishlist items.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (productId) => {
    setWishlistItems((prev) => 
      prev.filter((item) => Number(item.productId || item.id || item._id) !== Number(productId))
    );
    toast.success("Removed from wishlist");
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success("Moved item to cart!");
  };

  if (!userId) {
    return (
      <div className="page container text-center py-16">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign in to view your Wishlist</h2>
        <p className="text-gray-500 mb-6">Keep track of items you want to buy later.</p>
        <Link to="/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  if (loading) {
    return <div className="page container py-16 text-center">Loading your wishlist...</div>;
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="page container text-center py-16">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold mb-2">Your Wishlist is Empty</h2>
        <p className="text-gray-500 mb-6">Explore our products and save your favorites here!</p>
        <Link to="/" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <main className="page container py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Heart className="text-red-500" fill="currentColor" size={24} /> My Wishlist ({wishlistItems.length})
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item) => {
          const prodId = item.productId || item.id || item._id;

          const imageUrl = 
            item.image || 
            item.imageUrl || 
            (Array.isArray(item.images) ? item.images[0]?.url || item.images[0] : null) || 
            "https://via.placeholder.com/300";

          const price = Number(item.price || 0);

          return (
            <div key={prodId} className="border rounded-lg p-4 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <Link to={`/product/${prodId}`}>
                  <div className="h-48 overflow-hidden rounded-md mb-4 bg-gray-50 flex items-center justify-center">
                    <img 
                      src={imageUrl} 
                      alt={item.title || item.name} 
                      className="object-contain h-full w-full hover:scale-105 transition-transform" 
                    />
                  </div>
                </Link>

                {item.brand && <span className="text-xs text-gray-500 uppercase font-semibold">{item.brand}</span>}
                <Link to={`/product/${prodId}`}>
                  <h3 className="font-medium text-gray-800 hover:text-blue-600 line-clamp-2 mt-1 mb-2">
                    {item.title || item.name}
                  </h3>
                </Link>

                <div className="text-lg font-bold text-gray-900 mb-4">
                  ₹{price.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => handleAddToCart(item)}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>

                <button
                  type="button"
                  onClick={() => handleRemove(prodId)}
                  className="p-2 border rounded-md text-gray-500 hover:text-red-600 hover:border-red-200 transition"
                  title="Remove from Wishlist"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}