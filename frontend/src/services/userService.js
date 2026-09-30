import api from "./api";

function normalizeUser(user) {
  return { ...user, role: user.role?.toLowerCase(), status: user.status?.toLowerCase(), avatar: user.name?.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() };
}

export const userService = {
  async getPharmacists() {
    const { data } = await api.get("/users/pharmacists");
    return data.map(normalizeUser);
  },

  async createPharmacist(data) {
    const { data: user } = await api.post("/users/pharmacists", { ...data, role: "PHARMACIST", status: data.status?.toUpperCase() || "ACTIVE" });
    return normalizeUser(user);
  },

  async updatePharmacist(id, data) {
    const { data: user } = await api.put(`/users/pharmacists/${id}`, { ...data, status: data.status?.toUpperCase() || "ACTIVE" });
    return normalizeUser(user);
  },

  async toggleStatus(id) {
    const { data: user } = await api.patch(`/users/${id}/toggle-status`);
    return normalizeUser(user);
  },
};