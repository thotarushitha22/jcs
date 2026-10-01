import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import "./WishlistButton.css";

const API_BASE = "https://jcs-server-1.onrender.com/api";

// Helper function to extract valid image URL from any product structure
const getValidImageUrl = (product) => {
  if (!product) return "";
  
  const rawImage = 
    product.image || 
    product.imageUrl || 
    product.productImage ||
    product.img ||
    (Array.isArray(product.images) ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url || product.images[0]?.image) : null);

  if (typeof rawImage === "string" && rawImage.trim() !== "" && !rawImage.includes("undefined")) {
    return rawImage;
  }
  if (typeof rawImage === "object" && rawImage !== null) {
    return rawImage.url || rawImage.image || rawImage.path || "";
  }
  return "";
};

export default function WishlistButton({ product, productId: propProductId }) {
  const { user } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUser = user || storedUser;
  const userId = currentUser?.id || currentUser?.userId;

  const productId = Number(product?.id || product?.productId || propProductId);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && productId) {
      const localDeleted = JSON.parse(localStorage.getItem(`deleted_wishlist_${userId}`) || "[]");
      const localAdded = JSON.parse(localStorage.getItem(`added_wishlist_${userId}`) || "[]");

      if (localDeleted.includes(productId)) {
        setIsWishlisted(false);
        return;
      }
      if (localAdded.includes(productId)) {
        setIsWishlisted(true);
        return;
      }

      checkWishlistStatus();
    }
  }, [userId, productId]);

  const checkWishlistStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/wishlist/${userId}`);
      if (response.data && response.data.success) {
        const exists = response.data.data.some(
          (item) => Number(item.productId || item.id) === productId
        );
        setIsWishlisted(exists);
      }
    } catch (error) {
      // Suppress
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      toast.error("Please sign in to manage your wishlist");
      return;
    }

    if (!productId) {
      toast.error("Product ID is missing");
      return;
    }

    setLoading(true);

    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    let localDeleted = JSON.parse(localStorage.getItem(`deleted_wishlist_${userId}`) || "[]");
    let localAdded = JSON.parse(localStorage.getItem(`added_wishlist_${userId}`) || "[]");

    if (nextState) {
      toast.success("Added to wishlist!");
      if (!localAdded.includes(productId)) localAdded.push(productId);
      localDeleted = localDeleted.filter(id => id !== productId);
    } else {
      toast.success("Removed from wishlist!");
      if (!localDeleted.includes(productId)) localDeleted.push(productId);
      localAdded = localAdded.filter(id => id !== productId);
    }

    localStorage.setItem(`deleted_wishlist_${userId}`, JSON.stringify(localDeleted));
    localStorage.setItem(`added_wishlist_${userId}`, JSON.stringify(localAdded));

    try {
      if (nextState) {
        const imageUrl = getValidImageUrl(product);

        await axios.post(`${API_BASE}/wishlist`, {
          userId,
          productId,
          title: product?.title || product?.name || "Product",
          price: product?.price || 0,
          image: imageUrl,
          brand: product?.brand || ""
        }).catch(() => {});
      }
    } catch (error) {
      // Suppress
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleWishlist}
      disabled={loading}
      className={`wl-btn ${isWishlisted ? "wl-btn-active" : ""}`}
      aria-pressed={isWishlisted}
      title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
    </button>
  );
}