import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const fetchProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("API fetchProducts error:", error);
    return [];
  }
};

export const fetchProduct = async (id) => {
  try {
    const all = await fetchProducts();
    const product = all.find((p) => String(p.id) === String(id));
    
    if (!product) {
      throw new Error("Product not found");
    }

    let parsedImages = [];
    try {
      parsedImages = typeof product.images === "string" ? JSON.parse(product.images) : product.images;
    } catch (e) {
      parsedImages = [product.image_url || product.imageUrl];
    }

    return {
      ...product,
      images: Array.isArray(parsedImages) ? parsedImages.filter(Boolean) : [product.image_url].filter(Boolean),
    };
  } catch (error) {
    console.error("API fetchProduct error:", error);
    throw error;
  }
};

export const fetchRelatedProducts = async (id) => {
  try {
    const products = await fetchProducts();
    return products.filter((p) => String(p.id) !== String(id)).slice(0, 4);
  } catch (error) {
    return [];
  }
};

export const fetchCategories = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
  } catch (error) {
    // Fallback if categories route fails
  }

  return [
    { id: "smartphones", name: "Smartphones" },
    { id: "laptops", name: "Laptops" },
    { id: "tvs", name: "TVs" },
    { id: "accessories", name: "Accessories" }
  ];
};

export const fetchMyProducts = async (token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/merchant/products`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    const products = await fetchProducts();
    return products;
  }
};

export const createProduct = async (productData, token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await axios.post(`${API_BASE_URL}/products`, productData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
  } catch (error) {
    console.error("API createProduct error:", error);
    throw error;
  }
};

export const updateProduct = async (id, productData, token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await axios.put(`${API_BASE_URL}/products/${id}`, productData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
  } catch (error) {
    console.error("API updateProduct error:", error);
    throw error;
  }
};

export const deleteProduct = async (id, token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await axios.delete(`${API_BASE_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data;
  } catch (error) {
    console.error("API deleteProduct error:", error);
    throw error;
  }
};

// ==========================================
// NEW: Fetch all users for Admin Dashboard
// ==========================================
export const fetchAllUsers = async (token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error("API fetchAllUsers error:", error);
    return [];
  }
};