// Mock pharmacy data for MediTrack Pro
// Realistic medicines, batches, inventory, dispensing transactions, audit logs, users

export const mockUsers = [
  {
    id: "USR-001",
    name: "Dr. Sarah Mitchell",
    email: "admin@meditrack.com",
    phone: "+1-555-0101",
    role: "admin",
    status: "active",
    createdAt: "2025-01-15T09:00:00Z",
    avatar: "SM",
  },
  {
    id: "USR-002",
    name: "James Carter",
    email: "pharmacist@meditrack.com",
    phone: "+1-555-0102",
    role: "pharmacist",
    status: "active",
    createdAt: "2025-02-20T09:00:00Z",
    avatar: "JC",
  },
  {
    id: "USR-003",
    name: "Emily Rodriguez",
    email: "emily@meditrack.com",
    phone: "+1-555-0103",
    role: "pharmacist",
    status: "active",
    createdAt: "2025-03-10T09:00:00Z",
    avatar: "ER",
  },
  {
    id: "USR-004",
    name: "Michael Chen",
    email: "michael@meditrack.com",
    phone: "+1-555-0104",
    role: "pharmacist",
    status: "inactive",
    createdAt: "2025-04-05T09:00:00Z",
    avatar: "MC",
  },
];

// Demo passwords (stored only for mock login — never do this in production)
export const mockCredentials = {
  "admin@meditrack.com": "admin123",
  "pharmacist@meditrack.com": "pharma123",
};

export const mockMedicines = [
  { id: "MED-001", name: "Paracetamol 500mg", genericName: "Acetaminophen", category: "Tablets", manufacturer: "MediCorp Ltd", strength: "500mg", dosageForm: "Tablet", description: "Pain reliever and fever reducer", status: "active", createdAt: "2025-01-20T10:00:00Z" },
  { id: "MED-002", name: "Amoxicillin 500mg", genericName: "Amoxicillin", category: "Capsules", manufacturer: "PharmaHealth Inc", strength: "500mg", dosageForm: "Capsule", description: "Broad-spectrum antibiotic", status: "active", createdAt: "2025-01-22T10:00:00Z" },
  { id: "MED-003", name: "Cetirizine 10mg", genericName: "Cetirizine Hydrochloride", category: "Tablets", manufacturer: "AllerCare Pharma", strength: "10mg", dosageForm: "Tablet", description: "Antihistamine for allergies", status: "active", createdAt: "2025-01-25T10:00:00Z" },
  { id: "MED-004", name: "Ibuprofen 400mg", genericName: "Ibuprofen", category: "Tablets", manufacturer: "MediCorp Ltd", strength: "400mg", dosageForm: "Tablet", description: "NSAID for pain and inflammation", status: "active", createdAt: "2025-02-01T10:00:00Z" },
  { id: "MED-005", name: "Omeprazole 20mg", genericName: "Omeprazole", category: "Capsules", manufacturer: "GastroPharma", strength: "20mg", dosageForm: "Capsule", description: "Proton pump inhibitor for acid reflux", status: "active", createdAt: "2025-02-05T10:00:00Z" },
  { id: "MED-006", name: "Cough Syrup 100ml", genericName: "Dextromethorphan", category: "Syrups", manufacturer: "RespiraCare", strength: "100ml", dosageForm: "Syrup", description: "Cough suppressant syrup", status: "active", createdAt: "2025-02-10T10:00:00Z" },
  { id: "MED-007", name: "Insulin Glargine", genericName: "Insulin Glargine", category: "Injections", manufacturer: "DiabetesCare Inc", strength: "100IU/ml", dosageForm: "Injection", description: "Long-acting insulin for diabetes", status: "active", createdAt: "2025-02-15T10:00:00Z" },
  { id: "MED-008", name: "Hydrocortisone Cream", genericName: "Hydrocortisone", category: "Creams", manufacturer: "DermaHealth", strength: "1%", dosageForm: "Cream", description: "Topical corticosteroid for skin conditions", status: "active", createdAt: "2025-02-20T10:00:00Z" },
  { id: "MED-009", name: "Aspirin 75mg", genericName: "Acetylsalicylic Acid", category: "Tablets", manufacturer: "MediCorp Ltd", strength: "75mg", dosageForm: "Tablet", description: "Antiplatelet for cardiovascular protection", status: "active", createdAt: "2025-03-01T10:00:00Z" },
  { id: "MED-010", name: "Metformin 500mg", genericName: "Metformin Hydrochloride", category: "Tablets", manufacturer: "DiabetesCare Inc", strength: "500mg", dosageForm: "Tablet", description: "Oral antidiabetic for type 2 diabetes", status: "active", createdAt: "2025-03-05T10:00:00Z" },
  { id: "MED-011", name: "Azithromycin 250mg", genericName: "Azithromycin", category: "Tablets", manufacturer: "PharmaHealth Inc", strength: "250mg", dosageForm: "Tablet", description: "Macrolide antibiotic", status: "active", createdAt: "2025-03-10T10:00:00Z" },
  { id: "MED-012", name: "Ranitidine 150mg", genericName: "Ranitidine", category: "Tablets", manufacturer: "GastroPharma", strength: "150mg", dosageForm: "Tablet", description: "H2 blocker for stomach acid", status: "inactive", createdAt: "2025-03-15T10:00:00Z" },
  { id: "MED-013", name: "Vitamin D3 2000IU", genericName: "Cholecalciferol", category: "Capsules", manufacturer: "NutriPharma", strength: "2000IU", dosageForm: "Capsule", description: "Vitamin D supplement", status: "active", createdAt: "2025-03-20T10:00:00Z" },
  { id: "MED-014", name: "Salbutamol Inhaler", genericName: "Salbutamol", category: "Injections", manufacturer: "RespiraCare", strength: "100mcg", dosageForm: "Inhaler", description: "Bronchodilator for asthma", status: "active", createdAt: "2025-04-01T10:00:00Z" },
  { id: "MED-015", name: "Amoxicillin Syrup 250mg/5ml", genericName: "Amoxicillin", category: "Syrups", manufacturer: "PharmaHealth Inc", strength: "250mg/5ml", dosageForm: "Syrup", description: "Pediatric antibiotic syrup", status: "active", createdAt: "2025-04-10T10:00:00Z" },
  { id: "MED-016", name: "Mupirocin Ointment", genericName: "Mupirocin", category: "Ointments", manufacturer: "DermaHealth", strength: "2%", dosageForm: "Ointment", description: "Topical antibiotic ointment", status: "active", createdAt: "2025-04-15T10:00:00Z" },
  { id: "MED-017", name: "Lisinopril 10mg", genericName: "Lisinopril", category: "Tablets", manufacturer: "CardioPharma", strength: "10mg", dosageForm: "Tablet", description: "ACE inhibitor for hypertension", status: "active", createdAt: "2025-04-20T10:00:00Z" },
  { id: "MED-018", name: "Atorvastatin 20mg", genericName: "Atorvastatin", category: "Tablets", manufacturer: "CardioPharma", strength: "20mg", dosageForm: "Tablet", description: "Statin for cholesterol management", status: "active", createdAt: "2025-05-01T10:00:00Z" },
  { id: "MED-019", name: "Ceftriaxone Injection", genericName: "Ceftriaxone", category: "Injections", manufacturer: "PharmaHealth Inc", strength: "1g", dosageForm: "Injection", description: "Cephalosporin antibiotic injection", status: "active", createdAt: "2025-05-10T10:00:00Z" },
  { id: "MED-020", name: "Loratadine 10mg", genericName: "Loratadine", category: "Tablets", manufacturer: "AllerCare Pharma", strength: "10mg", dosageForm: "Tablet", description: "Non-drowsy antihistamine", status: "active", createdAt: "2025-05-15T10:00:00Z" },
];

export const mockBatches = [
  { id: "BAT-001", medicineId: "MED-001", batchNumber: "PCM2026A", manufacturingDate: "2025-06-15", expiryDate: "2027-06-14", supplier: "MediSupply Co", receivedDate: "2025-06-20", quantity: 500, minimumStock: 50 },
  { id: "BAT-002", medicineId: "MED-001", batchNumber: "PCM2026B", manufacturingDate: "2025-09-01", expiryDate: "2027-09-01", supplier: "MediSupply Co", receivedDate: "2025-09-10", quantity: 320, minimumStock: 50 },
  { id: "BAT-003", medicineId: "MED-002", batchNumber: "AMX2026A", manufacturingDate: "2025-08-01", expiryDate: "2026-09-13", supplier: "PharmaDist Ltd", receivedDate: "2025-08-10", quantity: 200, minimumStock: 40 },
  { id: "BAT-004", medicineId: "MED-003", batchNumber: "CTZ2025B", manufacturingDate: "2024-12-01", expiryDate: "2026-08-15", supplier: "AllerSupply", receivedDate: "2024-12-15", quantity: 150, minimumStock: 30 },
  { id: "BAT-005", medicineId: "MED-004", batchNumber: "IBU2027A", manufacturingDate: "2025-10-01", expiryDate: "2027-10-01", supplier: "MediSupply Co", receivedDate: "2025-10-10", quantity: 400, minimumStock: 60 },
  { id: "BAT-006", medicineId: "MED-005", batchNumber: "OMP2026C", manufacturingDate: "2025-05-01", expiryDate: "2026-11-01", supplier: "GastroSupply", receivedDate: "2025-05-10", quantity: 180, minimumStock: 35 },
  { id: "BAT-007", medicineId: "MED-006", batchNumber: "CGH2027A", manufacturingDate: "2025-11-01", expiryDate: "2027-05-01", supplier: "RespiraDist", receivedDate: "2025-11-10", quantity: 90, minimumStock: 25 },
  { id: "BAT-008", medicineId: "MED-007", batchNumber: "INS2026A", manufacturingDate: "2025-04-01", expiryDate: "2026-04-01", supplier: "DiabetesSupply", receivedDate: "2025-04-10", quantity: 60, minimumStock: 20 },
  { id: "BAT-009", medicineId: "MED-008", batchNumber: "HCC2027A", manufacturingDate: "2025-07-01", expiryDate: "2027-07-01", supplier: "DermaSupply", receivedDate: "2025-07-10", quantity: 120, minimumStock: 25 },
  { id: "BAT-010", medicineId: "MED-009", batchNumber: "ASP2027A", manufacturingDate: "2025-12-01", expiryDate: "2027-12-01", supplier: "MediSupply Co", receivedDate: "2025-12-10", quantity: 600, minimumStock: 80 },
  { id: "BAT-011", medicineId: "MED-010", batchNumber: "MET2026B", manufacturingDate: "2025-03-01", expiryDate: "2026-09-20", supplier: "DiabetesSupply", receivedDate: "2025-03-10", quantity: 18, minimumStock: 50 },
  { id: "BAT-012", medicineId: "MED-011", batchNumber: "AZT2027A", manufacturingDate: "2025-09-01", expiryDate: "2027-09-01", supplier: "PharmaDist Ltd", receivedDate: "2025-09-10", quantity: 250, minimumStock: 40 },
  { id: "BAT-013", medicineId: "MED-013", batchNumber: "VTD2027A", manufacturingDate: "2025-08-01", expiryDate: "2027-08-01", supplier: "NutriSupply", receivedDate: "2025-08-10", quantity: 300, minimumStock: 50 },
  { id: "BAT-014", medicineId: "MED-014", batchNumber: "SAL2026A", manufacturingDate: "2025-02-01", expiryDate: "2026-10-01", supplier: "RespiraDist", receivedDate: "2025-02-10", quantity: 45, minimumStock: 15 },
  { id: "BAT-015", medicineId: "MED-015", batchNumber: "AMXS2026A", manufacturingDate: "2025-06-01", expiryDate: "2026-09-10", supplier: "PharmaDist Ltd", receivedDate: "2025-06-10", quantity: 75, minimumStock: 20 },
  { id: "BAT-016", medicineId: "MED-016", batchNumber: "MUP2027A", manufacturingDate: "2025-10-01", expiryDate: "2027-10-01", supplier: "DermaSupply", receivedDate: "2025-10-10", quantity: 80, minimumStock: 20 },
  { id: "BAT-017", medicineId: "MED-017", batchNumber: "LIS2027A", manufacturingDate: "2025-11-01", expiryDate: "2027-11-01", supplier: "CardioSupply", receivedDate: "2025-11-10", quantity: 200, minimumStock: 45 },
  { id: "BAT-018", medicineId: "MED-018", batchNumber: "ATR2026B", manufacturingDate: "2025-01-01", expiryDate: "2026-12-15", supplier: "CardioSupply", receivedDate: "2025-01-10", quantity: 12, minimumStock: 40 },
  { id: "BAT-019", medicineId: "MED-019", batchNumber: "CFT2027A", manufacturingDate: "2025-09-01", expiryDate: "2027-09-01", supplier: "PharmaDist Ltd", receivedDate: "2025-09-10", quantity: 100, minimumStock: 30 },
  { id: "BAT-020", medicineId: "MED-020", batchNumber: "LOR2027A", manufacturingDate: "2025-12-01", expiryDate: "2027-12-01", supplier: "AllerSupply", receivedDate: "2025-12-10", quantity: 280, minimumStock: 45 },
  { id: "BAT-021", medicineId: "MED-001", batchNumber: "PCM2025C", manufacturingDate: "2024-06-01", expiryDate: "2026-06-01", supplier: "MediSupply Co", receivedDate: "2024-06-15", quantity: 0, minimumStock: 50 },
  { id: "BAT-022", medicineId: "MED-002", batchNumber: "AMX2027B", manufacturingDate: "2025-11-01", expiryDate: "2027-11-01", supplier: "PharmaDist Ltd", receivedDate: "2025-11-10", quantity: 150, minimumStock: 40 },
  { id: "BAT-023", medicineId: "MED-006", batchNumber: "CGH2026B", manufacturingDate: "2024-11-01", expiryDate: "2026-09-20", supplier: "RespiraDist", receivedDate: "2024-11-10", quantity: 35, minimumStock: 25 },
  { id: "BAT-024", medicineId: "MED-010", batchNumber: "MET2027A", manufacturingDate: "2025-10-01", expiryDate: "2027-10-01", supplier: "DiabetesSupply", receivedDate: "2025-10-10", quantity: 220, minimumStock: 50 },
  { id: "BAT-025", medicineId: "MED-003", batchNumber: "CTZ2027A", manufacturingDate: "2025-10-01", expiryDate: "2027-10-01", supplier: "AllerSupply", receivedDate: "2025-10-10", quantity: 200, minimumStock: 30 },
];

export const mockDispensing = [
  { id: "TRX-20260826-0001", medicineId: "MED-001", medicineName: "Paracetamol 500mg", batchId: "BAT-001", batchNumber: "PCM2026A", quantity: 20, pharmacistId: "USR-002", pharmacistName: "James Carter", date: "2026-08-26T09:15:00Z", status: "completed" },
  { id: "TRX-20260826-0002", medicineId: "MED-004", medicineName: "Ibuprofen 400mg", batchId: "BAT-005", batchNumber: "IBU2027A", quantity: 15, pharmacistId: "USR-002", pharmacistName: "James Carter", date: "2026-08-26T10:30:00Z", status: "completed" },
  { id: "TRX-20260826-0003", medicineId: "MED-009", medicineName: "Aspirin 75mg", batchId: "BAT-010", batchNumber: "ASP2027A", quantity: 30, pharmacistId: "USR-003", pharmacistName: "Emily Rodriguez", date: "2026-08-26T11:00:00Z", status: "completed" },
  { id: "TRX-20260825-0004", medicineId: "MED-002", medicineName: "Amoxicillin 500mg", batchId: "BAT-003", batchNumber: "AMX2026A", quantity: 10, pharmacistId: "USR-002", pharmacistName: "James Carter", date: "2026-08-25T14:20:00Z", status: "completed" },
  { id: "TRX-20260825-0005", medicineId: "MED-013", medicineName: "Vitamin D3 2000IU", batchId: "BAT-013", batchNumber: "VTD2027A", quantity: 25, pharmacistId: "USR-003", pharmacistName: "Emily Rodriguez", date: "2026-08-25T15:45:00Z", status: "completed" },
  { id: "TRX-20260824-0006", medicineId: "MED-010", medicineName: "Metformin 500mg", batchId: "BAT-011", batchNumber: "MET2026B", quantity: 10, pharmacistId: "USR-002", pharmacistName: "James Carter", date: "2026-08-24T09:30:00Z", status: "completed" },
  { id: "TRX-20260824-0007", medicineId: "MED-001", medicineName: "Paracetamol 500mg", batchId: "BAT-002", batchNumber: "PCM2026B", quantity: 40, pharmacistId: "USR-003", pharmacistName: "Emily Rodriguez", date: "2026-08-24T11:15:00Z", status: "completed" },
  { id: "TRX-20260823-0008", medicineId: "MED-011", medicineName: "Azithromycin 250mg", batchId: "BAT-012", batchNumber: "AZT2027A", quantity: 6, pharmacistId: "USR-002", pharmacistName: "James Carter", date: "2026-08-23T16:00:00Z", status: "completed" },
  { id: "TRX-20260822-0009", medicineId: "MED-020", medicineName: "Loratadine 10mg", batchId: "BAT-020", batchNumber: "LOR2027A", quantity: 14, pharmacistId: "USR-003", pharmacistName: "Emily Rodriguez", date: "2026-08-22T10:20:00Z", status: "completed" },
  { id: "TRX-20260821-0010", medicineId: "MED-017", medicineName: "Lisinopril 10mg", batchId: "BAT-017", batchNumber: "LIS2027A", quantity: 30, pharmacistId: "USR-002", pharmacistName: "James Carter", date: "2026-08-21T13:45:00Z", status: "completed" },
  { id: "TRX-20260820-0011", medicineId: "MED-005", medicineName: "Omeprazole 20mg", batchId: "BAT-006", batchNumber: "OMP2026C", quantity: 14, pharmacistId: "USR-003", pharmacistName: "Emily Rodriguez", date: "2026-08-20T09:00:00Z", status: "completed" },
  { id: "TRX-20260819-0012", medicineId: "MED-009", medicineName: "Aspirin 75mg", batchId: "BAT-010", batchNumber: "ASP2027A", quantity: 20, pharmacistId: "USR-002", pharmacistName: "James Carter", date: "2026-08-19T11:30:00Z", status: "completed" },
];

// Parent transactions created by the multi-medicine dispensing workflow.
export const mockDispensingTransactions = [];

export const mockAuditLogs = [
  { id: "AUD-001", timestamp: "2026-08-26T07:30:00Z", userId: "USR-001", userName: "Dr. Sarah Mitchell", role: "admin", action: "LOGIN", entity: "Auth", entityId: "USR-001", description: "Admin logged into the system" },
  { id: "AUD-002", timestamp: "2026-08-26T08:00:00Z", userId: "USR-002", userName: "James Carter", role: "pharmacist", action: "LOGIN", entity: "Auth", entityId: "USR-002", description: "Pharmacist logged into the system" },
  { id: "AUD-003", timestamp: "2026-08-26T09:15:00Z", userId: "USR-002", userName: "James Carter", role: "pharmacist", action: "MEDICINE_DISPENSED", entity: "Dispensing", entityId: "TRX-20260826-0001", description: "Dispensed 20 units of Paracetamol 500mg from batch PCM2026A" },
  { id: "AUD-004", timestamp: "2026-08-26T10:30:00Z", userId: "USR-002", userName: "James Carter", role: "pharmacist", action: "MEDICINE_DISPENSED", entity: "Dispensing", entityId: "TRX-20260826-0002", description: "Dispensed 15 units of Ibuprofen 400mg from batch IBU2027A" },
  { id: "AUD-005", timestamp: "2026-08-26T11:00:00Z", userId: "USR-003", userName: "Emily Rodriguez", role: "pharmacist", action: "MEDICINE_DISPENSED", entity: "Dispensing", entityId: "TRX-20260826-0003", description: "Dispensed 30 units of Aspirin 75mg from batch ASP2027A" },
  { id: "AUD-006", timestamp: "2026-08-25T16:00:00Z", userId: "USR-001", userName: "Dr. Sarah Mitchell", role: "admin", action: "MEDICINE_CREATED", entity: "Medicine", entityId: "MED-020", description: "Added new medicine: Loratadine 10mg" },
  { id: "AUD-007", timestamp: "2026-08-25T14:20:00Z", userId: "USR-002", userName: "James Carter", role: "pharmacist", action: "MEDICINE_DISPENSED", entity: "Dispensing", entityId: "TRX-20260825-0004", description: "Dispensed 10 units of Amoxicillin 500mg from batch AMX2026A" },
  { id: "AUD-008", timestamp: "2026-08-24T08:00:00Z", userId: "USR-001", userName: "Dr. Sarah Mitchell", role: "admin", action: "BATCH_CREATED", entity: "Batch", entityId: "BAT-025", description: "Added new batch CTZ2027A for Cetirizine 10mg" },
  { id: "AUD-009", timestamp: "2026-08-24T11:15:00Z", userId: "USR-003", userName: "Emily Rodriguez", role: "pharmacist", action: "MEDICINE_DISPENSED", entity: "Dispensing", entityId: "TRX-20260824-0007", description: "Dispensed 40 units of Paracetamol 500mg from batch PCM2026B" },
  { id: "AUD-010", timestamp: "2026-08-23T13:00:00Z", userId: "USR-001", userName: "Dr. Sarah Mitchell", role: "admin", action: "INVENTORY_UPDATED", entity: "Inventory", entityId: "BAT-005", description: "Stock adjusted for Ibuprofen 400mg batch IBU2027A: +50 units" },
  { id: "AUD-011", timestamp: "2026-08-23T16:00:00Z", userId: "USR-002", userName: "James Carter", role: "pharmacist", action: "MEDICINE_DISPENSED", entity: "Dispensing", entityId: "TRX-20260823-0008", description: "Dispensed 6 units of Azithromycin 250mg from batch AZT2027A" },
  { id: "AUD-012", timestamp: "2026-08-22T09:30:00Z", userId: "USR-001", userName: "Dr. Sarah Mitchell", role: "admin", action: "USER_UPDATED", entity: "User", entityId: "USR-004", description: "Deactivated pharmacist account: Michael Chen" },
  { id: "AUD-013", timestamp: "2026-08-22T10:20:00Z", userId: "USR-003", userName: "Emily Rodriguez", role: "pharmacist", action: "MEDICINE_DISPENSED", entity: "Dispensing", entityId: "TRX-20260822-0009", description: "Dispensed 14 units of Loratadine 10mg from batch LOR2027A" },
  { id: "AUD-014", timestamp: "2026-08-21T08:00:00Z", userId: "USR-001", userName: "Dr. Sarah Mitchell", role: "admin", action: "MEDICINE_UPDATED", entity: "Medicine", entityId: "MED-012", description: "Deactivated medicine: Ranitidine 150mg" },
  { id: "AUD-015", timestamp: "2026-08-21T13:45:00Z", userId: "USR-002", userName: "James Carter", role: "pharmacist", action: "MEDICINE_DISPENSED", entity: "Dispensing", entityId: "TRX-20260821-0010", description: "Dispensed 30 units of Lisinopril 10mg from batch LIS2027A" },
  { id: "AUD-016", timestamp: "2026-08-20T10:00:00Z", userId: "USR-001", userName: "Dr. Sarah Mitchell", role: "admin", action: "USER_CREATED", entity: "User", entityId: "USR-003", description: "Added new pharmacist: Emily Rodriguez" },
  { id: "AUD-017", timestamp: "2026-08-20T09:00:00Z", userId: "USR-003", userName: "Emily Rodriguez", role: "pharmacist", action: "MEDICINE_DISPENSED", entity: "Dispensing", entityId: "TRX-20260820-0011", description: "Dispensed 14 units of Omeprazole 20mg from batch OMP2026C" },
  { id: "AUD-018", timestamp: "2026-08-19T11:30:00Z", userId: "USR-002", userName: "James Carter", role: "pharmacist", action: "MEDICINE_DISPENSED", entity: "Dispensing", entityId: "TRX-20260819-0012", description: "Dispensed 20 units of Aspirin 75mg from batch ASP2027A" },
  { id: "AUD-019", timestamp: "2026-08-19T08:00:00Z", userId: "USR-001", userName: "Dr. Sarah Mitchell", role: "admin", action: "BATCH_CREATED", entity: "Batch", entityId: "BAT-024", description: "Added new batch MET2027A for Metformin 500mg" },
  { id: "AUD-020", timestamp: "2026-08-18T15:00:00Z", userId: "USR-001", userName: "Dr. Sarah Mitchell", role: "admin", action: "INVENTORY_UPDATED", entity: "Inventory", entityId: "BAT-011", description: "Low stock alert triggered for Metformin 500mg" },
];

export const mockNotifications = [
  { id: "NOTIF-001", type: "low_stock", title: "Low Stock Alert", description: "Metformin 500mg is below minimum threshold (18/50)", time: "2026-08-26T08:00:00Z", read: false },
  { id: "NOTIF-002", type: "near_expiry", title: "Near Expiry Alert", description: "Amoxicillin 500mg batch AMX2026A expires in 18 days", time: "2026-08-26T07:45:00Z", read: false },
  { id: "NOTIF-003", type: "expired", title: "Expired Batch Alert", description: "Cetirizine 10mg batch CTZ2025B has expired", time: "2026-08-26T06:00:00Z", read: false },
  { id: "NOTIF-004", type: "low_stock", title: "Low Stock Alert", description: "Atorvastatin 20mg is below minimum threshold (12/40)", time: "2026-08-25T16:30:00Z", read: true },
  { id: "NOTIF-005", type: "dispensing", title: "Dispensing Activity", description: "James Carter dispensed Paracetamol 500mg", time: "2026-08-26T09:15:00Z", read: true },
  { id: "NOTIF-006", type: "near_expiry", title: "Near Expiry Alert", description: "Cough Syrup batch CGH2026B expires in 25 days", time: "2026-08-25T10:00:00Z", read: true },
];

// Monthly dispensing chart data (last 12 months)
export const monthlyDispensingData = [
  { month: "Sep", quantity: 320 },
  { month: "Oct", quantity: 410 },
  { month: "Nov", quantity: 380 },
  { month: "Dec", quantity: 520 },
  { month: "Jan", quantity: 450 },
  { month: "Feb", quantity: 480 },
  { month: "Mar", quantity: 530 },
  { month: "Apr", quantity: 490 },
  { month: "May", quantity: 560 },
  { month: "Jun", quantity: 610 },
  { month: "Jul", quantity: 580 },
  { month: "Aug", quantity: 640 },
];

export const inventoryByCategoryData = [
  { name: "Tablets", value: 1850, color: "#2487eb" },
  { name: "Capsules", value: 780, color: "#10b981" },
  { name: "Syrups", value: 200, color: "#f59e0b" },
  { name: "Injections", value: 205, color: "#8b5cf6" },
  { name: "Creams", value: 120, color: "#ec4899" },
  { name: "Ointments", value: 80, color: "#06b6d4" },
];

export const stockStatusData = [
  { name: "Healthy", value: 16, color: "#10b981" },
  { name: "Low Stock", value: 3, color: "#f59e0b" },
  { name: "Out of Stock", value: 1, color: "#ef4444" },
];

export const expiryDistributionData = [
  { name: "Safe", value: 17, color: "#10b981" },
  { name: "Near Expiry", value: 4, color: "#f59e0b" },
  { name: "Critical", value: 2, color: "#f97316" },
  { name: "Expired", value: 2, color: "#ef4444" },
];

export const CATEGORIES = ["Tablets", "Capsules", "Syrups", "Injections", "Creams", "Ointments"];
export const DOSAGE_FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Ointment", "Inhaler"];
export const AUDIT_ACTIONS = [
  "LOGIN",
  "MEDICINE_CREATED",
  "MEDICINE_UPDATED",
  "BATCH_CREATED",
  "INVENTORY_UPDATED",
  "MEDICINE_DISPENSED",
  "USER_CREATED",
  "USER_UPDATED",
];
