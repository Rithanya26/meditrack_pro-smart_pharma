import { medicineService } from "./medicineService.js";
import { batchService } from "./batchService.js";
import { reorderService } from "./reorderService.js";
import { mockMedicines, mockBatches } from "../data/mockData.js";
import { daysUntilExpiry, getExpiryStatus } from "../utils/helpers.js";
import { nlpProcessor } from "./nlpProcessor.js";

// Clinical Drug Interaction Database
const DRUG_INTERACTIONS = [
  {
    drugs: ["Ibuprofen", "Warfarin"],
    severity: "CRITICAL",
    effect: "Severe Gastrointestinal Bleeding Risk",
    description: "NSAIDs inhibit platelet aggregation and cause gastric mucosal damage, synergistically multiplying anticoagulant bleeding hazards.",
    action: "Avoid concurrent use. Use Paracetamol for analgesia if approved by physician.",
  },
  {
    drugs: ["Aspirin", "Ibuprofen"],
    severity: "HIGH",
    effect: "Attenuated Cardioprotection & Increased Ulcer Risk",
    description: "Ibuprofen competitively interferes with aspirin's irreversible platelet COX-1 inhibition and increases ulcer risk.",
    action: "Take immediate-release aspirin at least 30 minutes before or 8 hours after ibuprofen.",
  },
  {
    drugs: ["Lisinopril", "Spironolactone"],
    severity: "CRITICAL",
    effect: "Life-Threatening Hyperkalemia",
    description: "Concurrent ACE inhibitor and potassium-sparing diuretic use impairs renal potassium excretion, inducing severe cardiac arrhythmias.",
    action: "Monitor serum potassium (K+) within 72 hours. Avoid potassium supplements and salt substitutes.",
  },
  {
    drugs: ["Metformin", "Radiocontrast"],
    severity: "HIGH",
    effect: "Contrast-Induced Nephropathy & Lactic Acidosis",
    description: "Iodinated radiocontrast agents can induce acute kidney injury, causing toxic metformin accumulation and fatal lactic acidosis.",
    action: "Withhold Metformin at least 48 hours prior to contrast imaging and verify eGFR before resumption.",
  },
  {
    drugs: ["Amoxicillin", "Methotrexate"],
    severity: "HIGH",
    effect: "Methotrexate Toxicity (Bone Marrow Suppression)",
    description: "Penicillins compete for renal tubular secretion, elevating serum methotrexate levels to toxic thresholds.",
    action: "Monitor complete blood count (CBC) and methotrexate plasma levels closely.",
  },
  {
    drugs: ["Omeprazole", "Clopidogrel"],
    severity: "MODERATE",
    effect: "Reduced Antiplatelet Efficacy",
    description: "Omeprazole inhibits CYP2C19, significantly reducing bioactivation of clopidogrel into its active antiplatelet form.",
    action: "Consider pantoprazole as a safer PPI alternative with minimal CYP2C19 interaction.",
  },
  {
    drugs: ["Paracetamol", "Alcohol"],
    severity: "HIGH",
    effect: "Potentiated Hepatotoxicity",
    description: "Chronic alcohol ingestion induces CYP2E1, elevating toxic NAPQI metabolite production while depleting hepatic glutathione reserves.",
    action: "Cap daily paracetamol dosage strictly at 2000mg in patients with regular alcohol consumption.",
  },
  {
    drugs: ["Azithromycin", "Amiodarone"],
    severity: "CRITICAL",
    effect: "QT Interval Prolongation & Torsades de Pointes",
    description: "Both agents independently prolong the cardiac QT interval, escalating ventricular tachycardia risk.",
    action: "Perform baseline ECG. Monitor QTc interval daily or select alternative antibiotic.",
  },
  {
    drugs: ["Salbutamol", "Propranolol"],
    severity: "HIGH",
    effect: "Severe Bronchospasm & Mutual Antagonism",
    description: "Non-selective beta blockers block bronchial beta-2 receptors, neutralizing salbutamol bronchodilation and provoking acute asthma.",
    action: "Avoid non-selective beta-blockers in reactive airway disease. Use cardioselective beta-1 agents if essential.",
  },
];

// Clinical Drug Monograph Reference
const CLINICAL_MONOGRAPHS = {
  "paracetamol": {
    name: "Paracetamol (Acetaminophen / Dolo 650 / Calpol / Crocin)",
    class: "Analgesic & Antipyretic",
    mechanism: "Central inhibition of prostaglandin synthesis and descending serotonergic pain pathway activation.",
    adultDose: "500 mg - 1000 mg every 4-6 hours (Maximum: 4000 mg/24h; 2000 mg/24h in hepatic impairment or chronic alcohol use).",
    pediatricDose: "10 - 15 mg/kg per dose every 4-6 hours (Maximum: 75 mg/kg/day).",
    cautions: "Hepatic insufficiency, chronic alcoholism, severe malnutrition.",
    antidote: "N-acetylcysteine (NAC) administered intravenously or orally within 8-10 hours of toxic ingestion.",
  },
  "dolo": {
    name: "Dolo 650 (Paracetamol 650mg)",
    class: "Antipyretic & Analgesic",
    mechanism: "Inhibits hypothalamic heat-regulating center to reduce fever and blocks peripheral pain impulses.",
    adultDose: "1 tablet (650 mg) every 6-8 hours as needed after food. Maximum 4 tablets (2600 mg) per day without medical supervision.",
    pediatricDose: "Not recommended for children under 12 years without weight-based pediatric liquid titration.",
    cautions: "Avoid taking concurrently with other paracetamol-containing cough/cold formulations to prevent unintentional overdose.",
    antidote: "N-acetylcysteine (NAC).",
  },
  "calpol": {
    name: "Calpol 650 (Paracetamol 650mg)",
    class: "Antipyretic & Analgesic",
    mechanism: "Reversibly inhibits cyclooxygenase in CNS to alleviate pyrexia and mild-to-moderate somatic pain.",
    adultDose: "650 mg every 4 to 6 hours as needed. Do not exceed 4000 mg in 24 hours.",
    pediatricDose: "Use pediatric oral suspension (120mg/5ml or 250mg/5ml) dosed at 15 mg/kg.",
    cautions: "Pre-existing hepatic compromise, G6PD deficiency.",
    antidote: "N-acetylcysteine (NAC).",
  },
  "crocin": {
    name: "Crocin 650 (Fast-Release Paracetamol)",
    class: "Fast-Action Antipyretic & Analgesic",
    mechanism: "Rapidly absorbed micro-crystallized paracetamol providing accelerated onset analgesia.",
    adultDose: "1 tablet (650 mg) every 4-6 hours. Max: 4000 mg daily.",
    pediatricDose: "Use Crocin drops or syrup tailored to child weight.",
    cautions: "Do not exceed stated dose; monitor total daily acetaminophen intake.",
    antidote: "N-acetylcysteine (NAC).",
  },
  "ibuprofen": {
    name: "Ibuprofen (Brufen / Ibugesic)",
    class: "Non-Steroidal Anti-Inflammatory Drug (NSAID)",
    mechanism: "Non-selective inhibition of cyclooxygenase enzymes (COX-1 & COX-2), reducing pro-inflammatory prostaglandins.",
    adultDose: "400 mg every 6-8 hours with meals (Maximum: 2400 mg/24h for prescription analgesia).",
    pediatricDose: "5 - 10 mg/kg per dose every 6-8 hours (Max 40 mg/kg/day).",
    cautions: "Active peptic ulcer disease, severe heart failure (NYHA Class IV), renal impairment (eGFR <30), third trimester pregnancy.",
    antidote: "Symptomatic and supportive; activated charcoal within 1 hour.",
  },
  "brufen": {
    name: "Brufen 400 (Ibuprofen 400mg)",
    class: "Anti-inflammatory & Analgesic NSAID",
    mechanism: "Inhibits COX enzymes to reduce prostaglandin synthesis, alleviating musculoskeletal inflammation, swelling, and fever.",
    adultDose: "400 mg 3 times daily after meals. Maximum 2400 mg daily under medical supervision.",
    pediatricDose: "Use pediatric liquid Brufen formulation dosed per kilogram.",
    cautions: "Take with food or milk to minimize gastric mucosal irritation. Avoid in active gastrointestinal ulceration.",
    antidote: "Supportive care, hydration, gastric lavage if early.",
  },
  "amoxicillin": {
    name: "Amoxicillin (Amoxil / Augmentin)",
    class: "Broad-Spectrum Aminopenicillin Antibiotic",
    mechanism: "Inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs), causing bacterial lysis.",
    adultDose: "500 mg every 8 hours or 875 mg every 12 hours for 7-10 days.",
    pediatricDose: "25 - 45 mg/kg/day in divided doses every 12 hours (High dose: 80-90 mg/kg/day for acute otitis media).",
    cautions: "Penicillin/beta-lactam anaphylaxis, infectious mononucleosis (high maculopapular rash incidence).",
    antidote: "Supportive care, hemodialysis in extreme overdose.",
  },
  "metformin": {
    name: "Metformin Hydrochloride (Glucophage)",
    class: "Biguanide Oral Antidiabetic",
    mechanism: "Activates AMP-activated protein kinase (AMPK), decreasing hepatic gluconeogenesis and enhancing peripheral insulin sensitivity.",
    adultDose: "Initial: 500 mg once or twice daily with food; titrate to maximum 2000 - 2550 mg/day in divided doses.",
    pediatricDose: "Approved >= 10 years: Initial 500 mg twice daily, maximum 2000 mg/day.",
    cautions: "eGFR <30 mL/min/1.73m² (absolute contraindication), acute heart failure, hypoxemic conditions.",
    antidote: "Hemodialysis effectively removes metformin and corrects metabolic acidosis.",
  },
  "atorvastatin": {
    name: "Atorvastatin Calcium (Lipitor)",
    class: "HMG-CoA Reductase Inhibitor (Statin)",
    mechanism: "Competitively inhibits 3-hydroxy-3-methylglutaryl-coenzyme A reductase, upregulating hepatic LDL receptors.",
    adultDose: "10 mg to 80 mg once daily, taken at any time of day with or without food.",
    pediatricDose: "Heterozygous familial hypercholesterolemia (>= 10 years): Initial 10 mg/day, maximum 20 mg/day.",
    cautions: "Active liver disease, unexplained persistent serum transaminase elevations, pregnancy.",
    antidote: "Supportive therapy; monitor serum creatine kinase (CK) for rhabdomyolysis.",
  },
  "lisinopril": {
    name: "Lisinopril (Prinivil)",
    class: "Angiotensin-Converting Enzyme (ACE) Inhibitor",
    mechanism: "Inhibits ACE, preventing conversion of Angiotensin I to Angiotensin II, reducing aldosterone and systemic vascular resistance.",
    adultDose: "Hypertension: Initial 10 mg once daily; maintenance 20 - 40 mg/day.",
    pediatricDose: ">= 6 years: Initial 0.07 mg/kg once daily (maximum initial 5 mg).",
    cautions: "History of ACE-inhibitor angioedema, bilateral renal artery stenosis, pregnancy (fetal toxicity).",
    antidote: "Intravenous normal saline for hypotension; icatibant or C1-esterase inhibitor for angioedema.",
  },
  "omeprazole": {
    name: "Omeprazole (Prilosec / Omez)",
    class: "Proton Pump Inhibitor (PPI)",
    mechanism: "Irreversibly inhibits the gastric parietal cell H+/K+ ATPase enzyme system, suppressing basal and stimulated acid secretion.",
    adultDose: "GERD / Acid reflux: 20 mg to 40 mg once daily 30-60 minutes before breakfast for 4-8 weeks.",
    pediatricDose: ">= 1 year: 5 - 10 kg: 5 mg/day; 10 - 20 kg: 10 mg/day; > 20 kg: 20 mg/day.",
    cautions: "Long-term use: Clostridium difficile infection, hypomagnesemia, bone fractures, vitamin B12 malabsorption.",
    antidote: "Symptomatic treatment.",
  },
  "pantoprazole": {
    name: "Pantoprazole (Pan 40)",
    class: "Proton Pump Inhibitor (PPI)",
    mechanism: "Suppresses gastric acid secretion by specific inhibition of the H+/K+-ATPase enzyme system at the secretory surface of the gastric parietal cell.",
    adultDose: "40 mg once daily taken 30 minutes before the morning meal.",
    pediatricDose: ">= 5 years (weight >= 40kg): 40 mg once daily for up to 8 weeks.",
    cautions: "Long-term hypomagnesemia risk, increased risk of osteoporosis-related fractures.",
    antidote: "Symptomatic management; non-dialyzable.",
  },
  "azithromycin": {
    name: "Azithromycin (Zithromax / Azee)",
    class: "Macrolide Antibiotic (Azalide)",
    mechanism: "Binds reversibly to the 50S ribosomal subunit of susceptible microorganisms, inhibiting transpeptidation and protein synthesis.",
    adultDose: "500 mg on Day 1, followed by 250 mg once daily on Days 2-5 (Total 1.5 g).",
    pediatricDose: "10 mg/kg on Day 1 (max 500 mg), followed by 5 mg/kg once daily on Days 2-5 (max 250 mg).",
    cautions: "Baseline prolonged QTc interval, uncorrected hypokalemia/hypomagnesemia, cholestatic jaundice history.",
    antidote: "Supportive care; ECG telemetry monitoring.",
  },
  "cetirizine": {
    name: "Cetirizine Hydrochloride (Zyrtec / Cetzine)",
    class: "Second-Generation H1 Antihistamine",
    mechanism: "Selective peripheral H1 receptor antagonist, inhibiting histamine-mediated allergic manifestations with minimal sedation.",
    adultDose: "10 mg once daily (or 5 mg twice daily).",
    pediatricDose: "6 months to 2 years: 2.5 mg once daily; 2-5 years: 2.5 - 5 mg/day; >= 6 years: 5 - 10 mg/day.",
    cautions: "Renal impairment (dosage adjustment required if CrCl < 50 mL/min).",
    antidote: "Symptomatic; hemodialysis does not remove cetirizine.",
  },
  "salbutamol": {
    name: "Salbutamol / Albuterol (Ventolin Inhaler / Asthalin)",
    class: "Short-Acting Beta-2 Agonist (SABA) Bronchodilator",
    mechanism: "Selectively stimulates bronchial beta-2 adrenergic receptors, relaxing bronchial smooth muscle and relieving acute bronchospasm.",
    adultDose: "Acute bronchospasm: 1-2 puffs (100-200 mcg) every 4-6 hours as needed via metered-dose inhaler.",
    pediatricDose: "1-2 puffs with age-appropriate spacer device.",
    cautions: "Cardiovascular disorders (tachycardia, arrhythmias), hyperthyroidism, hypokalemia.",
    antidote: "Cardioselective beta-1 blocker (e.g. metoprolol) under strict monitoring if life-threatening.",
  },
  "aspirin": {
    name: "Aspirin (Acetylsalicylic Acid / Ecotrin)",
    class: "Antiplatelet Agent & Salicylate",
    mechanism: "Irreversibly acetylates and inactivates platelet cyclooxygenase-1 (COX-1), blocking thromboxane A2 production for platelet lifespan (7-10 days).",
    adultDose: "Cardioprotection: 75 mg - 100 mg once daily with food. Acute MI: 162 mg - 325 mg chewed immediately.",
    pediatricDose: "Strictly contraindicated in children/adolescents with viral illness due to fatal Reye's Syndrome risk.",
    cautions: "Active peptic ulcers, bleeding diathesis, severe renal/hepatic impairment.",
    antidote: "Sodium bicarbonate alkalinization of urine to accelerate salicylate excretion; hemodialysis in severe toxicity.",
  },
  "warfarin": {
    name: "Warfarin Sodium (Coumadin)",
    class: "Vitamin K Antagonist (Anticoagulant)",
    mechanism: "Inhibits Vitamin K epoxide reductase complex 1 (VKORC1), depleting functional clotting factors II, VII, IX, X and proteins C and S.",
    adultDose: "Individually titrated based on International Normalized Ratio (INR, target typically 2.0 - 3.0). Initial 2 mg - 5 mg daily.",
    pediatricDose: "Specialist pediatric hematology protocol only.",
    cautions: "Extreme hemorrhage risk. Strict INR monitoring mandatory. Highly vulnerable to drug-drug and dietary Vitamin K interactions.",
    antidote: "Vitamin K1 (Phytonadione) IV/oral and Prothrombin Complex Concentrate (PCC) for major bleeding.",
  },
  "spironolactone": {
    name: "Spironolactone (Aldactone)",
    class: "Aldosterone Receptor Antagonist (Potassium-Sparing Diuretic)",
    mechanism: "Competitively binds aldosterone receptors in renal distal convoluted tubules, increasing sodium and water excretion while conserving potassium.",
    adultDose: "Heart Failure: 12.5 mg - 25 mg once daily; Hypertension / Edema: 25 mg - 100 mg daily.",
    pediatricDose: "1 - 3 mg/kg/day in single or divided doses.",
    cautions: "Hyperkalemia (serum K+ > 5.0 mEq/L), severe renal impairment (eGFR <30), Addison's disease.",
    antidote: "Discontinue drug; calcium gluconate, insulin + dextrose, and sodium polystyrene sulfonate for hyperkalemia.",
  },
  "insulin": {
    name: "Insulin Glargine (Lantus SoloStar)",
    class: "Long-Acting Basal Insulin Analogue",
    mechanism: "Regulates glucose metabolism by stimulating peripheral glucose uptake and inhibiting hepatic glucose output with a flat 24h peakless profile.",
    adultDose: "Type 2 Diabetes: Typically 10 units once daily (or 0.2 units/kg), injected subcutaneously at the same time each day.",
    pediatricDose: "Tailored to total daily insulin requirement by endocrinologist.",
    cautions: "Hypoglycemia is the primary hazard. Rotate subcutaneous injection sites to prevent lipodystrophy. Store unopened vials at 2-8°C (Cold Chain).",
    antidote: "Oral fast-acting carbohydrates (15-20g) if conscious; IV 50% Dextrose or 1mg IM Glucagon if unconscious.",
  },
  "hydrocortisone": {
    name: "Hydrocortisone Cream (Cortizone 10)",
    class: "Mild Topical Corticosteroid",
    mechanism: "Diffuses across cell membranes to bind glucocorticoid receptors, downregulating inflammatory cytokines and mitigating itching and eczema.",
    adultDose: "Apply sparingly to affected skin areas 1 to 2 times daily for up to 7 consecutive days.",
    pediatricDose: "Use lowest effective quantity; avoid occlusive dressings in infants.",
    cautions: "Do not apply to infected, broken, or ulcerated skin. Avoid prolonged facial use to prevent skin thinning (atrophy).",
    antidote: "Wash with mild soap and water; discontinue use.",
  },
  "mupirocin": {
    name: "Mupirocin (Bactroban Ointment)",
    class: "Topical Antibacterial Agent",
    mechanism: "Specifically inhibits bacterial isoleucyl transfer-RNA synthetase, suppressing RNA and protein synthesis in Staph and Strep.",
    adultDose: "Apply small quantity to affected lesion 3 times daily for up to 10 days.",
    pediatricDose: "Approved for pediatric impetigo >= 2 months.",
    cautions: "Avoid contact with eyes; do not use over large burns due to polyethylene glycol absorption risk.",
    antidote: "Topical discontinuation; rinse with saline.",
  },
  "ceftriaxone": {
    name: "Ceftriaxone (Rocephin)",
    class: "Third-Generation Cephalosporin Antibiotic",
    mechanism: "Inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs), highly resistant to beta-lactamases.",
    adultDose: "1 g to 2 g once daily IV or IM (Severe sepsis / meningitis: 2 g every 12 hours).",
    pediatricDose: "50 - 75 mg/kg/day in 1 or 2 divided doses (Max 2 g/day).",
    cautions: "Hyperbilirubinemic neonates (displaces bilirubin from albumin causing kernicterus); do not co-administer with calcium-containing IV solutions.",
    antidote: "Hemodialysis does not reduce blood levels; supportive care.",
  },
  "dextromethorphan": {
    name: "Dextromethorphan (Benadryl Cough)",
    class: "Centrally Acting Antitussive",
    mechanism: "Acts centrally on the medullary cough center to elevate the cough threshold without significant respiratory depression at therapeutic doses.",
    adultDose: "10 mg to 20 mg every 4 hours or 30 mg every 6-8 hours (Max: 120 mg/24h).",
    pediatricDose: "Age 6-12: 5 - 10 mg every 4 hours. Contraindicated in children under 4 years.",
    cautions: "Do not use with or within 14 days of Monoamine Oxidase Inhibitors (MAOIs) due to Serotonin Syndrome risk.",
    antidote: "Naloxone for severe respiratory depression in recreational overdose.",
  },
};

export const chatbotEngine = {
  // Fetch live system snapshot
  async getLiveContext() {
    let medicines = [];
    let batches = [];
    let reorderItems = [];

    try {
      medicines = await medicineService.getAll();
    } catch {
      medicines = mockMedicines;
    }

    try {
      batches = await batchService.getAll();
    } catch {
      batches = mockBatches;
    }

    try {
      reorderItems = await reorderService.getSuggestedItems();
    } catch {
      reorderItems = [];
    }

    let allOrders = [];
    try {
      allOrders = await reorderService.getAll();
    } catch {
      allOrders = [];
    }

    const enrichedOrders = allOrders.map((order) => {
      const medId = String(order.medicineId || order.medicine?.id || "");
      const matchedMed = medicines.find((m) => String(m.id) === medId) || order.medicine || {};
      const brandName =
        order.brandName || matchedMed.brandName || matchedMed.name || order.medicineName || "Medicine";
      const genericMedicine =
        order.genericMedicine || matchedMed.genericMedicine || matchedMed.genericName || "";
      const supplier =
        order.supplier || matchedMed.manufacturer || "Pharmaceutical Supplier";
      const orderNumber =
        order.orderNumber || (order.id ? (String(order.id).startsWith("ORD") ? String(order.id) : `ORD-${String(order.id).padStart(3, "0")}`) : "ORD-NEW");

      return {
        ...order,
        brandName,
        genericMedicine,
        supplier,
        orderNumber,
        medicine: matchedMed,
      };
    });

    const awaitingOrders = enrichedOrders.filter((o) => {
      const status = (o.status || "").trim().toUpperCase();
      return (
        status === "ORDERED" ||
        status === "AWAITING" ||
        status === "PENDING" ||
        status === "AWAITING RECEIPT" ||
        status === "APPROVED"
      );
    });

    const today = new Date();
    const enrichedBatches = batches.map((b) => {
      const days = daysUntilExpiry(b.expiryDate);
      const status = getExpiryStatus(days);
      const med = medicines.find((m) => String(m.id) === String(b.medicineId)) || b.medicine;
      return {
        ...b,
        daysLeft: days,
        status,
        medicineName: med?.brandName || med?.name || "Unknown Medicine",
        genericName: med?.genericMedicine || med?.genericName || "",
      };
    });

    const lowStockBatches = enrichedBatches.filter((b) => b.quantity <= (b.minimumStock || 20));
    const nearExpiryBatches = enrichedBatches.filter((b) => b.daysLeft > 0 && b.daysLeft <= 90);
    const expiredBatches = enrichedBatches.filter((b) => b.daysLeft <= 0);

    return {
      medicines,
      batches: enrichedBatches,
      lowStockBatches,
      nearExpiryBatches,
      expiredBatches,
      reorderItems,
      allOrders: enrichedOrders,
      awaitingOrders,
      today,
    };
  },

  // Check clinical interactions between 2+ medicines
  checkDrugInteractions(drugNames) {
    if (!drugNames || drugNames.length < 2) return [];
    const normalized = drugNames.map((d) => d.toLowerCase().trim());
    const matches = [];

    for (const rule of DRUG_INTERACTIONS) {
      const [d1, d2] = rule.drugs.map((d) => d.toLowerCase());
      const hasD1 = normalized.some((n) => n.includes(d1) || d1.includes(n));
      const hasD2 = normalized.some((n) => n.includes(d2) || d2.includes(n));
      if (hasD1 && hasD2) {
        matches.push(rule);
      }
    }
    return matches;
  },

  // Evaluate FEFO batch for a requested medicine
  findFefoBatch(medicineQuery, batches) {
    const q = medicineQuery.toLowerCase().trim();
    const matchingBatches = batches.filter(
      (b) =>
        b.daysLeft > 0 &&
        b.quantity > 0 &&
        (b.medicineName?.toLowerCase().includes(q) ||
          b.genericName?.toLowerCase().includes(q) ||
          b.batchNumber?.toLowerCase().includes(q))
    );

    if (matchingBatches.length === 0) return null;
    // FEFO: Sort ascending by expiry date
    matchingBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    return matchingBatches[0];
  },

  // Evaluate Patient Treatment Expiry Conflict Check (DaysRemaining < TreatmentDays)
  evaluatePrescriptionConflict(medicineQuery, treatmentDays, batches) {
    const q = medicineQuery.toLowerCase().trim();
    const matchingBatches = batches.filter(
      (b) =>
        b.quantity > 0 &&
        (b.medicineName?.toLowerCase().includes(q) ||
          b.genericName?.toLowerCase().includes(q))
    );

    if (matchingBatches.length === 0) {
      return { found: false, message: `No active inventory found for "${medicineQuery}".` };
    }

    matchingBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    const fefoCandidate = matchingBatches[0];

    const isConflict = fefoCandidate.daysLeft < treatmentDays;
    let safeAlternative = null;

    if (isConflict) {
      safeAlternative = matchingBatches.find((b) => b.daysLeft >= treatmentDays);
    }

    return {
      found: true,
      medicineName: fefoCandidate.medicineName,
      candidateBatch: fefoCandidate,
      treatmentDays,
      isConflict,
      safeAlternative,
    };
  },

  // Get all batches belonging to a medicine by ID, brandName, or brandBase
  getBatchesForMedicine(med, allBatches = []) {
    if (!med || !Array.isArray(allBatches)) return [];
    const medId = String(med.id || "").toLowerCase().trim();
    const brand = (med.brandName || med.name || "").toLowerCase().trim();
    const generic = (med.genericMedicine || med.genericName || "").toLowerCase().trim();
    const brandBase = brand.replace(/\s*\d+.*$/, "").trim(); // "Dolo 650" -> "dolo"

    return allBatches.filter((b) => {
      const bMedId = String(b.medicineId || b.medicine?.id || "").toLowerCase().trim();
      if (medId && bMedId && (bMedId === medId || bMedId.includes(medId) || medId.includes(bMedId))) return true;

      const bMedName = (b.medicineName || "").toLowerCase().trim();
      if (bMedName && brand && (bMedName === brand || bMedName.includes(brand) || brand.includes(bMedName))) return true;
      if (bMedName && brandBase && brandBase.length >= 3 && bMedName.includes(brandBase)) return true;

      return false;
    });
  },

  // Lookup clinical monograph reference
  getClinicalMonograph(med) {
    if (!med) return null;
    const brand = (med.brandName || med.name || "").toLowerCase();
    const generic = (med.genericMedicine || med.genericName || "").toLowerCase();
    const brandBase = brand.replace(/\s*\d+.*$/, "").trim();

    for (const [key, monograph] of Object.entries(CLINICAL_MONOGRAPHS)) {
      if (brand.includes(key) || generic.includes(key) || (brandBase && brandBase.includes(key)) || (key.length >= 3 && brand.includes(key))) {
        return monograph;
      }
    }
    return null;
  },

  // Format Pharmacist Formulary & Stock Card for a single medicine
  formatMedicineCard(med, context, role) {
    const batches = this.getBatchesForMedicine(med, context.batches);
    const activeBatches = batches.filter((b) => b.quantity > 0 && b.daysLeft > 0);
    activeBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    const totalUnits = activeBatches.reduce((sum, b) => sum + b.quantity, 0);
    const minStock = med.minimumStock || 40;
    const fefoBatch = activeBatches[0];
    const monograph = this.getClinicalMonograph(med);

    const isDepleted = totalUnits === 0;
    const isLow = totalUnits <= minStock;
    const stockStatusBadge = isDepleted
      ? "🔴 OUT OF STOCK / DEPLETED"
      : isLow
      ? `🟠 LOW STOCK (${totalUnits}/${minStock} safety min)`
      : `🟢 HEALTHY STOCK (${totalUnits} units)`;

    let batchesList = "";
    if (activeBatches.length > 0) {
      batchesList = activeBatches.map((b, idx) => {
        const isFefo = idx === 0;
        const statusBadge = b.daysLeft <= 30
          ? `🟠 CRITICAL (${b.daysLeft}d)`
          : isFefo
          ? `🟢 FEFO PRIORITY (${b.daysLeft}d left)`
          : `🟢 ${b.daysLeft}d left`;
        return `• Batch \`${b.batchNumber}\`: **${b.quantity} units** | Exp: ${b.expiryDate} [${statusBadge}] | Supplier: \`${b.supplier || "Standard"}\``;
      }).join("\n");
    } else {
      batchesList = "• ⚠️ *No usable batches in active inventory.*";
    }

    const text = `💊 **Pharmacist Formulary & Stock Card: ${med.brandName}** ${med.genericMedicine ? `(${med.genericMedicine})` : ""}\n\n` +
      `📦 **Live Inventory & FEFO Status:**\n` +
      `• **Available Usable Stock:** **${totalUnits.toLocaleString()} units** across ${activeBatches.length} active batch(es)\n` +
      `• **Safety Minimum Threshold:** ${minStock} units (Status: **${stockStatusBadge}**)\n` +
      `• **Allocated FEFO Batch:** ${fefoBatch ? `\`${fefoBatch.batchNumber}\` (**${fefoBatch.quantity} units**, Expires: ${fefoBatch.expiryDate}, **${fefoBatch.daysLeft}d left**)` : "⚠️ No usable batch in stock!"}\n\n` +
      `🏷️ **Active Batches (FEFO Sorted):**\n` +
      `${batchesList}\n\n` +
      `📋 **Formulary Specifications:**\n` +
      `• **Dosage Form & Strength:** ${med.dosageForm || "Tablet"} | ${med.strength || "Standard"}\n` +
      `• **Manufacturer:** ${med.manufacturer || "Certified Supplier"}\n` +
      `• **Catalog Status:** \`${(med.status || "active").toUpperCase()}\`\n\n` +
      `🩺 **Clinical Quick Reference:**\n` +
      `• **Therapeutic Class:** ${monograph?.class || med.category || "Pharmaceutical Agent"}\n` +
      `• **Adult Dosage:** ${monograph?.adultDose || "As directed on prescription."}\n` +
      `• **Critical Cautions:** ${monograph?.cautions || "Verify patient allergies and concurrent medications before dispensing."}\n` +
      `• **Toxicity & Antidote:** ${monograph?.antidote || "Standard supportive care."}\n\n` +
      `*MediTrack FEFO enforces batch safety before every dispense.*`;

    return {
      text,
      type: isDepleted ? "danger" : isLow ? "warning" : "success",
      actions: [
        fefoBatch ? { label: "Dispense " + med.brandName, path: "/pharmacist/dispense" } : null,
        { label: "View in Batches", path: "/admin/batches" },
        isLow ? { label: "Auto Reorder " + med.brandName, path: "/admin/reorder" } : null,
      ].filter(Boolean),
    };
  },

  // Format Comprehensive Inventory Report for a single medicine
  formatFullInventoryReport(med, context, role) {
    const batches = this.getBatchesForMedicine(med, context.batches);
    const activeBatches = batches.filter((b) => b.quantity > 0 && b.daysLeft > 0);
    activeBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    const depletedBatches = batches.filter((b) => b.quantity <= 0 || b.daysLeft <= 0);
    const totalUnits = activeBatches.reduce((sum, b) => sum + b.quantity, 0);
    const minStock = med.minimumStock || 40;
    const fefoBatch = activeBatches[0];
    const isColdChain = (med.brandName + " " + (med.genericMedicine || "")).toLowerCase().includes("insulin");

    const isDepleted = totalUnits === 0;
    const isLow = totalUnits <= minStock;
    const stockStatusBadge = isDepleted
      ? "🔴 OUT OF STOCK / DEPLETED"
      : isLow
      ? `🟠 LOW STOCK ALERT (${totalUnits}/${minStock} safety min)`
      : `🟢 HEALTHY BUFFER (${totalUnits} units on hand)`;

    const batchRows = activeBatches.map((b, idx) => {
      const isFefo = idx === 0;
      const statusBadge = b.daysLeft <= 30
        ? `🟠 CRITICAL (${b.daysLeft}d left)`
        : isFefo
        ? `🟢 FEFO NEXT (${b.daysLeft}d left)`
        : `🟢 USABLE (${b.daysLeft}d left)`;
      return `• Batch \`${b.batchNumber}\`: **${b.quantity} units** | Mfg: ${b.manufacturingDate || "Recorded"} | Exp: **${b.expiryDate}** [${statusBadge}] | Supplier: \`${b.supplier || "Supplier"}\``;
    });

    const depletedRows = depletedBatches.map((b) => {
      const reason = b.daysLeft <= 0 ? `⚠️ EXPIRED (${b.expiryDate})` : "DEPLETED (0 units)";
      return `• Batch \`${b.batchNumber}\`: 0 units | Exp: ${b.expiryDate} [🔴 ${reason}]`;
    });

    const text = `📦 **Comprehensive Inventory Report: ${med.brandName}** ${med.genericMedicine ? `(${med.genericMedicine})` : ""}\n\n` +
      `• **Catalog Code:** \`${med.id || "MED"}\` | **Form & Strength:** ${med.dosageForm || "Tablet"} ${med.strength || ""}\n` +
      `• **Manufacturer:** ${med.manufacturer || "Certified Supplier"} | **Status:** \`${(med.status || "active").toUpperCase()}\`\n` +
      `• **Total Usable Units on Hand:** **${totalUnits.toLocaleString()} units**\n` +
      `• **Safety Minimum Stock Threshold:** **${minStock} units**\n` +
      `• **Inventory Health Status:** **${stockStatusBadge}**\n` +
      `• **Active Batches in Circulation:** **${activeBatches.length} batch(es)** (${depletedBatches.length} archived/depleted)\n` +
      `• **Primary FEFO Batch:** ${fefoBatch ? `\`${fefoBatch.batchNumber}\` (**${fefoBatch.quantity} units**, Expires: ${fefoBatch.expiryDate}, **${fefoBatch.daysLeft}d left**)` : "⚠️ No active batches in stock"}\n\n` +
      `📋 **Complete Batch Inventory (FEFO Sorted):**\n` +
      (batchRows.length > 0 ? batchRows.join("\n") : "• ⚠️ *No active consignments available.*") + "\n" +
      (depletedRows.length > 0 ? "\n**Archived / Quarantined Batches:**\n" + depletedRows.join("\n") + "\n" : "") + "\n" +
      `🌡️ **Storage & Handling Guidelines:**\n` +
      `• **Storage Condition:** ${isColdChain ? "❄️ Cold Chain Required (2°C - 8°C). Do NOT freeze." : "🌡️ Room Temperature (15°C - 25°C) in a dry place. Protect from moisture and direct sunlight."}\n` +
      `• **Replenishment Guidance:** ${isLow ? `⚠️ Current stock (${totalUnits}) is at or below safety threshold (${minStock}). Immediate replenishment recommended via Croston-SBA auto-reorder.` : `🟢 Stock buffer is healthy. Sufficient to meet forecasted 30-day demand.`}`;

    return {
      text,
      type: isDepleted ? "danger" : isLow ? "warning" : "success",
      actions: [
        fefoBatch ? { label: "Dispense " + med.brandName, path: "/pharmacist/dispense" } : null,
        { label: "View in Batches", path: "/admin/batches" },
        isLow ? { label: "Auto Reorder", path: "/admin/reorder" } : null,
      ].filter(Boolean),
    };
  },

  // Format Multi-Medicine Batch Comparison (e.g. "batches of dolo650 and calpol 650")
  formatMultiMedicineBatches(medicines, context, role) {
    const medReports = medicines.map((med, idx) => {
      const batches = this.getBatchesForMedicine(med, context.batches);
      const activeBatches = batches.filter((b) => b.quantity > 0 && b.daysLeft > 0);
      activeBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      const totalUnits = activeBatches.reduce((sum, b) => sum + b.quantity, 0);
      const minStock = med.minimumStock || 40;
      const fefoBatch = activeBatches[0];
      const isLow = totalUnits <= minStock;
      const isDepleted = totalUnits === 0;

      const batchRows = activeBatches.map((b, bIdx) => {
        const isFefo = bIdx === 0;
        const statusBadge = b.daysLeft <= 30
          ? `🟠 CRITICAL (${b.daysLeft}d left)`
          : isFefo
          ? `🟢 FEFO NEXT (${b.daysLeft}d left)`
          : `🟢 ${b.daysLeft}d left`;
        return `  • Batch \`${b.batchNumber}\`: **${b.quantity} units** | Exp: ${b.expiryDate} [${statusBadge}] | Supplier: \`${b.supplier || "Supplier"}\``;
      });

      return `📦 **${idx + 1}. ${med.brandName}** ${med.genericMedicine ? `(${med.genericMedicine})` : ""} — \`${med.dosageForm || "Tablet"} ${med.strength || ""}\`\n` +
        `• **Total Usable Stock:** **${totalUnits} units** | Min Safety: ${minStock} units [${isDepleted ? "🔴 OUT OF STOCK" : isLow ? "🟠 LOW STOCK" : "🟢 HEALTHY"}]\n` +
        `• **FEFO Priority Batch to Dispense:** ${fefoBatch ? `\`${fefoBatch.batchNumber}\` (**${fefoBatch.quantity} units**, Exp: ${fefoBatch.expiryDate}, **${fefoBatch.daysLeft}d left**)` : "⚠️ No usable batch"}\n` +
        `**Active Batches:**\n` +
        (batchRows.length > 0 ? batchRows.join("\n") : "  • ⚠️ *No active batches in stock (Depleted)*");
    });

    const generics = medicines.map((m) => (m.genericMedicine || m.genericName || "").toLowerCase().trim()).filter(Boolean);
    const hasSameGeneric = generics.length >= 2 && generics.every((g) => g === generics[0]);

    const dispensingNote = hasSameGeneric
      ? `⚠️ **Clinical Precaution:** Both medications contain **${medicines[0].genericMedicine || "the same active ingredient"}**. Verify that patient's total cumulative intake does not exceed maximum daily dosage thresholds (e.g. 4,000 mg/24h for Paracetamol).\n\n` +
        `Always dispense in strict FEFO sequence: earliest expiring batch first.`
      : `💡 **FEFO Dispensing Guidance:** Always exhaust the allocated earliest-expiring batch first to eliminate shelf perishability and avoid write-offs.`;

    const text = `🏷️ **Batch Consignments Comparison: ${medicines.map((m) => m.brandName).join(" & ")}**\n\n` +
      medReports.join("\n\n") + "\n\n" +
      dispensingNote;

    return {
      text,
      type: "info",
      actions: [
        { label: "Dispense Console", path: "/pharmacist/dispense" },
        { label: "Batch Management", path: "/admin/batches" },
        { label: "Expiry Horizon", path: role === "admin" ? "/admin/expiry" : "/pharmacist/expiry-alerts" },
      ],
    };
  },

  // Format Single Medicine Batches Report (e.g. "batches of dolo650")
  formatSingleMedicineBatches(med, context, role) {
    const batches = this.getBatchesForMedicine(med, context.batches);
    const activeBatches = batches.filter((b) => b.quantity > 0 && b.daysLeft > 0);
    activeBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    const depletedBatches = batches.filter((b) => b.quantity <= 0 || b.daysLeft <= 0);
    const totalUnits = activeBatches.reduce((sum, b) => sum + b.quantity, 0);
    const minStock = med.minimumStock || 40;
    const fefoBatch = activeBatches[0];
    const isLow = totalUnits <= minStock;
    const isDepleted = totalUnits === 0;

    const batchRows = activeBatches.map((b, idx) => {
      const isFefo = idx === 0;
      const statusBadge = b.daysLeft <= 30
        ? `🟠 CRITICAL (${b.daysLeft}d left)`
        : isFefo
        ? `🟢 FEFO NEXT (${b.daysLeft}d left)`
        : `🟢 ${b.daysLeft}d left`;
      return `• Batch \`${b.batchNumber}\`: **${b.quantity} units** | Mfg: ${b.manufacturingDate || "Recorded"} | Exp: **${b.expiryDate}** [${statusBadge}] | Supplier: \`${b.supplier || "Supplier"}\``;
    });

    const depletedRows = depletedBatches.map((b) => {
      const reason = b.daysLeft <= 0 ? `⚠️ EXPIRED (${b.expiryDate})` : "DEPLETED (0 units)";
      return `• Batch \`${b.batchNumber}\`: 0 units | Exp: ${b.expiryDate} [🔴 ${reason}]`;
    });

    const text = `🏷️ **Active Batch Consignments: ${med.brandName}** ${med.genericMedicine ? `(${med.genericMedicine})` : ""}\n\n` +
      `• **Therapeutic Formulation:** ${med.dosageForm || "Tablet"} ${med.strength || ""} | Mfr: ${med.manufacturer || "Certified Supplier"}\n` +
      `• **Total Usable Stock on Hand:** **${totalUnits.toLocaleString()} units** across ${activeBatches.length} batch(es)\n` +
      `• **Safety Minimum Stock:** ${minStock} units [${isDepleted ? "🔴 OUT OF STOCK" : isLow ? "🟠 LOW STOCK" : "🟢 HEALTHY BUFFER"}]\n` +
      `• **Allocated FEFO Batch (Dispense First):** ${fefoBatch ? `\`${fefoBatch.batchNumber}\` (**${fefoBatch.quantity} units**, Expires: ${fefoBatch.expiryDate}, **${fefoBatch.daysLeft} days remaining**)` : "⚠️ No usable batch in stock!"}\n\n` +
      `📋 **Batch Breakdown (FEFO Rotation Order):**\n` +
      (batchRows.length > 0 ? batchRows.join("\n") : "• ⚠️ *No active consignments in stock.*") + "\n" +
      (depletedRows.length > 0 ? "\n**Archived / Depleted Batches:**\n" + depletedRows.join("\n") + "\n" : "") + "\n" +
      `*Under MediTrack FEFO policy, always exhaust Batch \`${fefoBatch?.batchNumber || "earliest"}\` prior to opening subsequent consignments.*`;

    return {
      text,
      type: isDepleted ? "danger" : isLow ? "warning" : "success",
      actions: [
        fefoBatch ? { label: "Dispense " + med.brandName, path: "/pharmacist/dispense" } : null,
        { label: "View Batches Module", path: "/admin/batches" },
        isLow ? { label: "Auto Reorder", path: "/admin/reorder" } : null,
      ].filter(Boolean),
    };
  },

  // Format All Medicines with Batches (e.g. "list all medicines with batches")
  formatAllMedicinesWithBatches(context, role) {
    const activeMeds = context.medicines.filter((m) => m.status === "active");

    const medSections = activeMeds.map((med) => {
      const batches = this.getBatchesForMedicine(med, context.batches);
      const activeBatches = batches.filter((b) => b.quantity > 0 && b.daysLeft > 0);
      activeBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      const totalUnits = activeBatches.reduce((sum, b) => sum + b.quantity, 0);
      const minStock = med.minimumStock || 40;
      const isLow = totalUnits <= minStock;
      const isDepleted = totalUnits === 0;
      const badge = isDepleted ? "🔴 OUT OF STOCK" : isLow ? `🟠 LOW (${totalUnits}/${minStock})` : `🟢 OK (${totalUnits} units)`;

      let batchLines = "";
      if (activeBatches.length > 0) {
        batchLines = activeBatches.map((b, idx) => {
          const isFefo = idx === 0;
          const status = b.daysLeft <= 30 ? `🟠 Critical (${b.daysLeft}d left)` : isFefo ? `🟢 FEFO Next (${b.daysLeft}d left)` : `🟢 ${b.daysLeft}d left`;
          return `  - Batch \`${b.batchNumber}\`: **${b.quantity} units** (Exp: ${b.expiryDate}, ${status}) | \`${b.supplier || "Supplier"}\``;
        }).join("\n");
      } else {
        batchLines = "  - *No active batches in stock (Depleted)*";
      }

      return `• **${med.brandName}** (${med.genericMedicine || med.genericName || "Drug"}) — \`${med.dosageForm || "Tablet"} ${med.strength || ""}\` [${badge}]\n${batchLines}`;
    });

    const text = `📋 **MediTrack Formulary: Active Medicines with Batch Consignments**\n\n` +
      `MediTrack is tracking **${activeMeds.length} medicines** across **${context.batches.length} batches**:\n\n` +
      medSections.join("\n\n") + "\n\n" +
      `*All consignments are automatically queued in First-Expired, First-Out (FEFO) sequence.*`;

    return {
      text,
      type: "info",
      actions: [
        { label: "Batch Management", path: "/admin/batches" },
        { label: "Dispense Launchpad", path: "/pharmacist/dispense" },
        { label: "Expiry Horizon Radar", path: role === "admin" ? "/admin/expiry" : "/pharmacist/expiry-alerts" },
      ],
    };
  },

  // Format Full Inventory of Each Medicine (e.g. "inventory of each medicine")
  formatFullInventoryAllMedicines(context, role) {
    const activeMeds = context.medicines.filter((m) => m.status === "active");
    const totalPhysicalUnits = context.batches.reduce((sum, b) => sum + b.quantity, 0);
    const lowStockMeds = [];

    const medRows = activeMeds.map((med) => {
      const batches = this.getBatchesForMedicine(med, context.batches);
      const activeBatches = batches.filter((b) => b.quantity > 0 && b.daysLeft > 0);
      activeBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      const totalUnits = activeBatches.reduce((sum, b) => sum + b.quantity, 0);
      const minStock = med.minimumStock || 40;
      const fefo = activeBatches[0];

      const isDepleted = totalUnits === 0;
      const isLow = totalUnits <= minStock;
      const badge = isDepleted ? "🔴 DEPLETED" : isLow ? `🟠 LOW STOCK (${totalUnits}/${minStock})` : `🟢 OK (${totalUnits} units)`;

      if (isLow || isDepleted) {
        lowStockMeds.push({ name: med.brandName, stock: totalUnits, min: minStock, roq: Math.max(0, minStock * 2 - totalUnits) });
      }

      const fefoInfo = fefo ? `Next Exp: ${fefo.expiryDate} (${fefo.daysLeft}d left)` : "No active batches";
      return `• **${med.brandName}** (${med.genericMedicine || med.genericName || ""}) — \`${med.dosageForm || "Tablet"} ${med.strength || ""}\`\n` +
        `  Stock: **${totalUnits} units** | Min: ${minStock} | Batches: ${activeBatches.length} | Status: [${badge}] | ${fefoInfo}`;
    });

    const text = `📦 **Complete Pharmacy Inventory Breakdown (All Medicines)**\n\n` +
      `• **Total Active Medicines:** **${activeMeds.length} items** registered\n` +
      `• **Total Usable Units in Stock:** **${totalPhysicalUnits.toLocaleString()} units** across ${context.batches.length} batches\n` +
      `• **Estimated Formulary Asset Value:** **$${(totalPhysicalUnits * 0.28).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**\n` +
      `• **Medicines Below Minimum Safety Stock:** **${lowStockMeds.length} item(s)** flagged for replenishment\n\n` +
      `📋 **Itemized Formulary Stock Levels:**\n\n` +
      medRows.join("\n\n") + "\n\n" +
      (lowStockMeds.length > 0
        ? `⚠️ **Top Items Requiring Auto-Reorder:**\n` +
          lowStockMeds.slice(0, 4).map((m) => `• **${m.name}**: ${m.stock} left (Min: ${m.min}) — Suggested ROQ: **${m.roq} units**`).join("\n") +
          `\n\n`
        : "") +
      `Click below to adjust stock quantities or process purchase reorders:`;

    return {
      text,
      type: lowStockMeds.length > 0 ? "warning" : "info",
      actions: [
        { label: "Open Inventory", path: "/admin/inventory" },
        { label: "Review Auto Reorder", path: "/admin/reorder" },
        { label: "Export Reports", path: "/admin/reports" },
      ],
    };
  },

  // Process user prompt with the Local Clinical Engine
  async processLocalQuery(query, user, activePath = "") {
    const context = await this.getLiveContext();
    const q = query.toLowerCase().trim();
    const role = user?.role || "pharmacist";

    // Run NLP Engine for tokenization, NER entity extraction, and intent classification
    const nlp = nlpProcessor.parse(query, context.medicines, context.batches);

    // 1. Check for drug interaction queries (only if explicitly inquiring about interaction/combination)
    const isExplicitInteraction =
      (q.includes("interaction") || q.includes("interact") || q.includes("combine") || q.includes("together") || q.includes("contraindication") || q.includes("safe with") || q.includes("take with")) &&
      !q.includes("batch") &&
      !q.includes("stock") &&
      !q.includes("inventory");

    if (isExplicitInteraction) {
      const allDrugs = ["ibuprofen", "warfarin", "aspirin", "lisinopril", "spironolactone", "metformin", "radiocontrast", "amoxicillin", "methotrexate", "omeprazole", "clopidogrel", "paracetamol", "alcohol", "azithromycin", "amiodarone", "salbutamol", "propranolol"];
      const detected = allDrugs.filter((d) => q.includes(d));

      if (detected.length >= 2) {
        const found = this.checkDrugInteractions(detected);
        if (found.length > 0) {
          const rule = found[0];
          return {
            text: `⚠️ **Clinical Interaction Detected: ${rule.drugs.join(" + ")}**\n\n` +
              `• **Severity:** \`${rule.severity}\`\n` +
              `• **Clinical Consequence:** ${rule.effect}\n` +
              `• **Mechanism:** ${rule.description}\n` +
              `• **Pharmacist Action:** ${rule.action}\n\n` +
              `> *Regulatory Note: Document clinical intervention in prescription record before dispensing.*`,
            type: "warning",
            actions: [
              { label: "Go to Dispensing", path: "/pharmacist/dispense" },
              { label: "Check Audit Logs", path: "/admin/audit-logs" },
            ],
          };
        }
      }

      // Fallback interaction overview
      return {
        text: `🔍 **Clinical Drug-Drug Interaction Safety Radar**\n\n` +
          `MediTrack Pro monitors critical interactions in the dispensing workflow:\n\n` +
          `1. **Ibuprofen + Warfarin**: Severe GI bleeding hazard (Avoid concurrent use).\n` +
          `2. **Lisinopril + Spironolactone**: Life-threatening hyperkalemia.\n` +
          `3. **Metformin + Radiocontrast**: Lactic acidosis & renal failure.\n` +
          `4. **Amoxicillin + Methotrexate**: Methotrexate bone marrow toxicity.\n` +
          `5. **Paracetamol + Alcohol**: Accelerated toxic NAPQI hepatotoxicity.\n\n` +
          `*To run a live check, ask: "Check interaction between Ibuprofen and Warfarin" or "Can I take Metformin with Radiocontrast?"*`,
        type: "info",
        actions: [{ label: "Clinical Dispense Launchpad", path: "/pharmacist/dispense" }],
      };
    }

    // 2. Prescription Expiry Conflict Check (DaysRemaining < TreatmentDays)
    const treatmentMatch = q.match(/(?:prescription|treatment|course|dispense for|for)\s+(\d+)\s*(?:days|day)/i);
    if (treatmentMatch || q.includes("conflict check") || q.includes("treatment days")) {
      const days = treatmentMatch ? parseInt(treatmentMatch[1], 10) : 30;
      // Search for medicine mentioned
      const sampleMed = context.medicines.find((m) => q.includes(m.brandName.toLowerCase()) || q.includes(m.genericMedicine?.toLowerCase())) || context.medicines[0];
      const conflictRes = this.evaluatePrescriptionConflict(sampleMed.brandName, days, context.batches);

      if (conflictRes.found) {
        if (conflictRes.isConflict) {
          return {
            text: `🚨 **Patient Expiry Conflict Detected! ($DaysRemaining < TreatmentDays$)**\n\n` +
              `• **Prescription Duration:** \`${days} Days\`\n` +
              `• **Primary FEFO Batch:** \`${conflictRes.candidateBatch.batchNumber}\` (Expires in **${conflictRes.candidateBatch.daysLeft} days** on ${conflictRes.candidateBatch.expiryDate})\n` +
              `• **Risk:** Batch will expire **BEFORE** the patient finishes their ${days}-day treatment course!\n\n` +
              (conflictRes.safeAlternative
                ? `✅ **FEFO Override Recommended:**\nUse Batch \`${conflictRes.safeAlternative.batchNumber}\` instead (Expires in **${conflictRes.safeAlternative.daysLeft} days** on ${conflictRes.safeAlternative.expiryDate}, Stock: ${conflictRes.safeAlternative.quantity} units).\n\n`
                : `⚠️ **No safer batch currently in stock** for ${sampleMed.brandName} that covers ${days} days. Consider split dispensing or placing an emergency reorder.\n\n`) +
              `*The MediTrack clinical FEFO algorithm automatically flags this during Step 3 of guided dispensing.*`,
            type: "danger",
            actions: [
              { label: "Launch Guided Dispensing", path: "/pharmacist/dispense" },
              { label: "Check Auto Reorder", path: "/admin/reorder" },
            ],
          };
        } else {
          return {
            text: `✅ **FEFO Batch Verification Passed!**\n\n` +
              `• **Medicine:** ${conflictRes.medicineName}\n` +
              `• **Prescribed Course:** \`${days} Days\`\n` +
              `• **Allocated FEFO Batch:** \`${conflictRes.candidateBatch.batchNumber}\`\n` +
              `• **Shelf-Life Remaining:** **${conflictRes.candidateBatch.daysLeft} days** (Expires: ${conflictRes.candidateBatch.expiryDate})\n` +
              `• **Stock Available:** ${conflictRes.candidateBatch.quantity} units\n` +
              `• **Safety Margin:** +${conflictRes.candidateBatch.daysLeft - days} buffer days after treatment completion.\n\n` +
              `Safe to proceed with clinical dispensing.`,
            type: "success",
            actions: [{ label: "Open Dispense Cart", path: "/pharmacist/dispense" }],
          };
        }
      }
    }

    // 3. FEFO Allocation query
    // 3. FEFO Allocation query or FEFO vs FIFO explanation
    if (
      nlp.intent === "FEFO_EXPLANATION" ||
      q.includes("what is fefo") ||
      q.includes("explain fefo") ||
      q.includes("fefo vs fifo") ||
      q.includes("why fefo") ||
      q.includes("fefo meaning")
    ) {
      return {
        text: `🏷️ **FEFO (First-Expired, First-Out) Explained**\n\n` +
          `• **Core Principle:** In MediTrack Pro, medicines are allocated strictly based on the **earliest expiry date**, not by arrival order.\n` +
          `• **FEFO vs. FIFO:**\n` +
          `  - **FIFO (First-In, First-Out):** Sells the oldest received stock. In pharmacy, newer shipments can arrive with *shorter* shelf-lives; FIFO leads to catastrophic expired inventory on shelves.\n` +
          `  - **FEFO (First-Expired, First-Out):** Prioritizes batches nearing expiry first, minimizing write-offs and guaranteeing that patients receive safe, potent medication.\n` +
          `• **Patient Regimen Protection:** MediTrack automatically validates $DaysRemaining \\ge TreatmentDays$. If a batch would expire during an active prescription course, the system blocks allocation and selects a safer batch.`,
        type: "info",
        actions: [
          { label: "Check Expiry Radar", path: role === "admin" ? "/admin/expiry" : "/pharmacist/expiry-alerts" },
          { label: "Dispense via FEFO", path: "/pharmacist/dispense" },
        ],
      };
    }

    if (q.includes("fefo") || q.includes("first expired") || q.includes("which batch should i dispense") || q.includes("best batch")) {
      const matchedMed = context.medicines.find((m) => q.includes(m.brandName.toLowerCase()) || q.includes(m.genericMedicine?.toLowerCase())) || context.medicines[0];
      const fefo = this.findFefoBatch(matchedMed.brandName, context.batches);

      if (fefo) {
        return {
          text: `🏷️ **FEFO Batch Allocation for ${matchedMed.brandName} (${matchedMed.genericMedicine || matchedMed.genericName})**\n\n` +
            `Under MediTrack's strict **First-Expired, First-Out** policy, dispense the earliest expiring safe batch:\n\n` +
            `• **Allocated Batch:** \`${fefo.batchNumber}\`\n` +
            `• **Expiry Date:** \`${fefo.expiryDate}\` (**${fefo.daysLeft} days remaining**)\n` +
            `• **Available Quantity:** **${fefo.quantity} units**\n` +
            `• **Supplier:** ${fefo.supplier || "Standard Supplier"}\n` +
            `• **Status:** ${fefo.status}\n\n` +
            `FEFO minimizes shelf perishability and ensures optimal stock turnover.`,
          type: "info",
          actions: [
            { label: "Dispense This Medicine", path: "/pharmacist/dispense" },
            { label: "View Batches", path: "/admin/batches" },
          ],
        };
      }
    }

    // 4. Specific Batch Code Lookup (e.g. "Where is batch PCM2026A", "BAT-001", "Info on batch DLO2026A")
    const detectedBatch = context.batches.find((b) => {
      const bNum = String(b.batchNumber || "").toLowerCase();
      const bId = String(b.id || "").toLowerCase();
      if (bNum.length >= 3 && q.includes(bNum)) return true;
      if (bId.startsWith("bat") && q.includes(bId)) return true;
      return false;
    });

    if (detectedBatch) {
      return {
        text: `🏷️ **Batch Consignment Details: \`${detectedBatch.batchNumber}\`**\n\n` +
          `• **Medicine:** **${detectedBatch.medicineName}** ${detectedBatch.genericName ? `(${detectedBatch.genericName})` : ""}\n` +
          `• **Available Stock:** **${detectedBatch.quantity} units**\n` +
          `• **Manufacturing Date:** ${detectedBatch.manufacturingDate || "Recorded"}\n` +
          `• **Expiry Date:** **${detectedBatch.expiryDate}** (${detectedBatch.daysLeft > 0 ? `${detectedBatch.daysLeft} days remaining` : "⚠️ EXPIRED"})\n` +
          `• **Supplier:** \`${detectedBatch.supplier || "Standard Supplier"}\`\n` +
          `• **Status:** **${detectedBatch.status?.toUpperCase() || (detectedBatch.daysLeft > 0 ? "USABLE" : "EXPIRED")}**\n` +
          `• **Safety Threshold:** Minimum ${detectedBatch.minimumStock || 20} units\n\n` +
          (detectedBatch.daysLeft <= 0
            ? `🔴 **Hazard Notice:** This batch is expired. It has been quarantined from patient dispensing.`
            : `🟢 **Usability:** Safe for FEFO dispensing.`),
        type: detectedBatch.daysLeft <= 0 ? "danger" : detectedBatch.daysLeft <= 30 ? "warning" : "success",
        actions: [
          detectedBatch.daysLeft > 0 ? { label: "Dispense Batch", path: "/pharmacist/dispense" } : null,
          { label: "View in Batches Table", path: "/admin/batches" },
        ].filter(Boolean),
      };
    }

    // 5. Specific Purchase Order Lookup (e.g. "ORD-006", "order ORD-008")
    const orderMatch = q.match(/ord-?(\d+)/i);
    if (orderMatch) {
      const orderNumQuery = orderMatch[0].toUpperCase();
      const matchedOrder = context.allOrders.find(
        (o) => String(o.orderNumber || "").toUpperCase().includes(orderNumQuery) || String(o.id || "").toUpperCase().includes(orderNumQuery)
      );
      if (matchedOrder) {
        return {
          text: `📦 **Purchase Order Status: ${matchedOrder.orderNumber || matchedOrder.id}**\n\n` +
            `• **Item:** **${matchedOrder.brandName || "Medicine"}** ${matchedOrder.genericMedicine ? `(${matchedOrder.genericMedicine})` : ""}\n` +
            `• **Quantity:** **${matchedOrder.approvedQuantity || matchedOrder.suggestedQuantity || 0} units**\n` +
            `• **Supplier:** \`${matchedOrder.supplier || "Supplier"}\`\n` +
            `• **Current Status:** \`${(matchedOrder.status || "ORDERED").toUpperCase()}\`\n` +
            `• **Order Date:** ${matchedOrder.approvedDate ? new Date(matchedOrder.approvedDate).toLocaleDateString() : "Recent"}\n\n` +
            `To receive this shipment and automatically convert it into inventory batches with barcode and expiry date, visit **Order Received**.`,
          type: "info",
          actions: [
            { label: "Order Received Intake", path: "/admin/order-received" },
            { label: "Auto Reorder List", path: "/admin/reorder" },
          ],
        };
      }
    }

    // 5A. Multi-Medicine Batch / Inventory Inquiry (e.g. "batches of dolo650 and calpol 650", "batches of ibuprofen and amoxil")
    const isBatchOrStockWord =
      q.includes("batch") ||
      q.includes("batches") ||
      q.includes("consign") ||
      q.includes("lot") ||
      q.includes("stock") ||
      q.includes("inventory") ||
      q.includes("available");

    if (nlp.entities.medicines.length >= 2 && (isBatchOrStockWord || q.includes("and") || q.includes(","))) {
      const targetMeds = nlp.entities.medicines.map((e) => e.medicine);
      return this.formatMultiMedicineBatches(targetMeds, context, role);
    }

    // 5B. Formulary Catalog with Batches (e.g. "list all medicines with batches", "medicines with batches", "show medicines and batches")
    if (
      nlp.intent === "MEDICINES_WITH_BATCHES" ||
      q.includes("medicines with batches") ||
      q.includes("medicine with batches") ||
      q.includes("medicine with batch") ||
      q.includes("all medicines with batches") ||
      q.includes("show medicines and batches") ||
      q.includes("list all medicines with batches") ||
      q.includes("show medicines with their batches") ||
      q.includes("medicines and their batches") ||
      (q.includes("all medicines") && q.includes("batch")) ||
      (q.includes("list medicines") && q.includes("batch")) ||
      (q.includes("medicines") && q.includes("batches"))
    ) {
      return this.formatAllMedicinesWithBatches(context, role);
    }

    // 5C. Full Inventory of Each Medicine (e.g. "inventory of each medicine", "stock of each medicine", "full inventory", "all inventory", "inventory of all medicines", "stock of all medicines")
    if (
      nlp.intent === "FULL_INVENTORY_ALL" ||
      q.includes("inventory of each") ||
      q.includes("stock of each") ||
      q.includes("full inventory") ||
      q.includes("all inventory") ||
      q.includes("inventory of all") ||
      q.includes("stock of all") ||
      q.includes("complete inventory") ||
      q.includes("entire inventory") ||
      q.includes("all medicine stock") ||
      q.includes("all medicines stock") ||
      q.includes("stock of every medicine") ||
      q.includes("every medicine stock") ||
      q.includes("inventory of every medicine") ||
      q.includes("inventory breakdown")
    ) {
      return this.formatFullInventoryAllMedicines(context, role);
    }

    // 5D. Single Medicine Batch Consignments (e.g. "batches of dolo650", "batches of calpol 650", "show batches for amoxil")
    if (
      nlp.entities.medicines.length === 1 &&
      (q.includes("batch") || q.includes("consign") || q.includes("lot") || nlp.intent === "BATCH_CATALOG_LIST")
    ) {
      const targetMed = nlp.entities.medicines[0].medicine;
      return this.formatSingleMedicineBatches(targetMed, context, role);
    }

    // 5E. Single Medicine Full Inventory / Stock (e.g. "full inventory of dolo650", "stock of dolo 650", "how many units of calpol")
    if (
      nlp.entities.medicines.length === 1 &&
      (q.includes("inventory") || q.includes("stock") || q.includes("units") || q.includes("quantity") || q.includes("available") || q.includes("how much") || q.includes("how many") || q.includes("count"))
    ) {
      const targetMed = nlp.entities.medicines[0].medicine;
      return this.formatFullInventoryReport(targetMed, context, role);
    }

    // 5F. Single Medicine Direct Lookup / Pharmacist Formulary & Stock Card (e.g. "dolo650", "dolo 650", "calpol 650", "amoxil")
    const isClinicalOnly =
      q.includes("dosage") ||
      q.includes("dose") ||
      q.includes("mechanism") ||
      q.includes("side effect") ||
      q.includes("antidote") ||
      q.includes("clinical monograph") ||
      q.includes("monograph") ||
      q.includes("cautions only") ||
      q.includes("how to take") ||
      q.includes("pharmacology");

    if (nlp.entities.medicines.length === 1 && !isClinicalOnly) {
      const targetMed = nlp.entities.medicines[0].medicine;
      return this.formatMedicineCard(targetMed, context, role);
    }

    // Direct Spaceless Match for any medicine brand (e.g. "dolo650", "calpol650", "pcm500")
    if (!isClinicalOnly) {
      const qSpaceless = q.replace(/[\s-_]+/g, "");
      const directMed = context.medicines.find((m) => {
        const b = (m.brandName || m.name || "").toLowerCase().trim();
        const bClean = b.replace(/[\s-_]+/g, "");
        const g = (m.genericMedicine || m.genericName || "").toLowerCase().trim();
        const gClean = g.replace(/[\s-_]+/g, "");
        return (
          (b && q === b) ||
          (bClean && qSpaceless === bClean) ||
          (b && q.includes(b)) ||
          (bClean && qSpaceless.includes(bClean)) ||
          (g && q === g) ||
          (gClean && qSpaceless === gClean)
        );
      });
      if (directMed) {
        return this.formatMedicineCard(directMed, context, role);
      }
    }

    // 6. How-To: Guided Dispensing Workflow
    if (
      nlp.intent === "HOW_TO_DISPENSE" ||
      q.includes("how to dispense") ||
      q.includes("dispensing process") ||
      q.includes("dispense steps") ||
      q.includes("how do i dispense") ||
      q.includes("dispense medicine") ||
      q.includes("billing") ||
      q.includes("checkout")
    ) {
      return {
        text: `💊 **Step-by-Step Clinical Dispensing Guide**\n\n` +
          `MediTrack Pro enforces patient safety at every dispensing step:\n\n` +
          `1. **Access Launchpad:** Navigate to **Dispense Medicine** (\`/pharmacist/dispense\`).\n` +
          `2. **Locate Medicine:** Search by brand name, generic name, or scan barcode via camera or USB scanner.\n` +
          `3. **Automatic FEFO Selection:** The system automatically prioritizes the earliest expiring usable batch.\n` +
          `4. **Safety Verification:**\n` +
          `   • Enter prescription duration: The algorithm verifies $DaysRemaining \\ge TreatmentDays$.\n` +
          `   • Checks for drug-drug contraindications (e.g. Warfarin + NSAIDs).\n` +
          `5. **Cart & Invoice:** Add to cart, review quantities, and click **"Complete Dispense & Print Invoice"** to deduct stock and generate the receipt.`,
        type: "info",
        actions: [
          { label: "Open Dispense Console", path: "/pharmacist/dispense" },
          { label: "View Expiry Radar", path: "/pharmacist/expiry-alerts" },
        ],
      };
    }

    // 7. How-To: Add a Medicine to Formulary
    if (
      nlp.intent === "HOW_TO_ADD_MEDICINE" ||
      q.includes("add medicine") ||
      q.includes("how to add medicine") ||
      q.includes("create medicine") ||
      q.includes("register medicine") ||
      q.includes("new drug")
    ) {
      return {
        text: `➕ **How to Add a New Medicine to the Catalog**\n\n` +
          `1. Ensure you are signed in as an **Administrator** (\`admin@meditrack.com\`).\n` +
          `2. Navigate to **Medicine Catalog** (\`/admin/medicines\`).\n` +
          `3. Click the blue **"+ Add Medicine"** button in the top right.\n` +
          `4. Fill in the required metadata:\n` +
          `   • **Brand Name** (e.g. *Dolo 650*, *Augmentin 625*)\n` +
          `   • **Generic Composition** (e.g. *Paracetamol*, *Amoxicillin + Clavulanic Acid*)\n` +
          `   • **Dosage Form & Strength** (e.g. *Tablet*, *650 mg*)\n` +
          `   • **Manufacturer & Category**\n` +
          `   • **Minimum Safety Stock** (Triggers auto-reorder suggestions when inventory drops below this number).\n` +
          `5. Click **"Save Medicine"**. The medicine is now active and ready for batch consignments.`,
        type: "info",
        actions: [
          { label: "Go to Medicines Catalog", path: "/admin/medicines" },
          { label: "Batch Management", path: "/admin/batches" },
        ],
      };
    }

    // 8. How-To: Add a Batch / Consignment
    if (
      nlp.intent === "HOW_TO_ADD_BATCH" ||
      q.includes("add batch") ||
      q.includes("how to add batch") ||
      q.includes("create batch") ||
      q.includes("new consignment") ||
      q.includes("inward batch")
    ) {
      return {
        text: `🏷️ **How to Add an Inventory Batch Consignment**\n\n` +
          `There are two ways to inward batches into MediTrack Pro:\n\n` +
          `**Method A: Direct Batch Registration (Manual)**\n` +
          `1. Go to **Batch Management** (\`/admin/batches\`).\n` +
          `2. Click **"+ Add Batch"**.\n` +
          `3. Select the registered medicine, input **Batch Number** (e.g. \`DLO2026A\`), Manufacturing Date, and Expiry Date.\n` +
          `4. Enter physical quantity received and supplier name.\n` +
          `5. Click **"Register Batch"** — stock immediately appears in FEFO rotation.\n\n` +
          `**Method B: Inwarding from Order Received (Automated)**\n` +
          `1. Go to **Order Received** (\`/admin/order-received\`).\n` +
          `2. When delivery arrives, click **"Goods Received"** on the approved order.\n` +
          `3. Batches and barcodes are auto-generated from purchase order quantities!`,
        type: "info",
        actions: [
          { label: "Add Batch Manually", path: "/admin/batches" },
          { label: "Receive Goods (Intake)", path: "/admin/order-received" },
        ],
      };
    }

    // 9. How-To: Barcode Scanner Usage
    if (
      nlp.intent === "BARCODE_SCAN" ||
      q.includes("barcode") ||
      q.includes("scanner") ||
      q.includes("camera scan") ||
      q.includes("how to scan")
    ) {
      return {
        text: `📷 **Barcode Scanner Integration & Guide**\n\n` +
          `MediTrack Pro supports dual-mode barcode scanning across Dispensing, Inventory, and Intake:\n\n` +
          `• **Camera Scanner (Mobile / Tablet / Laptop):**\n` +
          `  Tap the barcode icon next to the search bar in **Dispense Medicine** or **Inventory** to open your device camera. Align the 1D Code128 / EAN or 2D DataMatrix code in the viewfinder.\n\n` +
          `• **Physical USB / Bluetooth Laser Scanner:**\n` +
          `  Connect any standard plug-and-play barcode scanner. Simply focus on any search input and scan; the reader automatically decodes the batch or medicine barcode and hits enter instantly.\n\n` +
          `• **Fast Batch Recognition:** Scanning a batch number immediately populates the FEFO candidate with zero typing.`,
        type: "info",
        actions: [
          { label: "Test in Dispense Console", path: "/pharmacist/dispense" },
          { label: "View Inventory Barcodes", path: "/admin/inventory" },
        ],
      };
    }

    // 10. How-To: Stock Reconciliation & Damaged / Expired Stock
    if (
      nlp.intent === "STOCK_RECONCILIATION" ||
      q.includes("reconcil") ||
      q.includes("damaged stock") ||
      q.includes("report damaged") ||
      q.includes("discrepancy") ||
      q.includes("adjust stock") ||
      q.includes("write off")
    ) {
      return {
        text: `⚖️ **Inventory Stock Reconciliation & Damage Handling**\n\n` +
          `To comply with pharmaceutical Good Distribution Practice (GDP):\n\n` +
          `1. Go to **Inventory Management** (\`/admin/inventory\`).\n` +
          `2. Click **"Stock Adjustment / Reconciliation"** on the target batch.\n` +
          `3. Select the mandatory reason code:\n` +
          `   • \`DAMAGED\`: Physical breakage or vial leakage.\n` +
          `   • \`EXPIRED\`: Perished batch moved to quarantine.\n` +
          `   • \`AUDIT DISCREPANCY\`: Physical cycle count variance.\n` +
          `   • \`RETURN TO SUPPLIER\`: Manufacturer lot recall.\n` +
          `4. Enter the adjusted quantity and write a brief justification note.\n` +
          `5. System automatically logs user ID, timestamp, and previous vs. new quantity in the **Audit Ledger**.`,
        type: "info",
        actions: [
          { label: "Open Inventory", path: "/admin/inventory" },
          { label: "Inspect Audit Logs", path: "/admin/audit-logs" },
        ],
      };
    }

    // 11. How-To: Export Reports (PDF & Excel)
    if (
      nlp.intent === "REPORTS_EXPORT" ||
      q.includes("export") ||
      q.includes("pdf report") ||
      q.includes("excel report") ||
      q.includes("download report") ||
      q.includes("generate report") ||
      q.includes("sales report")
    ) {
      return {
        text: `📄 **Exporting Reports (PDF & Excel)**\n\n` +
          `MediTrack Pro provides one-click audit and financial export capabilities:\n\n` +
          `1. Navigate to **Reports & Analytics** (\`/admin/reports\`).\n` +
          `2. Choose from the available report modules:\n` +
          `   • **Sales & Revenue Report:** Dispensing turnover, margins, and payment breakdown.\n` +
          `   • **Expiry Audit Ledger:** Critical batches (<=30d) and quarantined expired stock.\n` +
          `   • **Fast vs. Slow Moving Inventory:** ABC velocity classification.\n` +
          `   • **Supplier Performance:** On-time fulfillment and procurement spend.\n` +
          `3. Set your date range (Today, Last 7 Days, Month, or Custom).\n` +
          `4. Click **"Export PDF"** for clean printouts or **"Export Excel"** for deep spreadsheet analysis.`,
        type: "info",
        actions: [
          { label: "Go to Reports Center", path: "/admin/reports" },
          { label: "Smart Demand Insights", path: "/admin/insights" },
        ],
      };
    }

    // 12. System Roles: Admin vs Pharmacist
    if (
      nlp.intent === "SYSTEM_ROLES" ||
      q.includes("admin vs pharmacist") ||
      q.includes("difference between admin") ||
      q.includes("roles") ||
      q.includes("permissions") ||
      q.includes("privilege")
    ) {
      return {
        text: `🛡️ **Role Permissions & Segregation of Duties**\n\n` +
          `MediTrack Pro enforces strict regulatory separation between inventory management and clinical dispensing:\n\n` +
          `• 👑 **Pharmacy Administrator (\`admin\`):**\n` +
          `  - Manages Medicine Catalog, Batch Consignments, and Suppliers.\n` +
          `  - Approves Auto-Reorders and processes **Order Received** inwarding.\n` +
          `  - Conducts Stock Reconciliation and reviews immutable **Audit Logs**.\n` +
          `  - Exports financial and regulatory compliance reports.\n` +
          `  *(Barred from POS dispensing to maintain independent audit integrity)*.\n\n` +
          `• 🩺 **Licensed Pharmacist (\`pharmacist\`):**\n` +
          `  - Operates the clinical **Dispense Launchpad** with FEFO batch assignment.\n` +
          `  - Evaluates prescription conflict warnings ($DaysRemaining < TreatmentDays$).\n` +
          `  - Reviews live drug-drug interactions and monitors daily expiry alerts.\n\n` +
          `*To switch accounts in demo mode, sign in with \`admin@meditrack.com\` or \`pharmacist@meditrack.com\`.*`,
        type: "info",
        actions: [
          { label: "Dispense Console", path: "/pharmacist/dispense" },
          { label: "Audit Logs", path: "/admin/audit-logs" },
        ],
      };
    }

    // 13. Safety Stock, Lead Time & ROQ Formulation
    if (
      nlp.intent === "SAFETY_STOCK_LEAD_TIME" ||
      q.includes("safety stock") ||
      q.includes("lead time") ||
      q.includes("buffer stock") ||
      q.includes("roq formula") ||
      q.includes("reorder quantity") ||
      q.includes("minimum stock formula")
    ) {
      return {
        text: `📐 **Procurement Formulas: Safety Stock & ROQ**\n\n` +
          `MediTrack computes replenishment quantities via statistically rigorous inventory models:\n\n` +
          `1. **Safety Stock ($SS$):**\n` +
          `   $$SS = Z \\times \\sigma_{\\text{daily}} \\times \\sqrt{L}$$\n` +
          `   • $Z = 1.65$ (Configured for 95% service level / 5% stockout probability).\n` +
          `   • $L = 7\\text{ days}$ (Supplier Lead Time turnaround).\n` +
          `   • $\\sigma_{\\text{daily}}$ = Standard deviation of historical daily demand.\n\n` +
          `2. **Recommended Order Quantity (ROQ):**\n` +
          `   $$ROQ = \\max\\left(0, (S + D_{30} + SS) - I_{\\text{curr}}\\right)$$\n` +
          `   • $S$ = Catalog Minimum Stock threshold.\n` +
          `   • $D_{30}$ = 30-day Croston-SBA forecasted demand.\n` +
          `   • $I_{\\text{curr}}$ = Total usable inventory currently on hand.\n\n` +
          `This ensures optimal capital allocation without risking stockouts of vital therapeutics.`,
        type: "info",
        actions: [
          { label: "Auto Reorder Module", path: "/admin/reorder" },
          { label: "Demand Insights", path: "/admin/insights" },
        ],
      };
    }

    // 14. What to do with Expired Medicines / Quarantine Protocol
    if (
      nlp.intent === "EXPIRED_ACTION" ||
      q.includes("what to do with expired") ||
      q.includes("dispose expired") ||
      q.includes("quarantine") ||
      q.includes("handle expired") ||
      q.includes("expired medicine")
    ) {
      const expiredCount = context.expiredBatches.length;
      return {
        text: `☣️ **Pharmaceutical Quarantine & Expired Drug Protocol**\n\n` +
          `MediTrack strictly prevents expired medication from reaching patients:\n\n` +
          `1. **System Auto-Lockout:** Any batch reaching $DaysRemaining \\le 0$ is automatically locked out of the dispensing cart.\n` +
          `2. **Physical Quarantine:** Remove physical boxes from shelves immediately and place them inside the locked, labeled red **Quarantine Container**.\n` +
          `3. **Record Stock Adjustment:** Navigate to **Inventory**, select the expired batch, and execute adjustment with reason code \`EXPIRED\`.\n` +
          `4. **Disposal Manifest:** Hand over to certified biomedical waste contractor or initiate supplier return with an authorized destruction manifest.\n\n` +
          `• **Currently Expired in Database:** **${expiredCount} batch(es)** requiring active disposal.`,
        type: expiredCount > 0 ? "warning" : "info",
        actions: [
          { label: "Review Expired Batches", path: role === "admin" ? "/admin/expiry" : "/pharmacist/expiry-alerts" },
          { label: "Inventory Reconciliation", path: "/admin/inventory" },
        ],
      };
    }

    // 15. Dynamic Live Query: List All Medicines / Catalog
    if (
      nlp.intent === "MEDICINE_CATALOG_LIST" ||
      q.includes("list medicines") ||
      q.includes("all medicines") ||
      q.includes("show medicines") ||
      q.includes("how many medicines") ||
      q.includes("what medicines") ||
      q.includes("catalog list")
    ) {
      const activeMeds = context.medicines.filter((m) => m.status === "active");
      const sampleMeds = activeMeds.slice(0, 8);
      return {
        text: `📋 **MediTrack Formulary: Active Medicines Catalog**\n\n` +
          `There are **${activeMeds.length} active medicines** registered in your system:\n\n` +
          sampleMeds
            .map((m) => {
              const medBatches = context.batches.filter((b) => String(b.medicineId) === String(m.id) && b.daysLeft > 0);
              const units = medBatches.reduce((sum, b) => sum + b.quantity, 0);
              return `• **${m.brandName}** (${m.genericMedicine || m.genericName}) — \`${m.dosageForm || "Tablet"} ${m.strength || ""}\`\n  Stock: **${units} units** | Min: ${m.minimumStock || 40} | Mfr: ${m.manufacturer || "Standard"}`;
            })
            .join("\n\n") +
          `\n\n` +
          (activeMeds.length > 8 ? `*...and ${activeMeds.length - 8} more medicines in the live database.*\n\n` : "") +
          `Click below to view and filter the complete catalog:`,
        type: "info",
        actions: [
          { label: "View Complete Catalog", path: role === "admin" ? "/admin/medicines" : "/pharmacist/medicines" },
          { label: "Dispense Launchpad", path: "/pharmacist/dispense" },
        ],
      };
    }

    // 16. Dynamic Live Query: List All Batches
    if (
      nlp.intent === "BATCH_CATALOG_LIST" ||
      q.includes("list batches") ||
      q.includes("all batches") ||
      q.includes("show batches") ||
      q.includes("active batches") ||
      q.includes("batches list")
    ) {
      const activeBatches = context.batches.filter((b) => b.quantity > 0);
      const sample = activeBatches.slice(0, 7);
      return {
        text: `🏷️ **Active Batch Consignments Snapshot**\n\n` +
          `MediTrack is tracking **${activeBatches.length} active batches** with physical inventory:\n\n` +
          sample
            .map((b) => {
              const statusBadge = b.daysLeft <= 0 ? "🔴 EXPIRED" : b.daysLeft <= 30 ? `🟠 CRITICAL (${b.daysLeft}d)` : `🟢 ${b.daysLeft}d left`;
              return `• Batch \`${b.batchNumber}\`: **${b.medicineName}** — **${b.quantity} units** (Exp: ${b.expiryDate}) [${statusBadge}]`;
            })
            .join("\n") +
          `\n\n` +
          (activeBatches.length > 7 ? `*...and ${activeBatches.length - 7} more consignments.*\n\n` : "") +
          `Click below to inspect or search specific batch codes:`,
        type: "info",
        actions: [
          { label: "Open Batches Module", path: "/admin/batches" },
          { label: "Expiry Horizon Radar", path: role === "admin" ? "/admin/expiry" : "/pharmacist/expiry-alerts" },
        ],
      };
    }

    // 17. Dynamic Live Query: Suppliers & Manufacturers Directory
    if (
      nlp.intent === "SUPPLIER_INQUIRY" ||
      q.includes("supplier") ||
      q.includes("manufacturer") ||
      q.includes("vendor") ||
      q.includes("who supplies") ||
      q.includes("who makes")
    ) {
      const suppliers = new Set();
      context.batches.forEach((b) => { if (b.supplier) suppliers.add(b.supplier); });
      context.allOrders.forEach((o) => { if (o.supplier) suppliers.add(o.supplier); });
      const manufacturers = new Set();
      context.medicines.forEach((m) => { if (m.manufacturer) manufacturers.add(m.manufacturer); });

      const supplierList = Array.from(suppliers);
      const mfrList = Array.from(manufacturers);

      return {
        text: `🏭 **Approved Suppliers & Pharmaceutical Manufacturers**\n\n` +
          `MediTrack maintains certified supply relationships with verified distributors:\n\n` +
          `• **Primary Distribution Suppliers:**\n` +
          supplierList.map((s) => `  - \`${s}\``).join("\n") +
          `\n\n` +
          `• **Pharmaceutical Manufacturers in Formulary:**\n` +
          mfrList.slice(0, 8).map((m) => `  - ${m}`).join("\n") +
          `\n\n` +
          `All incoming shipments are verified via **Order Received** with full lot traceability.`,
        type: "info",
        actions: [
          { label: "Check Auto Reorder", path: "/admin/reorder" },
          { label: "Order Received Intake", path: "/admin/order-received" },
        ],
      };
    }

    // 18. Dynamic Live Query: Therapeutic Categories
    if (
      nlp.intent === "CATEGORY_INQUIRY" ||
      q.includes("category") ||
      q.includes("categories") ||
      q.includes("therapeutic class") ||
      q.includes("classification")
    ) {
      const catCounts = {};
      context.medicines.forEach((m) => {
        const cat = m.dosageForm || "Tablet";
        catCounts[cat] = (catCounts[cat] || 0) + 1;
      });

      return {
        text: `🗂️ **Formulary Therapeutic Categories & Formulations**\n\n` +
          `MediTrack organizes pharmaceuticals across diverse clinical classifications:\n\n` +
          `• 💊 **Analgesics & Antipyretics:** Paracetamol (Dolo 650, Calpol, Crocin), PCM 500\n` +
          `• 🛡️ **NSAIDs (Anti-inflammatory):** Ibuprofen (Brufen 400, Ibugesic)\n` +
          `• 🔬 **Antibiotics (Broad-Spectrum):** Amoxicillin (Amoxil), Azithromycin (Zithromax), Ceftriaxone\n` +
          `• 🌬️ **Respiratory & Antihistamines:** Cetirizine (Zyrtec), Salbutamol (Ventolin), Dextromethorphan (Benadryl)\n` +
          `• 🩸 **Cardiovascular & Antithrombotic:** Lisinopril, Atorvastatin (Lipitor), Aspirin, Warfarin\n` +
          `• 💉 **Endocrine & Antidiabetic:** Metformin (Glucophage), Insulin Glargine (Lantus)\n` +
          `• 🧪 **Gastrointestinal:** Omeprazole (Prilosec), Pantoprazole (Pan 40)\n\n` +
          `Total Registered Formulations: **${context.medicines.length} medications**.`,
        type: "info",
        actions: [
          { label: "Explore Medicines Catalog", path: role === "admin" ? "/admin/medicines" : "/pharmacist/medicines" },
          { label: "Dispense Medicine", path: "/pharmacist/dispense" },
        ],
      };
    }

    // 19. Dynamic Live Query: Price & Valuation Inquiry
    if (
      nlp.intent === "PRICE_INQUIRY" ||
      q.includes("price") ||
      q.includes("cost") ||
      q.includes("how much is") ||
      q.includes("mrp") ||
      q.includes("rate")
    ) {
      // Check if a specific medicine is asked
      const matchedMed = context.medicines.find((m) =>
        q.includes(m.brandName.toLowerCase()) || (m.genericMedicine && q.includes(m.genericMedicine.toLowerCase()))
      );

      if (matchedMed) {
        const medBatches = context.batches.filter((b) => String(b.medicineId) === String(matchedMed.id));
        const totalUnits = medBatches.reduce((sum, b) => sum + b.quantity, 0);
        return {
          text: `💰 **Pricing & Valuation: ${matchedMed.brandName}**\n\n` +
            `• **Dosage Form / Strength:** ${matchedMed.dosageForm || "Tablet"} | ${matchedMed.strength || "Standard"}\n` +
            `• **Estimated Unit Price (MRP):** $${(Math.random() * 0.4 + 0.15).toFixed(2)} per unit\n` +
            `• **Available Units in Stock:** **${totalUnits} units**\n` +
            `• **Estimated Inventory Asset Value:** $${(totalUnits * 0.22).toFixed(2)}\n\n` +
            `*Prices and dispensing invoices are automatically computed and printed during final checkout.*`,
          type: "info",
          actions: [
            { label: "Dispense " + matchedMed.brandName, path: "/pharmacist/dispense" },
            { label: "View Reports", path: "/admin/reports" },
          ],
        };
      }

      const totalUnits = context.batches.reduce((sum, b) => sum + b.quantity, 0);
      return {
        text: `💰 **Live Inventory Financial Valuation**\n\n` +
          `• **Total Usable Units in Stock:** **${totalUnits.toLocaleString()} units** across ${context.batches.length} batches\n` +
          `• **Estimated Total Formulary Value:** **$${(totalUnits * 0.28).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**\n` +
          `• **Average Unit Cost:** ~$0.28\n\n` +
          `Detailed sales receipts, profit margins, and supplier purchase orders are available in **Reports & Analytics**.`,
        type: "info",
        actions: [
          { label: "View Financial Reports", path: "/admin/reports" },
          { label: "Auto Reorder Costs", path: "/admin/reorder" },
        ],
      };
    }

    // 20. Dynamic Live Query: Sales, Revenue, & Turnover
    if (
      nlp.intent === "SALES_REVENUE" ||
      q.includes("sales") ||
      q.includes("revenue") ||
      q.includes("how much sold") ||
      q.includes("turnover") ||
      q.includes("dispensing transactions")
    ) {
      return {
        text: `📈 **Pharmacy Sales & Dispensing Volume Overview**\n\n` +
          `• **Active Dispensing Station:** Operational (POS Launchpad active)\n` +
          `• **Fast-Moving Medications:** Dolo 650, Calpol 650, Amoxil 500, Ventolin Inhaler\n` +
          `• **Average Daily Dispensed Units:** ~145 units\n` +
          `• **Inventory Turnover Ratio:** High turnover with strict FEFO minimization of write-offs\n\n` +
          `Download complete transaction ledgers with itemized patient billing below:`,
        type: "info",
        actions: [
          { label: "Export Sales Report (PDF/Excel)", path: "/admin/reports" },
          { label: "Dispense Console", path: "/pharmacist/dispense" },
        ],
      };
    }

    // 21. User Profile, Account & Password
    if (
      nlp.intent === "USER_PROFILE" ||
      q.includes("password") ||
      q.includes("profile") ||
      q.includes("change password") ||
      q.includes("my account") ||
      q.includes("credentials")
    ) {
      return {
        text: `👤 **User Account & Session Management**\n\n` +
          `• **Signed In User:** **${user?.name || "Dr. Sarah Mitchell"}**\n` +
          `• **Assigned Role:** \`${user?.role === "admin" ? "Pharmacy Administrator" : "Licensed Pharmacist"}\`\n` +
          `• **Email:** \`${user?.email || (user?.role === "admin" ? "admin@meditrack.com" : "pharmacist@meditrack.com")}\`\n\n` +
          `To manage your profile or change demo accounts:\n` +
          `1. Tap your profile avatar in the top right navigation bar.\n` +
          `2. Default demo credentials:\n` +
          `   - Administrator: \`admin@meditrack.com\` / \`admin123\`\n` +
          `   - Pharmacist: \`pharmacist@meditrack.com\` / \`pharma123\``,
        type: "info",
        actions: [
          { label: "Open Profile", path: role === "admin" ? "/admin/profile" : "/pharmacist/profile" },
          { label: "Audit Trail", path: "/admin/audit-logs" },
        ],
      };
    }

    // 22. About MediTrack Pro / Features Overview
    if (
      nlp.intent === "ABOUT_MEDITRACK" ||
      q.includes("what is meditrack") ||
      q.includes("about meditrack") ||
      q.includes("system overview") ||
      q.includes("what can this app do") ||
      q.includes("features")
    ) {
      return {
        text: `🏥 **MediTrack Pro: Smart Pharmaceutical Inventory & Clinical Safety System**\n\n` +
          `MediTrack Pro is an enterprise hospital & community pharmacy management platform built for zero-waste inventory and patient safety:\n\n` +
          `• 🏷️ **Clinical FEFO Allocation:** First-Expired, First-Out batch selection with prescription conflict checking ($DaysRemaining < TreatmentDays$).\n` +
          `• ⚠️ **Drug Interaction Radar:** Live contraindication and bleeding hazard warnings.\n` +
          `• 📊 **Croston-SBA Demand Forecasting:** Mathematical algorithm tailored for intermittent, lumpy pharmaceutical consumption.\n` +
          `• 🔄 **Closed-Loop Procurement:** Safety stock triggers auto-reorders, received at **Order Received** to create new batches.\n` +
          `• ⏳ **Expiry Horizon Radar:** 4-tier visual perishability tracking (Expired, Critical, Near, Safe).\n` +
          `• 📜 **GxP Compliance & Audit Ledger:** Tamper-evident logging of all stock adjustments and user actions.`,
        type: "info",
        actions: [
          { label: "Guided Dispensing", path: "/pharmacist/dispense" },
          { label: "Inventory Management", path: "/admin/inventory" },
          { label: "Auto Reorder", path: "/admin/reorder" },
        ],
      };
    }

    // 23. Conversational: Thanks & Politeness
    if (
      nlp.intent === "THANKS" ||
      q === "thanks" ||
      q === "thank you" ||
      q === "thank you so much" ||
      q === "great thanks" ||
      q === "awesome" ||
      q === "perfect"
    ) {
      return {
        text: `😊 **You are very welcome!**\n\n` +
          `I am always here to assist with clinical contraindications, FEFO batch allocations, stock inquiries, or inwarding workflows.\n\n` +
          `Is there anything else I can help you with today?`,
        type: "success",
        actions: [
          { label: "Dispense Launchpad", path: "/pharmacist/dispense" },
          { label: "Check Expiry Radar", path: role === "admin" ? "/admin/expiry" : "/pharmacist/expiry-alerts" },
        ],
      };
    }

    // 24. Conversational: Greetings & Hello
    if (
      nlp.intent === "GREETING" ||
      q === "hi" ||
      q === "hello" ||
      q === "hey" ||
      q.includes("good morning") ||
      q.includes("good afternoon") ||
      q.includes("good evening")
    ) {
      return {
        text: `👋 **Hello ${user?.name || "there"}! Welcome to MediTrack Chatbot.**\n\n` +
          `I am synchronized directly with your live pharmacy database (**${context.medicines.length} medicines**, **${context.batches.length} active batches**).\n\n` +
          `What would you like to check or perform right now?`,
        type: "info",
        actions: [
          { label: "Dispense Medicine", path: "/pharmacist/dispense" },
          { label: "Check Expiry Radar", path: role === "admin" ? "/admin/expiry" : "/pharmacist/expiry-alerts" },
          { label: "Stock Overview", path: "/admin/inventory" },
          { label: "Order Received", path: "/admin/order-received" },
        ],
      };
    }

    // 25. Help Menu & Question Directory
    if (
      nlp.intent === "HELP" ||
      q === "help" ||
      q.includes("what can you do") ||
      q.includes("what questions") ||
      q.includes("how can you help") ||
      q.includes("commands")
    ) {
      return {
        text: `💡 **MediTrack Chatbot: Comprehensive Question Directory**\n\n` +
          `You can ask me any question in natural language. Here are popular topics:\n\n` +
          `• 💊 **Medicine Lookups:** *"Tell me about Dolo 650"*, *"Uses of Metformin"*, *"Dose for Amoxicillin"*, *"What is the price of Paracetamol?"*\n` +
          `• 📦 **Inventory & Batches:** *"What's our stock for Ibuprofen?"*, *"List all batches"*, *"Show medicines"*, *"Show low stock"*, *"Where is batch PCM2026A?"*\n` +
          `• ⏳ **Expiry & Perishability:** *"Which batches expire in 30 days?"*, *"Show expired medicines"*, *"What to do with expired stock?"*\n` +
          `• 🏷️ **FEFO & Clinical Safety:** *"Which batch should I dispense for Calpol?"*, *"What is FEFO?"*, *"Check interaction between Ibuprofen and Warfarin"*\n` +
          `• 📖 **How-To Guides:** *"How to dispense medicine?"*, *"How to add a medicine?"*, *"How to add a batch?"*, *"How to scan barcode?"*, *"How to record damaged stock?"*\n` +
          `• 🛒 **Procurement & Inwarding:** *"Show order received awaiting medicine"*, *"Explain Croston-SBA"*, *"What is safety stock formula?"*\n` +
          `• 👥 **Roles & Admin:** *"Difference between Admin and Pharmacist"*, *"How to export reports?"*, *"Show suppliers"*`,
        type: "info",
        actions: [
          { label: "Guided Dispensing", path: "/pharmacist/dispense" },
          { label: "Expiry Horizon", path: role === "admin" ? "/admin/expiry" : "/pharmacist/expiry-alerts" },
          { label: "Auto Reorder", path: "/admin/reorder" },
        ],
      };
    }

    // 26. Expiry tracking / Expired batches
    if (q.includes("expiry") || q.includes("expire") || q.includes("perish") || q.includes("critical batch")) {
      const critical = context.batches.filter((b) => b.daysLeft > 0 && b.daysLeft <= 30);
      const near = context.batches.filter((b) => b.daysLeft > 30 && b.daysLeft <= 90);
      const expired = context.expiredBatches;

      return {
        text: `⏳ **MediTrack Expiry Horizon Radar Snapshot**\n\n` +
          `• 🔴 **Expired Batches (0 Days):** ${expired.length} batch(es) quarantine required.\n` +
          `• 🟠 **Critical Batches (<=30 Days):** ${critical.length} batch(es) nearing expiry.\n` +
          `• 🟡 **Near Expiry (31-90 Days):** ${near.length} batch(es) prioritized for FEFO dispensing.\n` +
          `• 🟢 **Safe Batches (>90 Days):** ${context.batches.length - expired.length - critical.length - near.length} batch(es).\n\n` +
          (critical.length > 0
            ? `**Immediate Action Required on Critical Batches:**\n` +
              critical.slice(0, 3).map((b) => `• \`${b.batchNumber}\` (${b.medicineName}): **${b.daysLeft}d left**, Stock: ${b.quantity} units`).join("\n") +
              `\n\n`
            : "") +
          `Would you like to inspect the complete expiry radar or export an Expiry Audit Report?`,
        type: critical.length > 0 || expired.length > 0 ? "warning" : "info",
        actions: [
          { label: "Open Expiry Radar", path: role === "admin" ? "/admin/expiry" : "/pharmacist/expiry-alerts" },
          { label: "Generate Expiry Report", path: "/admin/reports" },
        ],
      };
    }

    // 27. General Stock / Low stock queries (when no specific medicine specified)
    if (q.includes("low stock") || q.includes("out of stock") || q.includes("replenish") || q.includes("safety stock status")) {
      const lowStock = context.lowStockBatches;
      return {
        text: `📦 **Real-Time Inventory Status Overview**\n\n` +
          `• **Total Active Medicines:** ${context.medicines.filter((m) => m.status === "active").length} items\n` +
          `• **Total Usable Units in Stock:** ${context.batches.reduce((sum, b) => sum + b.quantity, 0).toLocaleString()} units\n` +
          `• **Batches Below Minimum Threshold:** **${lowStock.length} batch(es)** flagged for replenishment\n\n` +
          (lowStock.length > 0
            ? `**Top Items Needing Restock:**\n` +
              lowStock.slice(0, 4).map((b) => `• **${b.medicineName}** (Batch \`${b.batchNumber}\`): ${b.quantity} left (Min: ${b.minimumStock || 20})`).join("\n") +
              `\n\n`
            : `All active items are currently above their safety thresholds.\n\n`) +
          `Click below to review reorder quantities computed via Croston-SBA forecasting:`,
        type: lowStock.length > 0 ? "warning" : "info",
        actions: [
          { label: "Review Auto Reorder", path: "/admin/reorder" },
          { label: "Inventory Management", path: "/admin/inventory" },
        ],
      };
    }

    // 28. Croston-SBA Demand Forecasting explanation
    if (q.includes("croston") || q.includes("forecast") || q.includes("sba") || q.includes("demand") || q.includes("algorithm")) {
      return {
        text: `📊 **Croston's Method with Syntetos-Boylan Approximation (SBA)**\n\n` +
          `MediTrack Pro uses the Croston-SBA mathematical model specifically engineered for **intermittent, non-continuous pharmaceutical demand**:\n\n` +
          `1. **Demand Separation:** Breaks dispensing history into two independent exponential smoothing series:\n` +
          `   • Non-zero demand size ($z_t$ with smoothing parameter $\\alpha$)\n` +
          `   • Inter-arrival interval between demands ($p_t$ with parameter $\\beta$)\n` +
          `2. **SBA Correction Factor:** Corrects Croston's positive bias by scaling estimates by $(1 - \\frac{\\beta}{2})$:\n` +
          `   $$\\hat{y}_{t+1} = \\left(1 - \\frac{\\beta}{2}\\right) \\frac{z_t}{p_t}$$\n` +
          `3. **Safety Stock & ROQ:** Combines lead time ($L = 7\\text{d}$), service level ($Z = 1.65$ for 95%), and daily standard deviation to compute the Suggested Reorder Quantity.\n\n` +
          `This prevents stockouts of life-saving drugs while eliminating wasteful capital lockup in overstocked perishables.`,
        type: "info",
        actions: [
          { label: "Explore Smart Insights", path: "/admin/insights" },
          { label: "View Auto Reorder Engine", path: "/admin/reorder" },
        ],
      };
    }

    // 29. Drug Clinical Monograph lookup (explicit clinical queries only)
    const isClinicalMonographQuery =
      nlp.intent === "CLINICAL_MONOGRAPH" ||
      q.includes("dosage") ||
      q.includes("dose") ||
      q.includes("mechanism") ||
      q.includes("side effect") ||
      q.includes("antidote") ||
      q.includes("clinical monograph") ||
      q.includes("monograph") ||
      q.includes("tell me about") ||
      q.includes("pharmacology");

    if (isClinicalMonographQuery) {
      const qSpaceless = q.replace(/[\s-_]+/g, "");
      for (const [key, monograph] of Object.entries(CLINICAL_MONOGRAPHS)) {
        const keySpaceless = key.replace(/[\s-_]+/g, "");
        if (q.includes(key) || (keySpaceless && qSpaceless.includes(keySpaceless))) {
          return {
            text: `💊 **Clinical Drug Monograph: ${monograph.name}**\n\n` +
              `• **Therapeutic Class:** ${monograph.class}\n` +
              `• **Mechanism of Action:** ${monograph.mechanism}\n` +
              `• **Adult Dosage:** ${monograph.adultDose}\n` +
              `• **Pediatric Dosage:** ${monograph.pediatricDose}\n` +
              `• **Critical Cautions:** ${monograph.cautions}\n` +
              `• **Toxicity & Antidote:** ${monograph.antidote}\n\n` +
              `*MediTrack Clinical FEFO verifies prescription batch expiry before every dispense.*`,
            type: "info",
            actions: [
              { label: "Find Stock in Catalog", path: role === "admin" ? "/admin/medicines" : "/pharmacist/medicines" },
              { label: "Dispense " + monograph.name.split(" ")[0], path: "/pharmacist/dispense" },
            ],
          };
        }
      }
    }

    // 30. Specific medicine inventory lookup fallback
    const qSpacelessMed = q.replace(/[\s-_]+/g, "");
    const foundMed = context.medicines.find((m) => {
      const b = (m.brandName || m.name || "").toLowerCase();
      const g = (m.genericMedicine || m.genericName || "").toLowerCase();
      const bClean = b.replace(/[\s-_]+/g, "");
      const gClean = g.replace(/[\s-_]+/g, "");
      return (
        (b && q.includes(b)) ||
        (g && q.includes(g)) ||
        (bClean && qSpacelessMed.includes(bClean)) ||
        (gClean && qSpacelessMed.includes(gClean))
      );
    });

    if (foundMed) {
      return this.formatMedicineCard(foundMed, context, role);
    }

    // 31. Order Received & Awaiting Deliveries (Inwarding Intake)
    if (
      nlp.intent === "ORDER_AWAITING" ||
      q.includes("awaiting") ||
      q.includes("order received") ||
      q.includes("orders received") ||
      q.includes("inwarding") ||
      q.includes("incoming medicine") ||
      q.includes("pending shipment") ||
      q.includes("pending delivery") ||
      q.includes("pending order") ||
      q.includes("goods received")
    ) {
      const awaiting = context.awaitingOrders || [];
      if (awaiting.length > 0) {
        return {
          text: `📦 **Orders Received — Awaiting Inwarding & Delivery**\n\n` +
            `There are currently **${awaiting.length} order(s) awaiting delivery / shipment intake**:\n\n` +
            awaiting
              .map((o) => {
                const medName = o.brandName || o.medicine?.brandName || o.medicineName || "Medicine";
                const generic = o.genericMedicine || o.medicine?.genericMedicine || "";
                const qty = o.approvedQuantity || o.suggestedQuantity || 0;
                const supplier = o.supplier || o.medicine?.manufacturer || "Standard Supplier";
                const orderNum = o.orderNumber || (o.id ? (String(o.id).startsWith("ORD") ? String(o.id) : `ORD-${String(o.id).padStart(3, "0")}`) : "ORD");
                const date = o.approvedDate ? new Date(o.approvedDate).toLocaleDateString() : "Recent";
                return `• **${orderNum}**: **${medName}** ${generic ? `(${generic})` : ""} — **${qty} units**\n  Supplier: \`${supplier}\` | Ordered: ${date} | Status: \`AWAITING RECEIPT\``;
              })
              .join("\n\n") +
            `\n\n` +
            `> When supplier shipments arrive at the loading dock, navigate to **Order Received** to verify physical quantities and automatically create batch consignments with barcode and expiry dates.`,
          type: "info",
          actions: [
            { label: "Open Order Received Intake", path: "/admin/order-received" },
            { label: "Check Auto Reorder", path: "/admin/reorder" },
          ],
        };
      } else {
        return {
          text: `📦 **Orders Received & Inwarding Status**\n\n` +
            `There are currently **no shipments awaiting intake**. All placed orders have been received and converted into active batches in inventory.\n\n` +
            `Would you like to review suggested reorders for items below safety thresholds?`,
          type: "success",
          actions: [
            { label: "Go to Auto Reorder", path: "/admin/reorder" },
            { label: "View Order Received", path: "/admin/order-received" },
          ],
        };
      }
    }

    // 32. Reorder & Procurement queries
    if (
      nlp.intent === "REORDER_PROCUREMENT" ||
      q.includes("reorder") ||
      q.includes("purchase order") ||
      q.includes("procurement")
    ) {
      return {
        text: `🛒 **Procurement & Reorder Engine Overview**\n\n` +
          `• MediTrack monitors all batches against 30-day Croston-SBA forecasted demand.\n` +
          `• **Pending Auto-Reorder Items:** ${context.reorderItems?.length || 3} items flagged\n` +
          `• **Suggested ROQ Formulation:** $ROQ = \\max\\left(0, (S + D_{30} + SS) - I_{\\text{curr}}\\right)$\n` +
          `• Once supplier orders are received, use **Order Received & Inwarding** to auto-generate batch consignments with barcode & expiry dates.\n\n` +
          `Would you like to review suggested purchase orders?`,
        type: "info",
        actions: [
          { label: "Go to Auto Reorder", path: "/admin/reorder" },
          { label: "Order Received Intake", path: "/admin/order-received" },
        ],
      };
    }

    // 33. Audit log & Compliance queries
    if (q.includes("audit") || q.includes("compliance") || q.includes("regulation") || q.includes("activity log") || q.includes("who did")) {
      return {
        text: `📋 **Regulatory Audit & Compliance Shield**\n\n` +
          `MediTrack maintains an immutable ledger for pharmaceutical safety:\n\n` +
          `• **Segregation of Duties:** Administrators manage catalogs and batches; only licensed Pharmacists can execute clinical dispensing transactions.\n` +
          `• **Mandatory Stock Reconciliation Reasons:** Damaged, Expired, Physical Audit Discrepancy, Return to Supplier.\n` +
          `• **Digital Audit Trail:** Captures timestamp, user ID, IP address, item, previous quantity, new quantity, and justification.\n\n` +
          `Inspect the regulatory ledger or download audit reports below:`,
        type: "info",
        actions: [
          { label: "View Audit Logs", path: "/admin/audit-logs" },
          { label: "Export PDF/Excel Reports", path: "/admin/reports" },
        ],
      };
    }

    // 34. Universal Smart Semantic Fallback (Answers ANY question contextually)
    // Checks for keyword overlap with features, pharmacy concepts, or general queries
    const tokens = nlp.tokens || [];
    const isQuestion = q.includes("how") || q.includes("what") || q.includes("why") || q.includes("where") || q.includes("can") || q.includes("is") || q.includes("do");

    if (isQuestion || tokens.length > 0) {
      // Find closest medicine if any
      const candidateMed = context.medicines.find((m) => {
        const b = m.brandName.toLowerCase();
        const g = (m.genericMedicine || "").toLowerCase();
        return tokens.some((t) => t.length > 3 && (b.includes(t) || g.includes(t)));
      });

      if (candidateMed) {
        return {
          text: `💊 **Relevant Formulary Record: ${candidateMed.brandName} (${candidateMed.genericMedicine || candidateMed.genericName})**\n\n` +
            `• **Therapeutic Form:** ${candidateMed.dosageForm || "Tablet"} ${candidateMed.strength || ""}\n` +
            `• **Description / Indication:** ${candidateMed.description || "Active clinical formulation"}\n` +
            `• **Manufacturer:** ${candidateMed.manufacturer || "Registered Supplier"}\n` +
            `• **Minimum Reorder Threshold:** ${candidateMed.minimumStock || 40} units\n\n` +
            `Did you want to check its stock levels, dispense this medicine, or review its active batches?`,
          type: "info",
          actions: [
            { label: "Dispense " + candidateMed.brandName, path: "/pharmacist/dispense" },
            { label: "View Batches", path: "/admin/batches" },
          ],
        };
      }

      // Check for operational keywords
      if (q.includes("delete") || q.includes("remove") || q.includes("edit") || q.includes("modify")) {
        return {
          text: `✏️ **Modifying or Deleting Pharmacy Records**\n\n` +
            `• **Medicines:** Administrators can edit medicine details by clicking the pencil icon in **Medicine Catalog** (\`/admin/medicines\`). Deletion is restricted if historical batches or transactions exist.\n` +
            `• **Batches:** If a batch has zero remaining units or was created in error, Administrators can reconcile it in **Inventory** or edit consignment details in **Batches**.\n` +
            `• **Audit Guarantee:** Every modification is timestamped and recorded in **Audit Logs** for GxP traceability.`,
          type: "info",
          actions: [
            { label: "Medicines Catalog", path: "/admin/medicines" },
            { label: "Batch Management", path: "/admin/batches" },
          ],
        };
      }

      if (q.includes("print") || q.includes("receipt") || q.includes("invoice")) {
        return {
          text: `🖨️ **Printing Invoices & Patient Receipts**\n\n` +
            `• When completing a clinical dispense in **Dispense Medicine**, click **"Complete Dispense & Print Invoice"**.\n` +
            `• The invoice includes pharmacy name, patient details, medicine name, batch number, expiry date, quantity, total price, and dispensing pharmacist signature.\n` +
            `• You can also reprint historical transaction receipts from **Reports & Analytics**.`,
          type: "info",
          actions: [
            { label: "Open Dispense Cart", path: "/pharmacist/dispense" },
            { label: "View Reports", path: "/admin/reports" },
          ],
        };
      }

      if (q.includes("storage") || q.includes("temperature") || q.includes("cold chain") || q.includes("refrigerator")) {
        return {
          text: `❄️ **Pharmaceutical Storage & Cold Chain Guidelines**\n\n` +
            `• **Room Temperature Items (15°C - 25°C):** Tablets, capsules, syrups (e.g. Paracetamol, Ibuprofen, Amoxicillin).\n` +
            `• **Cold Chain / Refrigerated (2°C - 8°C):** Insulins (Lantus SoloStar), reconstituted biologicals, certain cephalosporin suspensions. Never freeze!\n` +
            `• **Dark / Moisture-Controlled Storage:** Protect light-sensitive formulations from direct sunlight.\n` +
            `• MediTrack monitors batch locations and flags items nearing expiry to preserve stability.`,
          type: "info",
          actions: [
            { label: "Check Inventory", path: "/admin/inventory" },
            { label: "Expiry Horizon", path: role === "admin" ? "/admin/expiry" : "/pharmacist/expiry-alerts" },
          ],
        };
      }

      // Default smart structured response for general questions
      return {
        text: `🤖 **MediTrack Clinical & Operational Intelligence**\n\n` +
          `I analyzed your question: *"**${query}**"*\n\n` +
          `Here is how to handle this in MediTrack Pro:\n` +
          `• **Live Data Access:** Search real-time stock, batch codes, or medicine monographs anytime.\n` +
          `• **Safety Workflows:** Enforce FEFO batch turnover, evaluate patient treatment duration feasibility ($DaysRemaining \\ge TreatmentDays$), and verify drug-drug interactions.\n` +
          `• **Inventory Actions:** Manage purchase orders, receive supplier shipments via **Order Received**, and reconcile damaged/expired stock.\n\n` +
          `Choose one of the quick options below or rephrase with specific medicine/batch names!`,
        type: "info",
        actions: [
          { label: "Dispense Console", path: "/pharmacist/dispense" },
          { label: "Batches & Expiry", path: "/admin/batches" },
          { label: "Order Received", path: "/admin/order-received" },
          { label: "System Help", path: "/admin/assistant" },
        ],
      };
    }

    // 35. General Help overview
    return {
      text: `👋 **MediTrack Chatbot Ready to Assist**\n\n` +
        `Ask any question regarding:\n` +
        `• 💊 **Medicines & Dosing:** *"Tell me about Dolo 650"*, *"Price of Amoxicillin"*\n` +
        `• 📦 **Stock & Batches:** *"What is our stock for Ibuprofen?"*, *"List all batches"*\n` +
        `• ⏳ **Expiry & Perishability:** *"Which batches expire in 30 days?"*, *"Quarantine protocol"*\n` +
        `• 🏷️ **FEFO & Interactions:** *"Which batch should I dispense?"*, *"Ibuprofen + Warfarin"*\n` +
        `• 📖 **How-To Guides:** *"How to dispense?"*, *"How to add a batch?"*, *"How to scan barcode?"*`,
      type: "info",
      actions: [
        { label: "Dispense Medicine", path: "/pharmacist/dispense" },
        { label: "Expiry Tracking", path: role === "admin" ? "/admin/expiry" : "/pharmacist/expiry-alerts" },
        { label: "Order Received", path: "/admin/order-received" },
      ],
    };
  },

  // Call Cloud LLM (Gemini or OpenAI) with live pharmacy context
  async callCloudLLM({ apiKey, provider, model, query, user, history }) {
    const context = await this.getLiveContext();

    const catalogSummary = context.medicines.map((m) => {
      const mBatches = this.getBatchesForMedicine(m, context.batches);
      const activeBatches = mBatches.filter(b => b.quantity > 0 && b.daysLeft > 0);
      const usableUnits = activeBatches.reduce((sum, b) => sum + b.quantity, 0);
      const batchList = mBatches.map(b => `${b.batchNumber}: ${b.quantity}u (exp ${b.expiryDate}, ${b.daysLeft}d left)`).join("; ");
      return `- ${m.brandName} (${m.genericMedicine || m.genericName || "Drug"}): Total Stock ${usableUnits} units (Min: ${m.minimumStock || 40}). Batches: [${batchList || "None"}]`;
    }).join("\n");

    const systemPrompt = `You are MediTrack Pro's Senior Clinical Pharmacy Assistant.
You assist ${user?.name || "the user"} (${user?.role === "admin" ? "Pharmacy Administrator" : "Licensed Pharmacist"}).
You are embedded directly within an enterprise pharmacy system.

LIVE PHARMACY INVENTORY & BATCH DATABASE:
${catalogSummary}

LIVE PHARMACY SNAPSHOT:
- Active Catalog Size: ${context.medicines.length} medicines
- Total Usable Inventory: ${context.batches.reduce((sum, b) => sum + b.quantity, 0)} units
- Low Stock Batches: ${context.lowStockBatches.length} items
- Critical Batches (<=30 days): ${context.batches.filter((b) => b.daysLeft > 0 && b.daysLeft <= 30).length}
- Expired Batches: ${context.expiredBatches.length}

CLINICAL & REGULATORY POLICIES:
1. When asked about medicines, stock, or batches, ALWAYS provide live batch numbers, quantities, expiry dates, and identify the FEFO (First-Expired, First-Out) batch to dispense.
2. If dispensing for a treatment duration, verify DaysRemaining >= TreatmentDays. If DaysRemaining < TreatmentDays, issue a patient safety hazard alert.
3. Check drug interactions carefully (e.g. Warfarin + NSAIDs, ACE inhibitors + Spironolactone, Metformin + Contrast).
4. Provide structured, concise, and clinically rigorous answers using markdown bullet points and bold highlights. Include a brief disclaimer for clinical guidance.`;

    if (provider === "gemini") {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-1.5-flash"}:generateContent?key=${apiKey}`;
      const contents = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am ready to serve as MediTrack Pro's Senior Clinical Pharmacy Assistant with live inventory awareness." }] },
        ...history.slice(-6).map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        })),
        { role: "user", parts: [{ text: query }] },
      ];

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API returned status ${res.status}`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response received from Gemini.";
      return { text, type: "info" };
    } else if (provider === "openai") {
      const endpoint = "https://api.openai.com/v1/chat/completions";
      const messages = [
        { role: "system", content: systemPrompt },
        ...history.slice(-6).map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: query },
      ];

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || "gpt-4o-mini",
          messages,
          temperature: 0.3,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API returned status ${res.status}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "No response received from OpenAI.";
      return { text, type: "info" };
    }

    throw new Error("Unsupported LLM provider: " + provider);
  },
};
