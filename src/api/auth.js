import api from "./axios";

export const fetchMe = async () => {
  const { data } = await api.get("/auth/me");
  return data.user;
};