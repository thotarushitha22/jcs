import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function WishlistButton({ productId }) {
  const { user } = useAuth();
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUser = user || storedUser;
  const userId = currentUser?.id || currentUser?.userId;

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if item is already wishlisted on mount
  useEffect(() => {
    if (userId && productId) {
      checkWishlistStatus();
    }
  }, [userId, productId]);

  const checkWishlistStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/wishlist/${userId}`);
      if (response.data.success) {
        const exists = response.data.data.some((item) => Number(item.productId) === Number(productId));
        setIsWishlisted(exists);
      }
    } catch (error) {
      console.error("Error checking wishlist status:", error);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault(); // Prevent accidental navigation if inside a link/card
    e.stopPropagation();

    if (!userId) {
      toast.error("Please sign in to manage your wishlist");
      return;
    }

    setLoading(true);
    try {
      if (!isWishlisted) {
        const res = await axios.post("http://localhost:5000/api/wishlist", {
          userId,
          productId,
        });
        if (res.data.success) {
          setIsWishlisted(true);
          toast.success("Added to wishlist!");
        }
      } else {
        const res = await axios.delete("http://localhost:5000/api/wishlist", {
          data: { userId, productId },
        });
        if (res.data.success) {
          setIsWishlisted(false);
          toast.success("Removed from wishlist!");
        }
      }
    } catch (error) {
      console.error("Wishlist toggle error:", error);
      toast.error("Failed to update wishlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleWishlist}
      disabled={loading}
      className={`p-2 rounded-full transition flex items-center justify-center border ${
        isWishlisted 
          ? "bg-red-50 text-red-500 border-red-200" 
          : "bg-white text-gray-500 border-gray-200 hover:text-red-500 hover:border-red-200"
      }`}
      title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
    </button>
  );
}