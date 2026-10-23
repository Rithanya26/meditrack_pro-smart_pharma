/**
 * Comprehensive 6-8 Month Historical Dispensing Transactions
 * Covers February 2026 through September 2026 for all 20 medicines.
 * Stored in standard pharmacy dispensing transaction structure.
 */

const CUSTOMERS = [
  { name: "Robert Johnson", phone: "+1-555-0211", patientId: "PAT-1001" },
  { name: "Maria Garcia", phone: "+1-555-0212", patientId: "PAT-1002" },
  { name: "David Smith", phone: "+1-555-0213", patientId: "PAT-1003" },
  { name: "Anna Williams", phone: "+1-555-0214", patientId: "PAT-1004" },
  { name: "Priya Sharma", phone: "+1-555-0215", patientId: "PAT-1005" },
  { name: "Carlos Gomez", phone: "+1-555-0216", patientId: "PAT-1006" },
  { name: "Sarah Jenkins", phone: "+1-555-0217", patientId: "PAT-1007" },
  { name: "John Miller", phone: "+1-555-0218", patientId: "PAT-1008" },
  { name: "Elena Rostova", phone: "+1-555-0219", patientId: "PAT-1009" },
  { name: "Michael Chen", phone: "+1-555-0220", patientId: "PAT-1010" },
  { name: "Anita Desai", phone: "+1-555-0221", patientId: "PAT-1011" },
  { name: "Thomas Wright", phone: "+1-555-0222", patientId: "PAT-1012" },
  { name: "Sunita Rao", phone: "+1-555-0223", patientId: "PAT-1013" },
  { name: "James Wilson", phone: "+1-555-0224", patientId: "PAT-1014" },
  { name: "Aisha Khan", phone: "+1-555-0225", patientId: "PAT-1015" },
  { name: "Daniel Lee", phone: "+1-555-0226", patientId: "PAT-1016" },
  { name: "Meera Joshi", phone: "+1-555-0227", patientId: "PAT-1017" },
  { name: "George Davis", phone: "+1-555-0228", patientId: "PAT-1018" },
  { name: "Fatima Ali", phone: "+1-555-0229", patientId: "PAT-1019" },
  { name: "Vikram Singh", phone: "+1-555-0230", patientId: "PAT-1020" },
  { name: "Susan Clark", phone: "+1-555-0231", patientId: "PAT-1021" },
  { name: "Rajesh Kumar", phone: "+1-555-0232", patientId: "PAT-1022" },
  { name: "Linda Martinez", phone: "+1-555-0233", patientId: "PAT-1023" },
  { name: "Kevin Taylor", phone: "+1-555-0234", patientId: "PAT-1024" },
];

export const MEDICINE_METADATA = [
  { id: 1, brandName: "Dolo 650", genericMedicine: "Paracetamol", strength: "650 mg", dosageForm: "Tablet", batchId: 1, batchNumber: "DLO2026A", expiryDate: "2027-06-14" },
  { id: 2, brandName: "Calpol 650", genericMedicine: "Paracetamol", strength: "650 mg", dosageForm: "Tablet", batchId: 3, batchNumber: "CAL2027A", expiryDate: "2027-10-01" },
  { id: 3, brandName: "Crocin 650", genericMedicine: "Paracetamol", strength: "650 mg", dosageForm: "Tablet", batchId: 4, batchNumber: "CRO2026A", expiryDate: "2026-09-13" },
  { id: 4, brandName: "PCM 500", genericMedicine: "Paracetamol", strength: "500 mg", dosageForm: "Tablet", batchId: 5, batchNumber: "PCM2027A", expiryDate: "2027-10-01" },
  { id: 5, brandName: "Brufen 400", genericMedicine: "Ibuprofen", strength: "400 mg", dosageForm: "Tablet", batchId: 6, batchNumber: "BRU2027A", expiryDate: "2027-11-01" },
  { id: 6, brandName: "Ibugesic 400", genericMedicine: "Ibuprofen", strength: "400 mg", dosageForm: "Tablet", batchId: 7, batchNumber: "IBU2026A", expiryDate: "2026-08-15" },
  { id: 7, brandName: "Amoxil 500", genericMedicine: "Amoxicillin", strength: "500 mg", dosageForm: "Capsule", batchId: 8, batchNumber: "AMX2026A", expiryDate: "2026-10-01" },
  { id: 8, brandName: "Zyrtec 10mg", genericMedicine: "Cetirizine", strength: "10 mg", dosageForm: "Tablet", batchId: 9, batchNumber: "ZYR2027A", expiryDate: "2027-12-01" },
  { id: 9, brandName: "Prilosec 20mg", genericMedicine: "Omeprazole", strength: "20 mg", dosageForm: "Capsule", batchId: 10, batchNumber: "OMP2026C", expiryDate: "2026-11-01" },
  { id: 10, brandName: "Benadryl Cough", genericMedicine: "Dextromethorphan", strength: "100 ml", dosageForm: "Syrup", batchId: 11, batchNumber: "CGH2027A", expiryDate: "2027-05-01" },
  { id: 11, brandName: "Lantus SoloStar", genericMedicine: "Insulin Glargine", strength: "100 IU/ml", dosageForm: "Injection", batchId: 12, batchNumber: "INS2026A", expiryDate: "2026-04-01" },
  { id: 12, brandName: "Cortizone 10", genericMedicine: "Hydrocortisone", strength: "1%", dosageForm: "Cream", batchId: 13, batchNumber: "HCC2027A", expiryDate: "2027-07-01" },
  { id: 13, brandName: "Bactroban Ointment", genericMedicine: "Mupirocin", strength: "2%", dosageForm: "Ointment", batchId: 14, batchNumber: "MUP2027A", expiryDate: "2027-10-01" },
  { id: 14, brandName: "Ventolin Inhaler", genericMedicine: "Salbutamol", strength: "100 mcg", dosageForm: "Inhaler", batchId: 15, batchNumber: "SAL2026A", expiryDate: "2026-10-01" },
  { id: 15, brandName: "Ecotrin 75mg", genericMedicine: "Aspirin", strength: "75 mg", dosageForm: "Tablet", batchId: 16, batchNumber: "ASP2027A", expiryDate: "2027-12-01" },
  { id: 16, brandName: "Glucophage 500mg", genericMedicine: "Metformin", strength: "500 mg", dosageForm: "Tablet", batchId: 17, batchNumber: "MET2026B", expiryDate: "2026-09-20" },
  { id: 17, brandName: "Zithromax 250mg", genericMedicine: "Azithromycin", strength: "250 mg", dosageForm: "Tablet", batchId: 18, batchNumber: "AZT2027A", expiryDate: "2027-09-01" },
  { id: 18, brandName: "Prinivil 10mg", genericMedicine: "Lisinopril", strength: "10 mg", dosageForm: "Tablet", batchId: 19, batchNumber: "LIS2027A", expiryDate: "2027-11-01" },
  { id: 19, brandName: "Lipitor 20mg", genericMedicine: "Atorvastatin", strength: "20 mg", dosageForm: "Tablet", batchId: 20, batchNumber: "ATR2026B", expiryDate: "2026-12-15" },
  { id: 20, brandName: "Rocephin 1g", genericMedicine: "Ceftriaxone", strength: "1 g", dosageForm: "Injection", batchId: 21, batchNumber: "CFT2027A", expiryDate: "2027-09-01" },
];

// Dispensing schedules per medicine: [month (2..9), day (1..31), quantity]
const DISPENSING_SCHEDULES = {
  1: [ // Dolo 650 (Feb: 145, Mar: 160, Apr: 155, May: 175, Jun: 168, Jul: 182, Aug: 162, Sep: 180)
    [2,3,20],[2,7,25],[2,11,20],[2,16,20],[2,20,20],[2,24,20],[2,27,20],
    [3,2,20],[3,6,20],[3,10,20],[3,14,20],[3,18,20],[3,22,20],[3,26,20],[3,30,20],
    [4,3,20],[4,7,20],[4,11,15],[4,15,20],[4,19,20],[4,23,20],[4,26,20],[4,29,20],
    [5,2,20],[5,5,20],[5,9,20],[5,13,20],[5,16,15],[5,20,20],[5,24,20],[5,27,20],[5,30,20],
    [6,3,20],[6,7,24],[6,11,20],[6,15,20],[6,18,24],[6,22,20],[6,25,20],[6,29,20],
    [7,2,20],[7,6,22],[7,9,20],[7,13,20],[7,17,20],[7,21,20],[7,24,20],[7,28,20],[7,31,20],
    [8,3,20],[8,7,20],[8,11,20],[8,15,20],[8,18,22],[8,22,20],[8,29,20],[8,31,20],
    [9,2,20],[9,5,20],[9,9,20],[9,13,20],[9,16,20],[9,20,20],[9,23,20],[9,26,20],[9,29,20],
  ],
  2: [ // Calpol 650 (Feb: 115, Mar: 128, Apr: 135, May: 130, Jun: 142, Jul: 160, Aug: 130, Sep: 150)
    [2,4,20],[2,9,20],[2,14,15],[2,18,20],[2,22,20],[2,26,20],
    [3,3,20],[3,8,20],[3,13,20],[3,18,24],[3,23,24],[3,28,20],
    [4,2,20],[4,6,20],[4,11,15],[4,16,20],[4,21,20],[4,25,20],[4,29,20],
    [5,3,20],[5,8,25],[5,14,20],[5,19,25],[5,24,20],[5,29,20],
    [6,2,20],[6,6,20],[6,11,22],[6,16,20],[6,20,20],[6,24,20],[6,28,20],
    [7,2,20],[7,6,20],[7,10,20],[7,14,20],[7,18,20],[7,22,20],[7,26,20],[7,30,20],
    [8,4,20],[8,8,20],[8,13,25],[8,18,25],[8,22,20],[8,29,20],
    [9,3,20],[9,7,25],[9,12,20],[9,16,25],[9,21,20],[9,25,20],[9,29,20],
  ],
  3: [ // Crocin 650 (Feb: 82, Mar: 120, Apr: 90, May: 130, Jun: 105, Jul: 122, Aug: 110, Sep: 125)
    [2,5,20],[2,12,22],[2,19,20],[2,25,20],
    [3,4,20],[3,9,20],[3,14,20],[3,19,20],[3,24,20],[3,29,20],
    [4,5,20],[4,12,15],[4,18,20],[4,24,15],[4,28,20],
    [5,4,20],[5,9,25],[5,15,20],[5,20,25],[5,25,20],[5,30,20],
    [6,4,20],[6,10,25],[6,17,20],[6,23,20],[6,28,20],
    [7,3,20],[7,8,22],[7,14,20],[7,19,20],[7,24,20],[7,29,20],
    [8,5,25],[8,11,20],[8,17,25],[8,23,20],[8,28,20],
    [9,4,20],[9,9,25],[9,14,20],[9,19,20],[9,24,20],[9,28,20],
  ],
  4: [ // PCM 500 (Feb: 65, Mar: 75, Apr: 70, May: 85, Jun: 80, Jul: 92, Aug: 78, Sep: 88)
    [2,6,20],[2,15,25],[2,23,20],
    [3,5,20],[3,12,15],[3,20,20],[3,27,20],
    [4,6,25],[4,15,25],[4,24,20],
    [5,5,20],[5,12,25],[5,20,20],[5,27,20],
    [6,5,20],[6,12,20],[6,19,20],[6,26,20],
    [7,4,25],[7,11,22],[7,18,25],[7,26,20],
    [8,5,20],[8,12,18],[8,19,20],[8,27,20],
    [9,4,22],[9,11,22],[9,18,22],[9,25,22],
  ],
  5: [ // Brufen 400 (Feb: 110, Mar: 122, Apr: 135, May: 128, Jun: 142, Jul: 145, Aug: 145, Sep: 150)
    [2,3,20],[2,8,25],[2,14,25],[2,20,20],[2,25,20],
    [3,2,20],[3,7,22],[3,12,20],[3,17,20],[3,22,20],[3,27,20],
    [4,2,25],[4,7,20],[4,13,25],[4,18,25],[4,23,20],[4,28,20],
    [5,2,20],[5,7,24],[5,13,20],[5,18,24],[5,23,20],[5,28,20],
    [6,2,20],[6,6,20],[6,11,22],[6,16,20],[6,20,20],[6,24,20],[6,28,20],
    [7,2,20],[7,6,25],[7,11,20],[7,16,20],[7,20,20],[7,25,20],[7,29,20],
    [8,2,25],[8,7,20],[8,12,25],[8,17,25],[8,22,25],[8,28,25],
    [9,2,25],[9,6,20],[9,11,25],[9,15,20],[9,20,20],[9,24,20],[9,28,20],
  ],
  6: [ // Ibugesic 400 (Feb: 85, Mar: 95, Apr: 90, May: 105, Jun: 100, Jul: 110, Aug: 105, Sep: 100)
    [2,5,20],[2,11,25],[2,18,20],[2,25,20],
    [3,4,25],[3,11,25],[3,18,25],[3,25,20],
    [4,4,20],[4,11,25],[4,18,25],[4,25,20],
    [5,3,20],[5,9,25],[5,15,20],[5,21,20],[5,27,20],
    [6,3,20],[6,9,20],[6,16,20],[6,22,20],[6,27,20],
    [7,3,25],[7,9,20],[7,15,25],[7,22,20],[7,28,20],
    [8,3,20],[8,9,25],[8,15,20],[8,21,20],[8,27,20],
    [9,3,20],[9,9,20],[9,15,20],[9,21,20],[9,27,20],
  ],
  7: [ // Amoxil 500 (Feb: 70, Mar: 85, Apr: 90, May: 80, Jun: 95, Jul: 102, Aug: 58, Sep: 96)
    [2,7,20],[2,16,25],[2,24,25],
    [3,5,20],[3,12,25],[3,20,20],[3,27,20],
    [4,4,25],[4,11,20],[4,18,25],[4,26,20],
    [5,4,20],[5,11,20],[5,18,20],[5,26,20],
    [6,4,25],[6,11,25],[6,18,25],[6,25,20],
    [7,3,20],[7,8,22],[7,15,20],[7,22,20],[7,28,20],
    [8,4,20],[8,12,20],[8,20,18],
    [9,3,24],[9,10,24],[9,17,24],[9,24,24],
  ],
  8: [ // Zyrtec 10mg (Feb: 90, Mar: 105, Apr: 115, May: 125, Jun: 130, Jul: 128, Aug: 103, Sep: 110)
    [2,6,20],[2,13,25],[2,20,25],[2,26,20],
    [3,4,20],[3,10,20],[3,17,25],[3,23,20],[3,29,20],
    [4,3,25],[4,9,25],[4,16,25],[4,22,20],[4,28,20],
    [5,2,20],[5,7,25],[5,13,20],[5,18,20],[5,24,20],[5,29,20],
    [6,2,20],[6,7,25],[6,12,25],[6,17,20],[6,22,20],[6,27,20],
    [7,2,20],[7,7,20],[7,12,24],[7,18,24],[7,23,20],[7,28,20],
    [8,3,20],[8,8,20],[8,14,23],[8,20,20],[8,27,20],
    [9,3,20],[9,9,25],[9,15,25],[9,21,20],[9,27,20],
  ],
  9: [ // Prilosec 20mg (Feb: 60, Mar: 72, Apr: 68, May: 80, Jun: 75, Jul: 85, Aug: 78, Sep: 82)
    [2,8,20],[2,17,20],[2,25,20],
    [3,6,24],[3,15,24],[3,25,24],
    [4,7,20],[4,16,24],[4,25,24],
    [5,4,20],[5,12,20],[5,20,20],[5,28,20],
    [6,5,25],[6,15,25],[6,25,25],
    [7,4,20],[7,11,25],[7,19,20],[7,27,20],
    [8,5,20],[8,12,20],[8,19,20],[8,27,18],
    [9,4,20],[9,11,22],[9,19,20],[9,26,20],
  ],
  10: [ // Benadryl Cough (Feb: 75, Mar: 60, Apr: 45, May: 40, Jun: 50, Jul: 65, Aug: 75, Sep: 80)
    [2,4,20],[2,11,20],[2,18,20],[2,25,15],
    [3,6,20],[3,15,20],[3,24,20],
    [4,8,15],[4,17,15],[4,26,15],
    [5,10,20],[5,22,20],
    [6,8,15],[6,17,15],[6,26,20],
    [7,6,20],[7,15,25],[7,24,20],
    [8,4,20],[8,11,20],[8,18,20],[8,25,15],
    [9,4,20],[9,11,20],[9,18,20],[9,25,20],
  ],
  11: [ // Lantus SoloStar (Feb: 30, Mar: 35, Apr: 32, May: 38, Jun: 36, Jul: 40, Aug: 35, Sep: 38)
    [2,7,10],[2,16,10],[2,24,10],
    [3,6,10],[3,16,15],[3,26,10],
    [4,7,10],[4,17,12],[4,26,10],
    [5,6,10],[5,16,15],[5,26,13],
    [6,6,12],[6,16,12],[6,26,12],
    [7,5,10],[7,12,10],[7,20,10],[7,27,10],
    [8,6,10],[8,16,15],[8,26,10],
    [9,6,10],[9,16,14],[9,26,14],
  ],
  12: [ // Cortizone 10 (Feb: 25, Mar: 30, Apr: 28, May: 35, Jun: 32, Jul: 38, Aug: 30, Sep: 34)
    [2,8,8],[2,17,8],[2,25,9],
    [3,7,10],[3,17,10],[3,26,10],
    [4,8,8],[4,18,10],[4,27,10],
    [5,7,10],[5,17,15],[5,27,10],
    [6,7,10],[6,17,12],[6,26,10],
    [7,6,12],[7,16,14],[7,26,12],
    [8,7,10],[8,17,10],[8,26,10],
    [9,7,10],[9,17,12],[9,26,12],
  ],
  13: [ // Bactroban Ointment (Feb: 35, Mar: 40, Apr: 38, May: 45, Jun: 42, Jul: 48, Aug: 40, Sep: 44)
    [2,6,10],[2,15,15],[2,23,10],
    [3,5,10],[3,12,10],[3,20,10],[3,27,10],
    [4,6,12],[4,15,14],[4,24,12],
    [5,5,10],[5,12,15],[5,20,10],[5,27,10],
    [6,6,14],[6,16,14],[6,25,14],
    [7,5,12],[7,12,12],[7,20,12],[7,27,12],
    [8,5,10],[8,12,10],[8,20,10],[8,27,10],
    [9,5,11],[9,12,11],[9,20,11],[9,27,11],
  ],
  14: [ // Ventolin Inhaler (Feb: 20, Mar: 25, Apr: 22, May: 28, Jun: 26, Jul: 30, Aug: 24, Sep: 28)
    [2,8,6],[2,17,7],[2,25,7],
    [3,7,8],[3,17,8],[3,26,9],
    [4,8,7],[4,17,7],[4,26,8],
    [5,7,9],[5,17,9],[5,26,10],
    [6,7,8],[6,17,9],[6,26,9],
    [7,6,10],[7,16,10],[7,26,10],
    [8,7,8],[8,17,8],[8,26,8],
    [9,7,9],[9,17,9],[9,26,10],
  ],
  15: [ // Ecotrin 75mg (Feb: 120, Mar: 130, Apr: 125, May: 140, Jun: 135, Jul: 145, Aug: 140, Sep: 145)
    [2,4,25],[2,9,25],[2,14,25],[2,19,25],[2,25,20],
    [3,3,25],[3,8,25],[3,14,30],[3,20,25],[3,26,25],
    [4,3,25],[4,8,25],[4,14,25],[4,20,25],[4,26,25],
    [5,2,30],[5,7,25],[5,13,30],[5,19,25],[5,26,30],
    [6,2,25],[6,7,30],[6,13,25],[6,19,25],[6,26,30],
    [7,2,30],[7,7,30],[7,13,25],[7,19,30],[7,26,30],
    [8,2,25],[8,7,30],[8,13,30],[8,19,25],[8,26,30],
    [9,2,30],[9,7,30],[9,13,25],[9,19,30],[9,26,30],
  ],
  16: [ // Glucophage 500mg (Feb: 80, Mar: 90, Apr: 85, May: 95, Jun: 92, Jul: 100, Aug: 94, Sep: 98)
    [2,5,20],[2,12,20],[2,19,20],[2,26,20],
    [3,4,25],[3,11,20],[3,18,25],[3,25,20],
    [4,4,20],[4,11,25],[4,18,20],[4,25,20],
    [5,3,25],[5,10,25],[5,17,25],[5,24,20],
    [6,4,23],[6,11,23],[6,18,23],[6,25,23],
    [7,3,20],[7,9,20],[7,15,20],[7,21,20],[7,27,20],
    [8,4,24],[8,11,24],[8,18,23],[8,25,23],
    [9,4,25],[9,11,25],[9,18,24],[9,25,24],
  ],
  17: [ // Zithromax 250mg (Feb: 50, Mar: 65, Apr: 55, May: 70, Jun: 60, Jul: 68, Aug: 58, Sep: 62)
    [2,7,15],[2,16,15],[2,24,20],
    [3,5,15],[3,12,15],[3,20,15],[3,27,20],
    [4,6,15],[4,16,20],[4,25,20],
    [5,5,15],[5,12,20],[5,19,15],[5,26,20],
    [6,6,20],[6,16,20],[6,25,20],
    [7,5,17],[7,12,17],[7,19,17],[7,26,17],
    [8,6,18],[8,16,20],[8,25,20],
    [9,5,20],[9,15,21],[9,24,21],
  ],
  18: [ // Prinivil 10mg (Feb: 65, Mar: 70, Apr: 68, May: 75, Jun: 72, Jul: 80, Aug: 76, Sep: 78)
    [2,6,20],[2,15,25],[2,23,20],
    [3,6,25],[3,15,25],[3,24,20],
    [4,6,20],[4,15,24],[4,24,24],
    [5,5,20],[5,12,20],[5,19,20],[5,26,15],
    [6,6,24],[6,15,24],[6,24,24],
    [7,4,20],[7,11,20],[7,18,20],[7,25,20],
    [8,5,19],[8,12,19],[8,19,19],[8,26,19],
    [9,5,20],[9,12,20],[9,19,19],[9,26,19],
  ],
  19: [ // Lipitor 20mg (Feb: 75, Mar: 85, Apr: 80, May: 90, Jun: 88, Jul: 95, Aug: 90, Sep: 92)
    [2,6,25],[2,15,25],[2,23,25],
    [3,5,20],[3,12,25],[3,19,20],[3,26,20],
    [4,5,20],[4,12,20],[4,19,20],[4,26,20],
    [5,4,25],[5,11,25],[5,18,20],[5,25,20],
    [6,5,22],[6,12,22],[6,19,22],[6,26,22],
    [7,4,25],[7,11,25],[7,18,25],[7,25,20],
    [8,4,25],[8,11,25],[8,18,20],[8,25,20],
    [9,4,23],[9,11,23],[9,18,23],[9,25,23],
  ],
  20: [ // Rocephin 1g (Feb: 40, Mar: 50, Apr: 45, May: 55, Jun: 52, Jul: 60, Aug: 50, Sep: 55)
    [2,7,12],[2,16,14],[2,24,14],
    [3,6,16],[3,16,17],[3,26,17],
    [4,7,15],[4,16,15],[4,25,15],
    [5,5,12],[5,12,14],[5,19,14],[5,26,15],
    [6,6,17],[6,16,17],[6,25,18],
    [7,4,15],[7,11,15],[7,18,15],[7,25,15],
    [8,6,16],[8,16,17],[8,25,17],
    [9,5,12],[9,12,14],[9,19,14],[9,26,15],
  ],
};

/**
 * Generate transactions deterministically.
 */
export function generateHistoricalTransactions() {
  const transactions = [];
  let txnIdCounter = 101;
  let itemIdCounter = 201;

  // Collect all events: { medId, month, day, quantity }
  const allEvents = [];
  Object.keys(DISPENSING_SCHEDULES).forEach((medIdStr) => {
    const medId = Number(medIdStr);
    const schedule = DISPENSING_SCHEDULES[medId];
    schedule.forEach(([month, day, qty]) => {
      allEvents.push({ medId, month, day, quantity: qty });
    });
  });

  // Group events by date (year 2026) to make multi-item & single-item realistic prescriptions
  const eventsByDate = {};
  allEvents.forEach((ev) => {
    const dateKey = `2026-${String(ev.month).padStart(2, "0")}-${String(ev.day).padStart(2, "0")}`;
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(ev);
  });

  // Sort dates chronologically
  const sortedDates = Object.keys(eventsByDate).sort();

  sortedDates.forEach((dateKey) => {
    const dateEvents = eventsByDate[dateKey];
    // Split events on the same date into prescriptions of 1 to 2 items
    for (let i = 0; i < dateEvents.length; i += 2) {
      const group = dateEvents.slice(i, i + 2);
      const custIdx = (txnIdCounter) % CUSTOMERS.length;
      const cust = CUSTOMERS[custIdx];
      const hour = 9 + ((txnIdCounter * 3) % 9);
      const min = (txnIdCounter * 17) % 60;
      const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
      const fullDateStr = `${dateKey}T${timeStr}`;

      const totalQuantity = group.reduce((sum, g) => sum + g.quantity, 0);

      const items = group.map((ev) => {
        const medMeta = MEDICINE_METADATA.find((m) => m.id === ev.medId);
        const thisItemId = itemIdCounter++;
        return {
          id: thisItemId,
          quantity: ev.quantity,
          expiryDateAtDispense: medMeta.expiryDate,
          medicineId: medMeta.id,
          brandName: medMeta.brandName,
          medicineName: medMeta.brandName,
          genericMedicine: medMeta.genericMedicine,
          genericName: medMeta.genericMedicine,
          strength: medMeta.strength,
          dosageForm: medMeta.dosageForm,
          batchId: medMeta.batchId,
          batchNumber: medMeta.batchNumber,
          expiryDate: medMeta.expiryDate,
          medicine: {
            id: medMeta.id,
            name: medMeta.brandName,
            brandName: medMeta.brandName,
            genericMedicine: medMeta.genericMedicine,
            genericName: medMeta.genericMedicine,
            strength: medMeta.strength,
            dosageForm: medMeta.dosageForm,
          },
          batch: {
            id: medMeta.batchId,
            batchNumber: medMeta.batchNumber,
            expiryDate: medMeta.expiryDate,
          },
        };
      });

      const currentTxnId = txnIdCounter++;
      transactions.push({
        id: currentTxnId,
        customerName: cust.name,
        customerPhone: cust.phone,
        patientId: cust.patientId,
        referenceNumber: `RX-2026-${String(currentTxnId).padStart(4, "0")}`,
        pharmacist: { id: 2, name: "Kavitha (Pharmacist)" },
        pharmacistId: 2,
        pharmacistName: "Kavitha (Pharmacist)",
        transactionDate: fullDateStr,
        date: fullDateStr,
        totalItems: items.length,
        totalQuantity: totalQuantity,
        status: "COMPLETED",
        items: items,
      });
    }
  });

  return transactions;
}

export const generatedHistoricalTransactions = generateHistoricalTransactions();
