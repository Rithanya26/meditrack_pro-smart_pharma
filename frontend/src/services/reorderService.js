import api from "./api";

const LOCAL_STORAGE_KEY = "meditrack_reorders_data";

export const DEFAULT_APPROVED_ORDERS = [
  {
    id: "ORD-001",
    orderNumber: "ORD-001",
    medicineId: 1,
    medicine: {
      id: 1,
      brandName: "Dolo 650",
      genericMedicine: "Paracetamol",
      strength: "650 mg",
      dosageForm: "Tablet",
      manufacturer: "Micro Labs",
      minimumStock: 50,
    },
    approvedQuantity: 135,
    suggestedQuantity: 135,
    currentStock: 45,
    status: "ORDERED",
    supplier: "Micro Supply Co",
    approvedDate: "2026-10-08T10:30:00Z",
    suggestedBatchNumber: "DLO2026C",
    mfgDate: "2026-10-01",
    expDate: "2028-10-01",
  },
  {
    id: "ORD-002",
    orderNumber: "ORD-002",
    medicineId: 7,
    medicine: {
      id: 7,
      brandName: "Amoxil 500",
      genericMedicine: "Amoxicillin",
      strength: "500 mg",
      dosageForm: "Capsule",
      manufacturer: "PharmaHealth Inc",
      minimumStock: 35,
    },
    approvedQuantity: 80,
    suggestedQuantity: 80,
    currentStock: 12,
    status: "ORDERED",
    supplier: "PharmaDist Ltd",
    approvedDate: "2026-10-08T11:15:00Z",
    suggestedBatchNumber: "AMX2026C",
    mfgDate: "2026-10-01",
    expDate: "2028-10-01",
  },
  {
    id: "ORD-003",
    orderNumber: "ORD-003",
    medicineId: 2,
    medicine: {
      id: 2,
      brandName: "Calpol 650",
      genericMedicine: "Paracetamol",
      strength: "650 mg",
      dosageForm: "Tablet",
      manufacturer: "GlaxoSmithKline",
      minimumStock: 60,
    },
    approvedQuantity: 120,
    suggestedQuantity: 120,
    currentStock: 38,
    status: "ORDERED",
    supplier: "GSK Logistics",
    approvedDate: "2026-10-08T12:00:00Z",
    suggestedBatchNumber: "CAL2027B",
    mfgDate: "2026-10-01",
    expDate: "2028-10-01",
  },
  {
    id: "ORD-004",
    orderNumber: "ORD-004",
    medicineId: 5,
    medicine: {
      id: 5,
      brandName: "Brufen 400",
      genericMedicine: "Ibuprofen",
      strength: "400 mg",
      dosageForm: "Tablet",
      manufacturer: "Abbott",
      minimumStock: 45,
    },
    approvedQuantity: 95,
    suggestedQuantity: 95,
    currentStock: 25,
    status: "ORDERED",
    supplier: "Abbott Supply",
    approvedDate: "2026-10-08T14:30:00Z",
    suggestedBatchNumber: "BRU2027B",
    mfgDate: "2026-10-01",
    expDate: "2028-10-01",
  },
  {
    id: "ORD-005",
    orderNumber: "ORD-005",
    medicineId: 8,
    medicine: {
      id: 8,
      brandName: "Zyrtec 10mg",
      genericMedicine: "Cetirizine",
      strength: "10 mg",
      dosageForm: "Tablet",
      manufacturer: "AllerCare Pharma",
      minimumStock: 50,
    },
    approvedQuantity: 60,
    suggestedQuantity: 60,
    currentStock: 18,
    status: "ORDERED",
    supplier: "AllerSupply",
    approvedDate: "2026-10-08T16:00:00Z",
    suggestedBatchNumber: "ZYR2027B",
    mfgDate: "2026-10-01",
    expDate: "2028-10-01",
  },
  // Received Today (3 default historical receipts)
  {
    id: "ORD-REC-001",
    orderNumber: "ORD-REC-001",
    medicineId: 3,
    medicine: {
      id: 3,
      brandName: "Crocin 650",
      genericMedicine: "Paracetamol",
      strength: "650 mg",
      dosageForm: "Tablet",
      manufacturer: "GlaxoSmithKline",
      minimumStock: 40,
    },
    approvedQuantity: 100,
    actualReceivedQuantity: 100,
    currentStock: 140,
    status: "RECEIVED",
    supplier: "GSK Logistics",
    batchNumber: "CRO2026B",
    receivedDate: "2026-10-09T08:15:00Z",
  },
  {
    id: "ORD-REC-002",
    orderNumber: "ORD-REC-002",
    medicineId: 19,
    medicine: {
      id: 19,
      brandName: "Lipitor 20mg",
      genericMedicine: "Atorvastatin",
      strength: "20 mg",
      dosageForm: "Tablet",
      manufacturer: "CardioPharma",
      minimumStock: 40,
    },
    approvedQuantity: 75,
    actualReceivedQuantity: 75,
    currentStock: 87,
    status: "RECEIVED",
    supplier: "CardioSupply",
    batchNumber: "ATR2026C",
    receivedDate: "2026-10-09T08:45:00Z",
  },
  {
    id: "ORD-REC-003",
    orderNumber: "ORD-REC-003",
    medicineId: 16,
    medicine: {
      id: 16,
      brandName: "Glucophage 500mg",
      genericMedicine: "Metformin",
      strength: "500 mg",
      dosageForm: "Tablet",
      manufacturer: "DiabetesCare Inc",
      minimumStock: 50,
    },
    approvedQuantity: 90,
    actualReceivedQuantity: 90,
    currentStock: 108,
    status: "RECEIVED",
    supplier: "DiabetesSupply",
    batchNumber: "MET2026C",
    receivedDate: "2026-10-09T09:10:00Z",
  },
];

function getLocalStore() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalStore(store) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error("Failed to save local reorder store", e);
  }
}

function appendMedicineOrderSnapshot(store, medicineId, orderSnapshot) {
  if (medicineId == null || orderSnapshot == null) return;

  const medicineKey = `med_${medicineId}`;
  const existing = Array.isArray(store[medicineKey])
    ? store[medicineKey]
    : store[medicineKey]
      ? [store[medicineKey]]
      : [];

  const matchIndex = existing.findIndex((entry) => {
    const existingId = entry && (entry.id || entry.orderNumber);
    const nextId = orderSnapshot && (orderSnapshot.id || orderSnapshot.orderNumber);
    return String(existingId) === String(nextId);
  });

  if (matchIndex >= 0) {
    existing[matchIndex] = { ...existing[matchIndex], ...orderSnapshot };
  } else {
    existing.push(orderSnapshot);
  }

  store[medicineKey] = existing;
}

export const reorderService = {
  /**
   * Fetch all reorders from API with default mock orders and localStorage fallback
   */
  async getAllOrders() {
    return this.getAll();
  },

  async getAll() {
    let apiData = [];
    try {
      const { data } = await api.get("/reorders");
      apiData = data || [];
    } catch {
      apiData = [];
    }

    const localStore = getLocalStore();
    const orderMap = new Map();

    const addLocalMedicineOrders = () => {
      Object.keys(localStore).forEach((key) => {
        if (!key.startsWith("med_")) return;
        const value = localStore[key];
        const entries = Array.isArray(value) ? value : value ? [value] : [];
        entries.forEach((entry) => {
          if (!entry || !entry.id) return;
          orderMap.set(String(entry.id), {
            ...entry,
            medicineId: entry.medicineId || entry.medicine?.id,
            orderNumber: entry.orderNumber || `ORD-${String(entry.id).padStart(3, "0")}`,
          });
        });
      });
    };

    if (apiData.length > 0) {
      // 1. Backend data is active: use real database orders as the primary source of truth
      apiData.forEach((ord) => {
        const medId = ord.medicine?.id || ord.medicineId;
        const idKey = String(ord.id);
        const localOverride =
          localStore[idKey] ||
          localStore[`ORD-${String(ord.id).padStart(3, "0")}`] ||
          {};

        orderMap.set(idKey, {
          ...ord,
          orderNumber: ord.orderNumber || `ORD-${String(ord.id).padStart(3, "0")}`,
          medicineId: medId,
          ...localOverride,
          id: ord.id,
        });
      });
    } else {
      // 2. Fallback to default approved orders if backend has no orders
      DEFAULT_APPROVED_ORDERS.forEach((ord) => {
        const idKey = String(ord.id);
        const localOverride = localStore[idKey] || {};
        orderMap.set(idKey, { ...ord, ...localOverride });
      });
    }

    addLocalMedicineOrders();

    // 3. Overlay any offline newly created orders that are not in apiData
    Object.keys(localStore).forEach((key) => {
      if (key.startsWith("ORD-LOC-") || (key.startsWith("ORD-") && apiData.length === 0)) {
        const stored = localStore[key];
        if (stored && stored.id && !orderMap.has(String(stored.id))) {
          orderMap.set(String(stored.id), stored);
        }
      }
    });

    return Array.from(orderMap.values());
  },

  async getById(id) {
    const all = await this.getAll();
    return all.find((o) => String(o.id) === String(id)) || null;
  },

  async create(orderData) {
    try {
      const { data } = await api.post("/reorders", orderData);
      const localStore = getLocalStore();
      localStore[data.id] = data;
      if (data.medicine?.id) {
        appendMedicineOrderSnapshot(localStore, data.medicine.id, data);
      }
      saveLocalStore(localStore);
      return data;
    } catch {
      const localStore = getLocalStore();
      const fallbackId = `ORD-LOC-${Date.now()}`;
      const newOrder = {
        id: fallbackId,
        orderNumber: fallbackId,
        ...orderData,
        status: orderData.status || "ORDERED",
        createdAt: new Date().toISOString(),
      };
      localStore[fallbackId] = newOrder;
      if (orderData.medicine?.id || orderData.medicineId) {
        const medId = orderData.medicine?.id || orderData.medicineId;
        appendMedicineOrderSnapshot(localStore, medId, newOrder);
      }
      saveLocalStore(localStore);
      return newOrder;
    }
  },

  async approve(id, approvedQuantity) {
    const localStore = getLocalStore();
    const updatePayload = {
      status: "ORDERED",
      approvedQuantity: Number(approvedQuantity),
      approvedDate: new Date().toISOString(),
    };

    let numericId = Number(id);
    if (isNaN(numericId)) {
      const match = String(id).match(/\d+/);
      if (match) numericId = Number(match[0]);
    }

    if (!isNaN(numericId) && numericId > 0) {
      try {
        const { data } = await api.put(`/reorders/${numericId}/approve`, {
          approvedQuantity: Number(approvedQuantity),
        });
        localStore[id] = { ...(localStore[id] || {}), ...data, ...updatePayload };
        localStore[numericId] = localStore[id];
        if (data.medicine?.id) {
          appendMedicineOrderSnapshot(localStore, data.medicine.id, localStore[id]);
        }
        saveLocalStore(localStore);
        return localStore[id];
      } catch (e) {
        console.warn("Backend approve failed, falling back locally:", e);
      }
    }

    // Local fallback
    localStore[id] = { ...(localStore[id] || {}), id, ...updatePayload };
    if (localStore[id] && localStore[id].medicine?.id) {
      appendMedicineOrderSnapshot(localStore, localStore[id].medicine.id, localStore[id]);
    }
    saveLocalStore(localStore);
    return localStore[id];
  },

  async reject(id, reason = "") {
    const localStore = getLocalStore();
    const updatePayload = {
      status: "REJECTED",
      reason: reason || "Rejected by administrator",
      updatedAt: new Date().toISOString(),
    };

    let numericId = Number(id);
    if (isNaN(numericId)) {
      const match = String(id).match(/\d+/);
      if (match) numericId = Number(match[0]);
    }

    if (!isNaN(numericId) && numericId > 0) {
      try {
        const { data } = await api.put(`/reorders/${numericId}/reject`, { reason });
        localStore[id] = { ...(localStore[id] || {}), ...data, ...updatePayload };
        localStore[numericId] = localStore[id];
        saveLocalStore(localStore);
        return localStore[id];
      } catch (e) {
        console.warn("Backend reject failed, falling back locally:", e);
      }
    }

    localStore[id] = { ...(localStore[id] || {}), id, ...updatePayload };
    saveLocalStore(localStore);
    return localStore[id];
  },

  /**
   * Receive Goods: Marks the order as RECEIVED and stores receipt details
   */
  async receive(id, receiveData = {}) {
    const localStore = getLocalStore();
    const updatePayload = {
      status: "RECEIVED",
      receivedDate: new Date().toISOString(),
      actualReceivedQuantity: Number(receiveData.actualReceivedQuantity || receiveData.quantity || 0),
      batchNumber: receiveData.batchNumber || "",
      ...receiveData,
    };

    let numericId = Number(id);
    if (isNaN(numericId)) {
      const match = String(id).match(/\d+/);
      if (match) numericId = Number(match[0]);
    }

    if (!isNaN(numericId) && numericId > 0) {
      try {
        const { data } = await api.put(`/reorders/${numericId}/receive`, receiveData);
        localStore[id] = { ...(localStore[id] || {}), ...data, ...updatePayload };
        localStore[numericId] = localStore[id];
        if (receiveData.medicineId || data.medicine?.id) {
          const medId = receiveData.medicineId || data.medicine?.id;
          appendMedicineOrderSnapshot(localStore, medId, localStore[id]);
        }
        saveLocalStore(localStore);
        return localStore[id];
      } catch (err) {
        console.warn("Backend receive failed, using local update", err);
      }
    }

    // Local fallback
    localStore[id] = { ...(localStore[id] || {}), id, ...updatePayload };
    if (receiveData.medicineId) {
      appendMedicineOrderSnapshot(localStore, receiveData.medicineId, localStore[id]);
    }
    saveLocalStore(localStore);
    return localStore[id];
  },

  // State persistence per medicine ID (so UI can track approvals/rejections across all items)
  getMedicineReorderStatus(medicineId) {
    const localStore = getLocalStore();
    const stored = localStore[`med_${medicineId}`];
    if (Array.isArray(stored)) {
      return stored[stored.length - 1] || null;
    }
    return stored || null;
  },

  saveMedicineReorderStatus(medicineId, orderData) {
    const localStore = getLocalStore();
    const orderId = orderData?.id || `med_${medicineId}_latest`;
    const snapshot = {
      ...(localStore[`med_${medicineId}`] && !Array.isArray(localStore[`med_${medicineId}`])
        ? localStore[`med_${medicineId}`]
        : {}),
      ...orderData,
      id: orderId,
    };

    appendMedicineOrderSnapshot(localStore, medicineId, snapshot);
    saveLocalStore(localStore);
    return localStore[`med_${medicineId}`];
  },
};
