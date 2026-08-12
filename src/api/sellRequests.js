import api from "./axios";

export const createSellRequest = async (payload) => {
  const { data } = await api.post("/sell-requests", payload);
  return data;
};

export const fetchMySellRequests = async () => {
  const { data } = await api.get("/sell-requests");
  return data;
};

export const fetchAllSellRequests = async () => {
  const { data } = await api.get("/sell-requests/all");
  return data;
};

export const updateSellRequestStatus = async (id, status) => {
  const { data } = await api.put(`/sell-requests/${id}/status`, { status });
  return data;
};