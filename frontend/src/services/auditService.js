// Audit service — currently uses mock data, structured for Flask API replacement
// GET /api/audit-logs
import { mockAuditLogs } from "../data/mockData";

const MOCK_DELAY = 400;
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const auditService = {
  async getAll() {
    await delay(MOCK_DELAY);
    return [...mockAuditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
};
