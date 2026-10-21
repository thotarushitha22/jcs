import axios from "axios";

/* =========================================================
   API BASE URL
========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://jcs-server-1.onrender.com/api";

const cleanBaseUrl = API_BASE_URL.replace(/\/+$/, "");

const API_URL = cleanBaseUrl.endsWith("/api")
  ? cleanBaseUrl
  : `${cleanBaseUrl}/api`;

console.log("=================================");
console.log("JCS API URL:", API_URL);
console.log("=================================");

/* =========================================================
   AUTH TOKEN
========================================================= */

const getAuthToken = (token) => {
  if (token && typeof token === "string" && token.trim()) {
    return token.trim();
  }

  const storedToken = localStorage.getItem("token");
  if (storedToken && storedToken !== "null" && storedToken !== "undefined") {
    return storedToken.trim();
  }

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.token && typeof user.token === "string") return user.token.trim();
    if (user?.accessToken && typeof user.accessToken === "string") return user.accessToken.trim();
  } catch (error) {
    console.warn("Could not read stored user:", error);
  }

  return null;
};

/* =========================================================
   PUBLIC PRODUCTS
========================================================= */

export const fetchProducts = async () => {
  try {
    const response = await axios.get(`${API_URL}/products`, { timeout: 25000 });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch (error) {
    console.error("Failed to fetch public products:", error.response?.data || error.message);
    try {
      const localProducts = JSON.parse(localStorage.getItem("jcs_products") || "[]");
      return Array.isArray(localProducts) ? localProducts : [];
    } catch {
      return [];
    }
  }
};

/* =========================================================
   SINGLE PRODUCT
========================================================= */

export const fetchProduct = async (id) => {
  try {
    const products = await fetchProducts();
    const product = products.find((p) => String(p.id || p._id) === String(id));

    if (!product) throw new Error("Product not found");

    let parsedImages = [];
    try {
      if (Array.isArray(product.images)) {
        parsedImages = product.images;
      } else if (typeof product.images === "string") {
        parsedImages = JSON.parse(product.images);
      }
    } catch {
      parsedImages = [];
    }

    if (!Array.isArray(parsedImages)) parsedImages = [];

    if (parsedImages.length === 0) {
      const image = product.image || product.image_url || product.imageUrl;
      if (image) parsedImages = [image];
    }

    return { ...product, images: parsedImages.filter(Boolean) };
  } catch (error) {
    console.error("fetchProduct error:", error);
    throw error;
  }
};

/* =========================================================
   RELATED PRODUCTS (STRICT BRAND MATCH)
========================================================= */

export const fetchRelatedProducts = async (id) => {
  try {
    const products = await fetchProducts();
    
    // 1. Find the current product
    const currentProduct = products.find(
      (p) => String(p.id || p._id) === String(id)
    );

    if (!currentProduct) return [];

    // 2. Normalize strings for comparison
    const currentBrand = String(currentProduct.brand || "").toLowerCase().trim();
    const currentCategory = String(currentProduct.category?.name || currentProduct.category || currentProduct.categoryId || "").toLowerCase().trim();

    // 3. Filter out the current product from the pool
    const pool = products.filter((p) => String(p.id || p._id) !== String(id));

    // 4. EXACT BRAND MATCH (Only show Motorola if viewing Motorola)
    const exactBrand = pool.filter((p) => {
      const pBrand = String(p.brand || "").toLowerCase().trim();
      return pBrand === currentBrand && currentBrand !== "";
    });

    // 5. Fill with same category if we don't have 4 exact matches
    const sameCategory = pool.filter((p) => {
      const pCat = String(p.category?.name || p.category || p.categoryId || "").toLowerCase().trim();
      return pCat === currentCategory && currentCategory !== "" && !exactBrand.includes(p);
    });

    // 6. Fallback to anything else if still not enough
    const others = pool.filter(
      (p) => !exactBrand.includes(p) && !sameCategory.includes(p)
    );

    // Combine them: Brand first, then Category, then Others
    const related = [
      ...exactBrand,
      ...sameCategory,
      ...others,
    ].slice(0, 4);

    return related;
  } catch (error) {
    console.error("fetchRelatedProducts error:", error);
    return [];
  }
};

/* =========================================================
   CATEGORIES
========================================================= */

export const fetchCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories`, { timeout: 25000 });
    const data = response.data;
    const categories = Array.isArray(data) ? data : data?.categories || data?.data || [];
    if (Array.isArray(categories) && categories.length > 0) return categories;
  } catch (error) {
    console.warn("Categories API failed:", error.response?.data || error.message);
  }

  return [
    { id: "smartphones", name: "Smartphones" },
    { id: "laptops", name: "Laptops" },
    { id: "tvs", name: "TVs" },
    { id: "accessories", name: "Accessories" },
  ];
};

/* =========================================================
   MERCHANT PRODUCTS
========================================================= */

export const fetchMyProducts = async (token) => {
  try {
    const authToken = getAuthToken(token);
    if (!authToken) throw new Error("Authentication token missing");

    const response = await axios.get(`${API_URL}/products/my-products`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 25000,
    });

    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch (error) {
    console.error("FAILED TO FETCH MERCHANT PRODUCTS", error.response?.data || error.message);
    throw error;
  }
};

/* =========================================================
   CREATE PRODUCT
========================================================= */

export const createProduct = async (productData, token) => {
  try {
    const authToken = getAuthToken(token);
    if (!authToken) throw new Error("Authentication token missing");

    const response = await axios.post(`${API_URL}/products`, productData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      timeout: 25000,
    });
    return response.data;
  } catch (error) {
    console.error("createProduct error:", error.response?.data || error.message);
    throw error;
  }
};

/* =========================================================
   UPDATE PRODUCT
========================================================= */

export const updateProduct = async (id, productData, token) => {
  try {
    const authToken = getAuthToken(token);
    if (!authToken) throw new Error("Authentication token missing");

    const response = await axios.put(`${API_URL}/products/${id}`, productData, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      timeout: 25000,
    });
    return response.data;
  } catch (error) {
    console.error("updateProduct error:", error.response?.data || error.message);
    throw error;
  }
};

/* =========================================================
   DELETE PRODUCT
========================================================= */

export const deleteProduct = async (id, token) => {
  try {
    const authToken = getAuthToken(token);
    if (!authToken) throw new Error("Authentication token missing");

    const response = await axios.delete(`${API_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 25000,
    });
    return response.data;
  } catch (error) {
    console.error("deleteProduct error:", error.response?.data || error.message);
    throw error;
  }
};

/* =========================================================
   ADMIN USERS
========================================================= */

export const fetchAllUsers = async (token) => {
  try {
    const authToken = getAuthToken(token);
    if (!authToken) throw new Error("Authentication token missing");

    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 25000,
    });

    const data = response.data;
    if (Array.isArray(data)) return data;
    return data?.users || data?.data || [];
  } catch (error) {
    console.error("fetchAllUsers error:", error.response?.data || error.message);
    try {
      return JSON.parse(localStorage.getItem("jcs_users") || "[]");
    } catch {
      return [];
    }
  }
};