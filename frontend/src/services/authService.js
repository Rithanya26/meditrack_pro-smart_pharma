import api from "./api";

function normalizeUser(user) {
  if (!user) return null;
  return { ...user, role: user.role?.toLowerCase(), status: user.status?.toLowerCase() };
}

export const authService = {
  async login(email, password) {
    try {
      const { data } = await api.post("/auth/login", { email: email.trim(), password });
      const user = normalizeUser(data);
      localStorage.setItem("meditrack_token", data.token);
      localStorage.setItem("meditrack_user", JSON.stringify(user));
      return user;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Invalid email or password");
    }
  },

  logout() {
    localStorage.removeItem("meditrack_token");
    localStorage.removeItem("meditrack_user");
  },

  getCurrentUser() {
    const stored = localStorage.getItem("meditrack_user");
    if (!stored) return null;
    try {
      return normalizeUser(JSON.parse(stored));
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem("meditrack_token");
  },
};
