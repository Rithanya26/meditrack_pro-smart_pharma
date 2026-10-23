import api from "./api";

const LOCAL_BATCHES_KEY = "meditrack_custom_batches";

function getLocalBatches() {
  try {
    const raw = localStorage.getItem(LOCAL_BATCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // Deduplicate on read
    const seen = new Set();
    return parsed.filter((b) => {
      const num = (b.batchNumber || "").trim().toUpperCase();
      if (!num) return true;
      if (seen.has(num)) return false;
      seen.add(num);
      return true;
    });
  } catch {
    return [];
  }
}

function saveLocalBatch(batch) {
  try {
    const batches = getLocalBatches();
    const batchNum = (batch.batchNumber || "").trim().toUpperCase();
    const existingIdx = batches.findIndex(
      (b) =>
        (batchNum && (b.batchNumber || "").trim().toUpperCase() === batchNum) ||
        (batch.id && String(b.id) === String(batch.id))
    );
    if (existingIdx >= 0) {
      batches[existingIdx] = { ...batches[existingIdx], ...batch };
    } else {
      batches.unshift(batch);
    }
    localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(batches));
  } catch (e) {
    console.error("Failed to save local batch", e);
  }
}

function removeLocalBatchByNumber(batchNumber) {
  try {
    if (!batchNumber) return;
    const target = batchNumber.trim().toUpperCase();
    const batches = getLocalBatches().filter(
      (b) => (b.batchNumber || "").trim().toUpperCase() !== target
    );
    localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(batches));
  } catch (e) {
    console.error("Failed to remove local batch", e);
  }
}

function normalizeBatch(batch) {
  return {
    ...batch,
    medicineId: batch.medicine?.id || batch.medicineId,
    productId: batch.medicine?.id || batch.productId,
    medicine: batch.medicine,
  };
}

export const batchService = {
  async getAll() {
    let apiBatches = [];
    try {
      const { data } = await api.get("/batches");
      apiBatches = data || [];
    } catch {
      apiBatches = [];
    }

    const localBatches = getLocalBatches();

    // If backend returned batches, clean up any local fallbacks that already exist in backend
    if (apiBatches.length > 0) {
      const backendBatchNumbers = new Set(
        apiBatches.map((b) => (b.batchNumber || "").trim().toUpperCase()).filter(Boolean)
      );
      const remainingLocal = localBatches.filter(
        (b) => !backendBatchNumbers.has((b.batchNumber || "").trim().toUpperCase())
      );
      if (remainingLocal.length !== localBatches.length) {
        try {
          localStorage.setItem(LOCAL_BATCHES_KEY, JSON.stringify(remainingLocal));
        } catch {
          // Ignore
        }
      }
    }

    // Deduplicate strictly by batchNumber (case-insensitive) as the primary identity
    const map = new Map();

    apiBatches.forEach((b) => {
      const normalized = normalizeBatch(b);
      const key = normalized.batchNumber
        ? normalized.batchNumber.trim().toUpperCase()
        : `ID_${normalized.id}`;
      map.set(key, normalized);
    });

    localBatches.forEach((b) => {
      const normalized = normalizeBatch(b);
      const key = normalized.batchNumber
        ? normalized.batchNumber.trim().toUpperCase()
        : `ID_${normalized.id}`;
      // Never overwrite real backend batch with local fallback
      if (!map.has(key)) {
        map.set(key, normalized);
      }
    });

    return Array.from(map.values());
  },

  async getById(id) {
    try {
      const { data } = await api.get(`/batches/${id}`);
      return normalizeBatch(data);
    } catch {
      const local = getLocalBatches().find((b) => String(b.id) === String(id));
      return local ? normalizeBatch(local) : null;
    }
  },

  async getByMedicine(medicineId) {
    const all = await this.getAll();
    return all.filter((b) => String(b.medicineId || b.medicine?.id) === String(medicineId));
  },

  async create(data) {
    const medicineId = Number(data.productId || data.medicineId);
    const batchNumber = (data.batchNumber || "").trim();
    const payload = {
      ...data,
      batchNumber,
      medicine: { id: medicineId },
    };
    delete payload.productId;
    delete payload.medicineId;
    delete payload.genericMedicine;

    try {
      const { data: batch } = await api.post("/batches", payload);
      const normalized = normalizeBatch(batch);
      // Clean up any stale local fallback with this batch number
      removeLocalBatchByNumber(batchNumber);
      return normalized;
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.response?.data?.error || err.message || "";

      // If backend rejected because the batch number is already registered, do NOT create a fake local duplicate
      if (
        (err.response?.status === 400 || err.response?.status === 409) &&
        errorMsg.toLowerCase().includes("already in use")
      ) {
        // Purge any local duplicate copy
        removeLocalBatchByNumber(batchNumber);
        // Try to fetch the existing backend batch so caller has the verified record
        try {
          const { data: all } = await api.get("/batches");
          const existing = (all || []).find(
            (b) => (b.batchNumber || "").trim().toUpperCase() === batchNumber.toUpperCase()
          );
          if (existing) {
            return normalizeBatch(existing);
          }
        } catch {
          // Ignore
        }
        throw new Error(`Batch number ${batchNumber} is already registered in the system.`);
      }

      console.warn("Backend batch creation failed, storing locally:", err);
      // Check if already in local storage
      const existingLoc = getLocalBatches().find(
        (b) => (b.batchNumber || "").trim().toUpperCase() === batchNumber.toUpperCase()
      );
      if (existingLoc) {
        return normalizeBatch(existingLoc);
      }

      const fallbackBatch = {
        id: `BAT-LOC-${Date.now()}`,
        ...payload,
        medicine: data.medicine || { id: medicineId },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const normalized = normalizeBatch(fallbackBatch);
      saveLocalBatch(normalized);
      return normalized;
    }
  },

  async update(id, data) {
    const medicineId = Number(data.productId || data.medicineId);
    const payload = {
      ...data,
      medicine: { id: medicineId },
    };
    delete payload.productId;
    delete payload.medicineId;
    delete payload.genericMedicine;

    try {
      const { data: batch } = await api.put(`/batches/${id}`, payload);
      const normalized = normalizeBatch(batch);
      saveLocalBatch(normalized);
      return normalized;
    } catch {
      const fallback = { id, ...payload };
      const normalized = normalizeBatch(fallback);
      saveLocalBatch(normalized);
      return normalized;
    }
  },
};

