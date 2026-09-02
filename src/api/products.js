import axios from "axios";

const API_BASE_URL = "https://jcs-server-1.onrender.com/api";

export const fetchProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products`, { timeout: 25000 });
    console.log("Data received from Render backend:", response.data);

    const rawData = response.data;
    return Array.isArray(rawData) ? rawData : rawData?.products || rawData?.data || [];
  } catch (error) {
    console.error("Failed to fetch products from Render backend:", error);
    const localProducts = JSON.parse(localStorage.getItem("jcs_products") || "[]");
    return localProducts.length > 0 ? localProducts : [];
  }
};

export const fetchProduct = async (id) => {
  try {
    const all = await fetchProducts();
    const product = all.find((p) => String(p.id || p._id) === String(id));
    
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
    return products.filter((p) => String(p.id || p._id) !== String(id)).slice(0, 4);
  } catch (error) {
    return [];
  }
};

export const fetchCategories = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/categories`, { timeout: 25000 });
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
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 25000
    });
    const rawData = response.data;
    return Array.isArray(rawData) ? rawData : rawData?.products || rawData?.data || [];
  } catch (error) {
    const products = await fetchProducts();
    return products;
  }
};

export const createProduct = async (productData, token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await axios.post(`${API_BASE_URL}/products`, productData, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 25000
    });
    return response.data;
  } catch (error) {
    console.warn("Backend offline. Saving new product locally.");
    const localProducts = JSON.parse(localStorage.getItem("jcs_products") || "[]");
    const newEntry = { ...productData, id: Date.now() };
    localProducts.push(newEntry);
    localStorage.setItem("jcs_products", JSON.stringify(localProducts));
    return newEntry;
  }
};

export const updateProduct = async (id, productData, token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await axios.put(`${API_BASE_URL}/products/${id}`, productData, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 25000
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
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 25000
    });
    return response.data;
  } catch (error) {
    console.warn("Backend offline. Deleting product locally.");
    const localProducts = JSON.parse(localStorage.getItem("jcs_products") || "[]");
    const updated = localProducts.filter(p => String(p.id || p._id) !== String(id));
    localStorage.setItem("jcs_products", JSON.stringify(updated));
    return { success: true };
  }
};

export const fetchAllUsers = async (token) => {
  try {
    const authToken = token || localStorage.getItem("token");
    const response = await __await_axios_get_helper(`${API_BASE_URL}/admin/users`, authToken);
    return Array.isArray(response) ? response : response?.users || response?.data || [];
  } catch (error) {
    return JSON.parse(localStorage.getItem("jcs_users") || "[]");
  }
};

async function __await_axios_get_helper(url, token) {
  const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, timeout: 25000 });
  return res.data;
}