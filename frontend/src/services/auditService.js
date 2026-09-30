import api from "./api";

export const auditService = {
  async getAll() {
    const { data } = await api.get("/audit/logs");
    return data.map((log) => ({ ...log, timestamp: log.createdAt, role: log.role?.toLowerCase() }));
  },
};
