import axios from "axios";

/* =========================================================
   API BASE URL
========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://jcs-server-1.onrender.com/api";

// Make sure we have exactly:
// https://jcs-server-1.onrender.com/api
const API_URL = API_BASE_URL.replace(/\/+$/, "").endsWith("/api")
  ? API_BASE_URL.replace(/\/+$/, "")
  : `${API_BASE_URL.replace(/\/+$/, "")}/api`;


/* =========================================================
   AUTH TOKEN
========================================================= */

const getAuthToken = (token) => {
  if (token) {
    return token;
  }

  const storedToken = localStorage.getItem("token");

  if (storedToken) {
    return storedToken;
  }

  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    return user?.token || null;
  } catch {
    return null;
  }
};


/* =========================================================
   AUTH HEADERS
========================================================= */

const getAuthHeaders = (token) => {
  const authToken = getAuthToken(token);

  return {
    headers: {
      Authorization: authToken
        ? `Bearer ${authToken}`
        : "",
      "Content-Type": "application/json",
    },
  };
};


/* =========================================================
   PUBLIC PRODUCTS
   GET /api/products
========================================================= */

export const fetchProducts = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/products`,
      {
        timeout: 25000,
      }
    );

    console.log(
      "Products received:",
      response.data
    );

    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.products)) {
      return data.products;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  } catch (error) {
    console.error(
      "Failed to fetch public products:",
      error.response?.data ||
        error.message
    );

    const localProducts = JSON.parse(
      localStorage.getItem("jcs_products") || "[]"
    );

    return Array.isArray(localProducts)
      ? localProducts
      : [];
  }
};


/* =========================================================
   SINGLE PRODUCT
   GET /api/products/:id
========================================================= */

export const fetchProduct = async (id) => {
  try {
    const products = await fetchProducts();

    const product = products.find(
      (p) =>
        String(p.id || p._id) ===
        String(id)
    );

    if (!product) {
      throw new Error(
        "Product not found"
      );
    }

    let parsedImages = [];

    try {
      if (Array.isArray(product.images)) {
        parsedImages = product.images;
      } else if (
        typeof product.images === "string"
      ) {
        parsedImages = JSON.parse(
          product.images
        );
      }
    } catch {
      parsedImages = [];
    }

    if (!Array.isArray(parsedImages)) {
      parsedImages = [];
    }

    if (parsedImages.length === 0) {
      const image =
        product.image ||
        product.image_url ||
        product.imageUrl;

      if (image) {
        parsedImages = [image];
      }
    }

    return {
      ...product,
      images: parsedImages.filter(Boolean),
    };
  } catch (error) {
    console.error(
      "fetchProduct error:",
      error
    );

    throw error;
  }
};


/* =========================================================
   RELATED PRODUCTS
========================================================= */

export const fetchRelatedProducts = async (
  id
) => {
  try {
    const products =
      await fetchProducts();

    return products
      .filter(
        (product) =>
          String(
            product.id || product._id
          ) !== String(id)
      )
      .slice(0, 4);
  } catch (error) {
    console.error(
      "fetchRelatedProducts error:",
      error
    );

    return [];
  }
};


/* =========================================================
   CATEGORIES
   GET /api/categories
========================================================= */

export const fetchCategories = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/categories`,
      {
        timeout: 25000,
      }
    );

    const data = response.data;

    const categories =
      Array.isArray(data)
        ? data
        : data?.categories ||
          data?.data ||
          [];

    if (
      Array.isArray(categories) &&
      categories.length > 0
    ) {
      return categories;
    }
  } catch (error) {
    console.warn(
      "Categories API failed:",
      error.message
    );
  }

  return [
    {
      id: "smartphones",
      name: "Smartphones",
    },
    {
      id: "laptops",
      name: "Laptops",
    },
    {
      id: "tvs",
      name: "TVs",
    },
    {
      id: "accessories",
      name: "Accessories",
    },
  ];
};


/* =========================================================
   MERCHANT PRODUCTS
   GET /api/products/my-products
========================================================= */

export const fetchMyProducts = async (
  token
) => {
  try {
    const authToken =
      getAuthToken(token);

    if (!authToken) {
      throw new Error(
        "Authentication token missing"
      );
    }

    const response = await axios.get(
      `${API_URL}/products/my-products`,
      {
        headers: {
          Authorization:
            `Bearer ${authToken}`,
        },
        timeout: 25000,
      }
    );

    console.log(
      "Merchant products:",
      response.data
    );

    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.products)) {
      return data.products;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  } catch (error) {
    console.error(
      "Failed to fetch merchant products:",
      error.response?.data ||
        error.message
    );

    return [];
  }
};


/* =========================================================
   CREATE PRODUCT
   POST /api/products
========================================================= */

export const createProduct = async (
  productData,
  token
) => {
  try {
    const authToken =
      getAuthToken(token);

    if (!authToken) {
      throw new Error(
        "Authentication token missing"
      );
    }

    const response = await axios.post(
      `${API_URL}/products`,
      productData,
      {
        headers: {
          Authorization:
            `Bearer ${authToken}`,
          "Content-Type":
            "application/json",
        },
        timeout: 25000,
      }
    );

    console.log(
      "Product created:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "createProduct error:",
      error.response?.data ||
        error.message
    );

    throw error;
  }
};


/* =========================================================
   UPDATE PRODUCT
   PUT /api/products/:id
========================================================= */

export const updateProduct = async (
  id,
  productData,
  token
) => {
  try {
    const authToken =
      getAuthToken(token);

    if (!authToken) {
      throw new Error(
        "Authentication token missing"
      );
    }

    const response = await axios.put(
      `${API_URL}/products/${id}`,
      productData,
      {
        headers: {
          Authorization:
            `Bearer ${authToken}`,
          "Content-Type":
            "application/json",
        },
        timeout: 25000,
      }
    );

    console.log(
      "Product updated:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "updateProduct error:",
      error.response?.data ||
        error.message
    );

    throw error;
  }
};


/* =========================================================
   DELETE PRODUCT
   DELETE /api/products/:id
========================================================= */

export const deleteProduct = async (
  id,
  token
) => {
  try {
    const authToken =
      getAuthToken(token);

    if (!authToken) {
      throw new Error(
        "Authentication token missing"
      );
    }

    const response = await axios.delete(
      `${API_URL}/products/${id}`,
      {
        headers: {
          Authorization:
            `Bearer ${authToken}`,
        },
        timeout: 25000,
      }
    );

    console.log(
      "Product deleted:",
      response.data
    );

    return response.data;
  } catch (error) {
    console.error(
      "deleteProduct error:",
      error.response?.data ||
        error.message
    );

    throw error;
  }
};


/* =========================================================
   ADMIN USERS
   GET /api/admin/users
========================================================= */

export const fetchAllUsers = async (
  token
) => {
  try {
    const authToken =
      getAuthToken(token);

    if (!authToken) {
      throw new Error(
        "Authentication token missing"
      );
    }

    const response = await axios.get(
      `${API_URL}/admin/users`,
      {
        headers: {
          Authorization:
            `Bearer ${authToken}`,
        },
        timeout: 25000,
      }
    );

    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }

    return (
      data?.users ||
      data?.data ||
      []
    );
  } catch (error) {
    console.error(
      "fetchAllUsers error:",
      error.response?.data ||
        error.message
    );

    return JSON.parse(
      localStorage.getItem(
        "jcs_users"
      ) || "[]"
    );
  }
};