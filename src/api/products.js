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
  // 1. Explicit token passed from component
  if (
    token &&
    typeof token === "string" &&
    token.trim()
  ) {
    return token.trim();
  }

  // 2. Direct localStorage token
  const storedToken =
    localStorage.getItem("token");

  if (
    storedToken &&
    storedToken !== "null" &&
    storedToken !== "undefined"
  ) {
    return storedToken.trim();
  }

  // 3. Token inside stored user
  try {
    const user = JSON.parse(
      localStorage.getItem("user") || "{}"
    );

    if (
      user?.token &&
      typeof user.token === "string"
    ) {
      return user.token.trim();
    }

    if (
      user?.accessToken &&
      typeof user.accessToken === "string"
    ) {
      return user.accessToken.trim();
    }
  } catch (error) {
    console.warn(
      "Could not read stored user:",
      error
    );
  }

  return null;
};

/* =========================================================
   AUTH HEADERS
========================================================= */

const getAuthHeaders = (token) => {
  const authToken = getAuthToken(token);

  if (!authToken) {
    throw new Error(
      "Authentication token missing"
    );
  }

  return {
    headers: {
      Authorization: `Bearer ${authToken}`,
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

    try {
      const localProducts =
        JSON.parse(
          localStorage.getItem(
            "jcs_products"
          ) || "[]"
        );

      return Array.isArray(localProducts)
        ? localProducts
        : [];
    } catch {
      return [];
    }
  }
};

/* =========================================================
   SINGLE PRODUCT
   GET /api/products/:id
========================================================= */

export const fetchProduct = async (id) => {
  try {
    const products =
      await fetchProducts();

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
      if (
        Array.isArray(product.images)
      ) {
        parsedImages =
          product.images;
      } else if (
        typeof product.images ===
        "string"
      ) {
        parsedImages =
          JSON.parse(
            product.images
          );
      }
    } catch {
      parsedImages = [];
    }

    if (
      !Array.isArray(parsedImages)
    ) {
      parsedImages = [];
    }

    if (
      parsedImages.length === 0
    ) {
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
      images:
        parsedImages.filter(Boolean),
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

export const fetchRelatedProducts =
  async (id) => {
    try {
      const products =
        await fetchProducts();

      return products
        .filter(
          (product) =>
            String(
              product.id ||
                product._id
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

export const fetchCategories =
  async () => {
    try {
      const response =
        await axios.get(
          `${API_URL}/categories`,
          {
            timeout: 25000,
          }
        );

      const data =
        response.data;

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
        error.response?.data ||
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

export const fetchMyProducts =
  async (token) => {
    try {
      const authToken =
        getAuthToken(token);

      console.log(
        "================================="
      );

      console.log(
        "FETCH MERCHANT PRODUCTS"
      );

      console.log(
        "API URL:",
        API_URL
      );

      console.log(
        "Merchant token exists:",
        Boolean(authToken)
      );

      if (authToken) {
        console.log(
          "Token length:",
          authToken.length
        );
      }

      if (!authToken) {
        throw new Error(
          "Authentication token missing"
        );
      }

      const endpoint =
        `${API_URL}/products/my-products`;

      console.log(
        "Merchant products endpoint:",
        endpoint
      );

      const response =
        await axios.get(
          endpoint,
          {
            headers: {
              Authorization:
                `Bearer ${authToken}`,
            },
            timeout: 25000,
          }
        );

      console.log(
        "Merchant products status:",
        response.status
      );

      console.log(
        "Merchant products response:",
        response.data
      );

      const data =
        response.data;

      if (Array.isArray(data)) {
        console.log(
          "Merchant products count:",
          data.length
        );

        return data;
      }

      if (
        Array.isArray(
          data?.products
        )
      ) {
        console.log(
          "Merchant products count:",
          data.products.length
        );

        return data.products;
      }

      if (
        Array.isArray(
          data?.data
        )
      ) {
        console.log(
          "Merchant products count:",
          data.data.length
        );

        return data.data;
      }

      console.warn(
        "Merchant API returned no product array:",
        data
      );

      return [];
    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "FAILED TO FETCH MERCHANT PRODUCTS"
      );

      console.error(
        "Status:",
        error.response?.status
      );

      console.error(
        "Response:",
        error.response?.data
      );

      console.error(
        "Message:",
        error.message
      );

      console.error(
        "================================="
      );

      throw error;
    }
  };

/* =========================================================
   CREATE PRODUCT
   POST /api/products
========================================================= */

export const createProduct =
  async (
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

      const response =
        await axios.post(
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

export const updateProduct =
  async (
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

      const response =
        await axios.put(
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

export const deleteProduct =
  async (
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

      const response =
        await axios.delete(
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

export const fetchAllUsers =
  async (token) => {
    try {
      const authToken =
        getAuthToken(token);

      if (!authToken) {
        throw new Error(
          "Authentication token missing"
        );
      }

      const response =
        await axios.get(
          `${API_URL}/admin/users`,
          {
            headers: {
              Authorization:
                `Bearer ${authToken}`,
            },
            timeout: 25000,
          }
        );

      const data =
        response.data;

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

      try {
        return JSON.parse(
          localStorage.getItem(
            "jcs_users"
          ) || "[]"
        );
      } catch {
        return [];
      }
    }
  };