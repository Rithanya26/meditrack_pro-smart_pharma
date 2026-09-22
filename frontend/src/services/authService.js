// Auth service — currently uses mock data, structured for Flask API replacement
// POST /api/auth/login
import { mockUsers, mockCredentials } from "../data/mockData";

const MOCK_DELAY = 600;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const authService = {
  async login(email, password) {
    await delay(MOCK_DELAY);
    const user = mockUsers.find((u) => u.email === email);
    if (!user || mockCredentials[email] !== password) {
      throw new Error("Invalid email or password");
    }
    if (user.status !== "active") {
      throw new Error("This account has been deactivated. Contact your administrator.");
    }
    const token = `mock-jwt-${user.id}-${Date.now()}`;
    localStorage.setItem("meditrack_token", token);
    localStorage.setItem("meditrack_user", JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem("meditrack_token");
    localStorage.removeItem("meditrack_user");
  },

  getCurrentUser() {
    const stored = localStorage.getItem("meditrack_user");
    return stored ? JSON.parse(stored) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("meditrack_token");
  },
};
