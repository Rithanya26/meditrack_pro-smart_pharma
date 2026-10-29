// MediTrack Pro NLP (Natural Language Processing) Engine
// Implements Tokenization, Stop-word filtering, Damerau-Levenshtein Fuzzy Matching,
// Named Entity Recognition (NER), Temporal Parsing, Intent Scoring & Slot Filling.

// Damerau-Levenshtein Distance for typo tolerance
export function levenshteinDistance(a, b) {
  if (!a || !b) return (a || b).length;
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && a[i - 1].toLowerCase() === b[j - 2].toLowerCase() && a[i - 2].toLowerCase() === b[j - 1].toLowerCase()) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

export function stringSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  if (s1 === s2) return 1.0;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

// Common conversational stopwords (keeping clinical directional prepositions)
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "can", "could", "should",
  "would", "may", "might", "must", "i", "you", "we", "they", "it",
  "me", "him", "her", "us", "them", "my", "your", "our", "their",
  "this", "that", "these", "those", "what", "which", "who", "whom",
  "please", "tell", "show", "give", "check", "verify", "about"
]);

// Clinical & Operational Intent Definitions with weighted semantic tokens
const INTENT_DEFINITIONS = {
  DRUG_INTERACTION: {
    name: "DRUG_INTERACTION",
    weight: 1.2,
    keywords: [
      "interaction", "interactions", "interact", "combine", "combining",
      "together", "contraindication", "contraindications", "hazard", "bleeding",
      "adverse", "synergy", "react", "reaction", "toxic", "toxicity"
    ],
    phrases: ["can i take", "take with", "mix with", "safe together", "contraindicated with", "drug interaction"],
  },
  PRESCRIPTION_CONFLICT: {
    name: "PRESCRIPTION_CONFLICT",
    weight: 1.15,
    keywords: [
      "course", "duration", "conflict", "treatment", "prescription",
      "finish", "regimen", "feasibility", "surpass", "expire before"
    ],
    phrases: ["dispense for", "treatment days", "prescription days", "days treatment", "expire during", "finish course"],
  },
  CHECK_FEFO: {
    name: "CHECK_FEFO",
    weight: 1.1,
    keywords: ["fefo", "earliest", "first", "allocation", "allocate", "priority", "turnover"],
    phrases: ["first expired", "first out", "first-expired", "which batch should i", "fefo batch", "recommended batch", "best batch to dispense"],
  },
  FEFO_EXPLANATION: {
    name: "FEFO_EXPLANATION",
    weight: 1.15,
    keywords: ["fefo", "fifo", "rationale", "principle", "meaning", "definition"],
    phrases: ["what is fefo", "explain fefo", "fefo vs fifo", "difference between fefo and fifo", "why fefo", "fefo meaning"],
  },
  EXPIRY_RADAR: {
    name: "EXPIRY_RADAR",
    weight: 1.05,
    keywords: [
      "expiry", "expiring", "expire", "expires", "expired", "perish",
      "perishability", "horizon", "shelf-life", "shelflife", "outdated"
    ],
    phrases: ["near expiry", "expiring soon", "critical batches", "expired stock", "expiry radar", "expiry horizon", "list expired medicines", "show expired medicines", "expired medicines", "list expired", "show expired"],
  },
  EXPIRED_ACTION: {
    name: "EXPIRED_ACTION",
    weight: 1.15,
    keywords: ["quarantine", "disposal", "discard", "writeoff", "condemned", "isolate", "destroy"],
    phrases: ["what to do with expired", "handle expired", "dispose expired", "expired medicines disposal", "quarantine protocol", "list expired medicines", "show expired medicines", "expired medicines"],
  },
  STOCK_INQUIRY: {
    name: "STOCK_INQUIRY",
    weight: 1.0,
    keywords: [
      "stock", "inventory", "quantity", "units", "count", "available",
      "shortage", "depleted", "low", "threshold", "usable"
    ],
    phrases: ["low stock", "out of stock", "how many", "stock level", "current stock", "available stock", "stock count", "how much stock"],
  },
  FULL_INVENTORY_ALL: {
    name: "FULL_INVENTORY_ALL",
    weight: 1.35,
    keywords: ["inventory", "stock", "formulary", "catalog", "breakdown"],
    phrases: [
      "inventory of each medicine",
      "stock of each medicine",
      "inventory of each",
      "stock of each",
      "full inventory",
      "all inventory",
      "inventory of all",
      "stock of all",
      "complete inventory",
      "entire inventory",
      "all medicine stock",
      "all medicines stock",
      "stock of every medicine",
      "every medicine stock",
      "each medicine stock",
      "total stock list",
      "inventory breakdown",
      "inventory of all medicines",
      "stock of all medicines"
    ],
  },
  MEDICINES_WITH_BATCHES: {
    name: "MEDICINES_WITH_BATCHES",
    weight: 1.4,
    keywords: ["medicines", "drugs", "batches", "consignments"],
    phrases: [
      "list all medicines with batches",
      "all medicines with batches",
      "medicines with batches",
      "medicines with their batches",
      "show medicines with batches",
      "show medicines and batches",
      "medicines and their batches",
      "all medicines and batches",
      "medicines and batches",
      "list medicines with batches",
      "show all medicines with batches"
    ],
  },
  MEDICINE_CATALOG_LIST: {
    name: "MEDICINE_CATALOG_LIST",
    weight: 1.2,
    keywords: ["medicines", "drugs", "catalog", "formulary", "items", "database"],
    phrases: ["list medicines", "all medicines", "show medicines", "list of medicines", "all drugs", "catalog list", "how many medicines", "what medicines"],
  },
  BATCH_CATALOG_LIST: {
    name: "BATCH_CATALOG_LIST",
    weight: 1.2,
    keywords: ["batches", "consignments", "lots"],
    phrases: ["list batches", "all batches", "show batches", "list of batches", "active batches", "batch list", "show all batches"],
  },
  SUPPLIER_INQUIRY: {
    name: "SUPPLIER_INQUIRY",
    weight: 1.15,
    keywords: ["supplier", "suppliers", "manufacturer", "manufacturers", "vendor", "vendors", "distributor", "distributors"],
    phrases: ["who are our suppliers", "show suppliers", "list suppliers", "list manufacturers", "who supplies", "supplier list"],
  },
  CATEGORY_INQUIRY: {
    name: "CATEGORY_INQUIRY",
    weight: 1.1,
    keywords: ["category", "categories", "class", "classes", "therapeutic", "classification"],
    phrases: ["show categories", "list categories", "what categories", "medicine categories", "therapeutic classes"],
  },
  PRICE_INQUIRY: {
    name: "PRICE_INQUIRY",
    weight: 1.15,
    keywords: ["price", "cost", "mrp", "rate", "worth", "pricing", "expensive", "cheap"],
    phrases: ["how much is", "price of", "what is the price", "medicine price", "cost of", "unit price"],
  },
  BARCODE_SCAN: {
    name: "BARCODE_SCAN",
    weight: 1.2,
    keywords: ["barcode", "barcodes", "scanner", "scanning", "qr", "camera", "upc", "laser"],
    phrases: ["how to scan", "barcode scanner", "scan barcode", "use barcode", "camera scanner"],
  },
  HOW_TO_DISPENSE: {
    name: "HOW_TO_DISPENSE",
    weight: 1.2,
    keywords: ["dispense", "dispensing", "prescribe", "pos", "checkout", "billing", "cart"],
    phrases: ["how to dispense", "dispense medicine", "dispensing process", "dispense steps", "dispensing workflow", "how do i dispense"],
  },
  HOW_TO_ADD_MEDICINE: {
    name: "HOW_TO_ADD_MEDICINE",
    weight: 1.25,
    keywords: ["add", "create", "register", "new"],
    phrases: ["add medicine", "how to add medicine", "add a medicine", "create medicine", "register new medicine", "new drug entry"],
  },
  HOW_TO_ADD_BATCH: {
    name: "HOW_TO_ADD_BATCH",
    weight: 1.25,
    keywords: ["consignment", "inward"],
    phrases: ["add batch", "how to add batch", "create batch", "new batch", "add new batch", "register batch"],
  },
  STOCK_RECONCILIATION: {
    name: "STOCK_RECONCILIATION",
    weight: 1.2,
    keywords: ["reconciliation", "reconcile", "damaged", "damage", "discrepancy", "breakage", "adjustment", "adjust"],
    phrases: ["stock reconciliation", "reconcile stock", "damaged stock", "report damaged", "record damaged", "stock adjustment", "adjust inventory"],
  },
  REPORTS_EXPORT: {
    name: "REPORTS_EXPORT",
    weight: 1.15,
    keywords: ["report", "reports", "export", "pdf", "excel", "csv", "download", "analytics"],
    phrases: ["how to export", "export report", "download report", "pdf report", "excel report", "generate report", "view reports"],
  },
  SYSTEM_ROLES: {
    name: "SYSTEM_ROLES",
    weight: 1.2,
    keywords: ["role", "roles", "admin", "pharmacist", "permissions", "privileges", "access"],
    phrases: ["admin vs pharmacist", "difference between admin", "role difference", "roles and permissions", "what can admin do", "what can pharmacist do"],
  },
  SALES_REVENUE: {
    name: "SALES_REVENUE",
    weight: 1.15,
    keywords: ["sales", "revenue", "income", "sold", "earnings", "transactions", "turnover"],
    phrases: ["how much sold", "total sales", "today sales", "sales revenue", "dispensing transactions", "revenue report"],
  },
  CROSTON_FORECAST: {
    name: "CROSTON_FORECAST",
    weight: 1.1,
    keywords: [
      "croston", "forecast", "forecasting", "sba", "syntetos", "boylan",
      "intermittent", "wape", "smoothing", "lumpy", "mathematical"
    ],
    phrases: ["demand forecast", "croston's method", "croston sba", "demand model", "how does forecasting work", "explain demand forecasting formula", "demand forecasting formula", "explain croston-sba forecasting", "forecasting formula", "forecast formula"],
  },
  SAFETY_STOCK_LEAD_TIME: {
    name: "SAFETY_STOCK_LEAD_TIME",
    weight: 1.15,
    keywords: ["safety", "buffer", "lead", "roq", "reorder", "formula", "leadtime"],
    phrases: ["safety stock", "lead time", "buffer stock", "roq formula", "reorder quantity formula", "minimum stock formula"],
  },
  ORDER_AWAITING: {
    name: "ORDER_AWAITING",
    weight: 1.25,
    keywords: [
      "awaiting", "inwarding", "shipment", "shipments", "supplier",
      "delivery", "deliveries", "arriving", "ordered", "intake", "consignments"
    ],
    phrases: [
      "order received", "orders received", "awaiting medicine", "awaiting orders",
      "awaiting delivery", "pending shipment", "pending orders", "orders awaiting",
      "expected delivery", "incoming medicine", "awaiting intake", "order awaiting", "goods received"
    ],
  },
  REORDER_PROCUREMENT: {
    name: "REORDER_PROCUREMENT",
    weight: 1.0,
    keywords: ["reorder", "procure", "procurement", "purchase", "replenish"],
    phrases: ["auto reorder", "purchase order", "reorder suggestions", "generate po", "how auto reorder works", "auto reorder status", "auto reorder status & suggestions", "reorder status"],
  },
  CLINICAL_MONOGRAPH: {
    name: "CLINICAL_MONOGRAPH",
    weight: 1.0,
    keywords: ["dosage", "dose", "mechanism", "indication", "indications", "pediatric", "antidote", "cautions", "side-effects", "uses", "used for"],
    phrases: ["adult dose", "pediatric dose", "mechanism of action", "side effects", "tell me about", "what is it used for", "what is used for"],
  },
  AUDIT_COMPLIANCE: {
    name: "AUDIT_COMPLIANCE",
    weight: 1.0,
    keywords: ["audit", "compliance", "regulatory", "ledger", "gxp", "traceability", "inspector", "history", "logs"],
    phrases: ["audit log", "audit logs", "segregation of duties", "compliance report", "activity log", "who did what"],
  },
  ABOUT_MEDITRACK: {
    name: "ABOUT_MEDITRACK",
    weight: 1.1,
    keywords: ["meditrack", "software", "system", "features", "overview", "modules", "app"],
    phrases: ["what is meditrack", "about meditrack", "system overview", "what can this app do", "meditrack features"],
  },
  GREETING: {
    name: "GREETING",
    weight: 1.1,
    keywords: ["hi", "hello", "hey", "hola", "greetings"],
    phrases: ["good morning", "good afternoon", "good evening", "hello chatbot", "hi chatbot"],
  },
  THANKS: {
    name: "THANKS",
    weight: 1.05,
    keywords: ["thanks", "thank", "appreciated", "grateful", "awesome", "perfect"],
    phrases: ["thank you", "thanks a lot", "great thanks", "thank you very much"],
  },
  HELP: {
    name: "HELP",
    weight: 1.1,
    keywords: ["help", "commands", "options", "guide", "faq", "questions"],
    phrases: ["what can you do", "help me", "show help", "list commands", "how can you help", "what questions can i ask"],
  },
};

export const nlpProcessor = {
  // 1. Text Normalization & Tokenization
  tokenize(rawText) {
    if (!rawText) return [];
    // Expand contractions
    const expanded = rawText
      .replace(/can't/gi, "cannot")
      .replace(/won't/gi, "will not")
      .replace(/n't/gi, " not")
      .replace(/'s/gi, " is")
      .replace(/'ll/gi, " will")
      .replace(/'ve/gi, " have");

    // Remove special punctuation, keep hyphens & alphanumeric
    const clean = expanded.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");
    return clean.split(/\s+/).filter(Boolean);
  },

  // 2. Temporal Entity Extraction (e.g. "45 days", "3 weeks", "2 months")
  extractTemporalDuration(rawText) {
    const text = rawText.toLowerCase();

    // Check days: "45 days", "for 30 day"
    const daysMatch = text.match(/(\d+)\s*(?:days?|d)\b/);
    if (daysMatch) return parseInt(daysMatch[1], 10);

    // Check weeks: "2 weeks" => 14 days
    const weeksMatch = text.match(/(\d+)\s*(?:weeks?|wk|wks)\b/);
    if (weeksMatch) return parseInt(weeksMatch[1], 10) * 7;

    // Check months: "1 month" => 30 days, "3 months" => 90 days
    const monthsMatch = text.match(/(\d+)\s*(?:months?|mth|mths)\b/);
    if (monthsMatch) return parseInt(monthsMatch[1], 10) * 30;

    // Check spoken numbers
    if (text.includes("a month") || text.includes("one month")) return 30;
    if (text.includes("two weeks") || text.includes("a fortnight")) return 14;
    if (text.includes("a week") || text.includes("one week")) return 7;

    return null;
  },

  // 3. Named Entity Recognition for Medicines (with Fuzzy Typo Matching)
  extractMedicineEntities(rawText, medicines = []) {
    const text = rawText.toLowerCase();
    const tokens = this.tokenize(rawText);
    const matched = [];
    const seenIds = new Set();

    // Build n-grams (1-word, 2-word, 3-word combinations) from query tokens
    const ngrams = [];
    for (let i = 0; i < tokens.length; i++) {
      ngrams.push(tokens[i]);
      if (i < tokens.length - 1) ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);
      if (i < tokens.length - 2) ngrams.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
    }

    // Compare each candidate ngram against medicine catalog
    for (const med of medicines) {
      if (seenIds.has(med.id)) continue;

      const brand = (med.brandName || med.name || "").toLowerCase();
      const generic = (med.genericMedicine || med.genericName || "").toLowerCase();
      const brandBase = brand.replace(/\s*\d+.*$/, ""); // "Dolo 650" -> "Dolo"
      const brandFirstWord = brand.split(/\s+/)[0]; // "Ventolin Inhaler" -> "ventolin"

      let bestScore = 0;
      let matchedTerm = "";

      // Direct substring or spaceless match (e.g. "dolo650" matching "Dolo 650")
      const textSpaceless = text.replace(/[\s-_]+/g, "");
      const brandSpaceless = brand.replace(/[\s-_]+/g, "");
      const genericSpaceless = generic.replace(/[\s-_]+/g, "");

      if (brand && (text.includes(brand) || (brandSpaceless && textSpaceless.includes(brandSpaceless)))) {
        bestScore = 1.0;
        matchedTerm = med.brandName;
      } else if (brandFirstWord && brandFirstWord.length >= 3 && (text.includes(brandFirstWord) || ngrams.includes(brandFirstWord))) {
        bestScore = 0.95;
        matchedTerm = med.brandName;
      } else if (brandBase && brandBase.length >= 3 && (text.includes(brandBase) || ngrams.includes(brandBase))) {
        bestScore = 0.95;
        matchedTerm = med.brandName;
      } else if (generic && (text.includes(generic) || (genericSpaceless && textSpaceless.includes(genericSpaceless)))) {
        bestScore = 1.0;
        matchedTerm = med.genericMedicine;
      } else {
        for (const ng of ngrams) {
          if (brand && ng === brand) {
            bestScore = 1.0;
            matchedTerm = med.brandName;
            break;
          }
          if (generic && ng === generic) {
            bestScore = 1.0;
            matchedTerm = med.genericMedicine;
            break;
          }

          // Fuzzy match against brand
          const sBrand = stringSimilarity(ng, brand);
          const sBase = stringSimilarity(ng, brandBase);
          const sGeneric = stringSimilarity(ng, generic);

          const localMax = Math.max(sBrand, sBase, sGeneric);
          if (localMax > bestScore) {
            bestScore = localMax;
            matchedTerm = sGeneric > sBrand ? med.genericMedicine : med.brandName;
          }
        }
      }

      // Threshold: 0.74 similarity qualifies as an entity match
      if (bestScore >= 0.74) {
        matched.push({
          medicine: med,
          brandName: med.brandName,
          genericName: med.genericMedicine || med.genericName,
          similarity: Math.round(bestScore * 100) / 100,
          matchedTerm,
        });
        seenIds.add(med.id);
      }
    }

    // Sort by descending similarity
    matched.sort((a, b) => b.similarity - a.similarity);
    return matched;
  },

  // 3b. Named Entity Recognition for Batches (Safely casts ID to String)
  extractBatchEntities(rawText, batches = []) {
    if (!rawText || !Array.isArray(batches)) return [];
    const text = String(rawText).toUpperCase();
    const matched = [];
    for (const b of batches) {
      const bNum = String(b.batchNumber || "").toUpperCase();
      const bId = String(b.id || "").toUpperCase();
      if (bNum && bNum.length >= 3 && text.includes(bNum)) {
        matched.push(b);
      } else if (bId.startsWith("BAT") && text.includes(bId)) {
        matched.push(b);
      }
    }
    return matched;
  },

  // 4. Multi-Intent Scoring & Classification
  classifyIntent(rawText, extractedEntities) {
    const text = rawText.toLowerCase();
    const tokens = this.tokenize(rawText);
    const nonStopTokens = tokens.filter((t) => !STOP_WORDS.has(t));

    const scores = {};

    for (const [intentKey, def] of Object.entries(INTENT_DEFINITIONS)) {
      let score = 0;

      // Phrase matches (High confidence bonus)
      for (const phrase of def.phrases) {
        if (text.includes(phrase)) {
          score += 0.55;
        }
      }

      // Keyword token matches
      for (const token of nonStopTokens) {
        for (const kw of def.keywords) {
          if (token === kw) {
            score += 0.35;
          } else if (token.length > 4 && kw.length > 4 && stringSimilarity(token, kw) >= 0.82) {
            score += 0.25; // Fuzzy keyword match
          }
        }
      }

      // Entity-contextual boosts
      if (intentKey === "PRESCRIPTION_CONFLICT" && extractedEntities.durationDays) {
        score += 0.45;
      }

      const hasInteractionKw = text.includes("interaction") || text.includes("interact") ||
        text.includes("combine") || text.includes("together") || text.includes("contraindicat") ||
        text.includes("safe with") || text.includes("take with") || text.includes("mix");
      const hasBatchOrStockKw = text.includes("batch") || text.includes("stock") || text.includes("inventory") || text.includes("consign");

      if (intentKey === "DRUG_INTERACTION" && extractedEntities.medicines.length >= 2 && hasInteractionKw && !hasBatchOrStockKw) {
        score += 0.65;
      }
      if (intentKey === "CLINICAL_MONOGRAPH" && extractedEntities.medicines.length >= 1 && (text.includes("what is") || text.includes("dose") || text.includes("dosage") || text.includes("mechanism") || text.includes("side effect") || text.includes("antidote") || text.includes("cautions") || text.includes("pharmacology"))) {
        score += 0.6;
      }
      if (intentKey === "PRICE_INQUIRY" && (text.includes("price") || text.includes("cost") || text.includes("how much") || text.includes("mrp"))) {
        score += 0.5;
      }
      if (intentKey === "BATCH_CATALOG_LIST" && (text.includes("batch") || text.includes("consign") || text.includes("lot") || extractedEntities.batches?.length > 0)) {
        score += 0.7;
      }
      if (intentKey === "STOCK_INQUIRY" && extractedEntities.medicines.length >= 1 && (text.includes("inventory") || text.includes("stock") || text.includes("units") || text.includes("count") || text.includes("how many") || text.includes("available"))) {
        score += 0.6;
      }
      if (intentKey === "FULL_INVENTORY_ALL" && (text.includes("inventory of each") || text.includes("stock of each") || text.includes("full inventory") || text.includes("all inventory") || text.includes("complete inventory") || text.includes("stock of all") || text.includes("inventory of all") || text.includes("all medicine stock"))) {
        score += 0.85;
      }
      if (intentKey === "MEDICINES_WITH_BATCHES" && (text.includes("medicines with batches") || text.includes("all medicines with batches") || text.includes("medicines and batches") || (text.includes("medicines") && text.includes("batches")))) {
        score += 0.85;
      }
      if (intentKey === "STOCK_INQUIRY" && extractedEntities.medicines.length === 1 && score < 0.2 && !hasInteractionKw) {
        score += 0.35; // Asking about a specific medicine naturally implies stock inquiry
      }
      if (intentKey === "BATCH_CATALOG_LIST" && extractedEntities.batches?.length > 0) {
        score += 0.6;
      }

      // Apply intent category weight
      score *= def.weight;
      scores[intentKey] = Math.min(1.0, Math.round(score * 100) / 100);
    }

    // Find primary intent
    let primaryIntent = "GENERAL_QUERY";
    let highestScore = 0;

    for (const [intentKey, sc] of Object.entries(scores)) {
      if (sc > highestScore && sc >= 0.25) {
        highestScore = sc;
        primaryIntent = intentKey;
      }
    }

    return {
      primaryIntent,
      confidence: highestScore > 0 ? highestScore : 0.5,
      allScores: scores,
    };
  },

  // 5. Complete NLP Parsing Pipeline
  parse(rawQuery, medicines = [], batches = []) {
    const durationDays = this.extractTemporalDuration(rawQuery);
    const medicineEntities = this.extractMedicineEntities(rawQuery, medicines);
    const batchEntities = this.extractBatchEntities(rawQuery, batches);
    const tokens = this.tokenize(rawQuery);

    const entities = {
      medicines: medicineEntities,
      batches: batchEntities,
      durationDays,
      tokenCount: tokens.length,
    };

    const intentResult = this.classifyIntent(rawQuery, entities);

    return {
      rawQuery,
      tokens,
      intent: intentResult.primaryIntent,
      confidence: intentResult.confidence,
      entities,
      scores: intentResult.allScores,
    };
  },
};
