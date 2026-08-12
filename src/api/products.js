import api from "./axios";

export const fetchProducts = async ({ category, search, sort, page = 1 } = {}) => {
  const { data } = await api.get("/products", { params: { category, search, sort, page } });
  return data; // { products, total, page, pages }
};

export const fetchProduct = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const fetchRelatedProducts = async (id) => {
  const { data } = await api.get(`/products/${id}/related`);
  return data;
};

export const fetchCategories = async () => {
  const { data } = await api.get("/categories");
  return data;
};