package com.pharmacy.meditrack.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.pharmacy.meditrack.entity.Batch;
import com.pharmacy.meditrack.entity.Medicine;
import com.pharmacy.meditrack.entity.ReorderOrder;
import com.pharmacy.meditrack.repository.BatchRepository;
import com.pharmacy.meditrack.repository.MedicineRepository;
import com.pharmacy.meditrack.repository.ReorderOrderRepository;

@Service
public class ChatbotService {

    private final MedicineRepository medicineRepository;
    private final BatchRepository batchRepository;
    private final ReorderOrderRepository reorderOrderRepository;

    public ChatbotService(MedicineRepository medicineRepository, BatchRepository batchRepository,
            ReorderOrderRepository reorderOrderRepository) {
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
        this.reorderOrderRepository = reorderOrderRepository;
    }

    public Map<String, Object> processQuery(String query, String userRole, String userName) {
        String q = query != null ? query.toLowerCase().trim() : "";
        Map<String, Object> response = new HashMap<>();
        List<Map<String, String>> actions = new ArrayList<>();

        // 1. Drug Interaction Check
        if (q.contains("interaction") || q.contains("interact") || q.contains("contraindication")) {
            if (q.contains("ibuprofen") && q.contains("warfarin")) {
                response.put("text", "⚠️ **CRITICAL INTERACTION DETECTED: Ibuprofen + Warfarin**\n\n" +
                        "• Severity: HIGH RISK OF GASTROINTESTINAL HEMORRHAGE\n" +
                        "• Mechanism: NSAIDs inhibit COX-1 platelet aggregation and damage gastric mucosa, synergizing with anticoagulation.\n"
                        +
                        "• Action: Withhold NSAID. Consult prescriber for alternative analgesia (e.g. Paracetamol).");
                response.put("type", "warning");
                actions.add(Map.of("label", "Go to Dispensing", "path", "/pharmacist/dispense"));
                response.put("actions", actions);
                return response;
            }
            if (q.contains("lisinopril") && (q.contains("spironolactone") || q.contains("potassium"))) {
                response.put("text", "⚠️ **CRITICAL INTERACTION: Lisinopril + Spironolactone**\n\n" +
                        "• Severity: LIFE-THREATENING HYPERKALEMIA\n" +
                        "• Mechanism: Both agents impede renal potassium excretion.\n" +
                        "• Action: Check serum K+ levels prior to dispensing.");
                response.put("type", "warning");
                actions.add(Map.of("label", "Review Patient RX", "path", "/pharmacist/dispense"));
                response.put("actions", actions);
                return response;
            }
        }

        // 2. Prescription Treatment Expiry Feasibility
        if (q.contains("dispense for") || q.contains("treatment days") || q.contains("prescription")) {
            int treatmentDays = 30;
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)\\s*days?").matcher(q);
            if (m.find()) {
                treatmentDays = Integer.parseInt(m.group(1));
            }

            List<Medicine> allMeds = medicineRepository.findAll();
            Optional<Medicine> targetMed = allMeds.stream()
                    .filter(med -> q.contains(med.getBrandName().toLowerCase()) ||
                            (med.getGenericMedicine() != null && q.contains(med.getGenericMedicine().toLowerCase())))
                    .findFirst();

            if (targetMed.isPresent()) {
                Medicine med = targetMed.get();
                List<Batch> batches = batchRepository.findByMedicineOrderByExpiryDateAsc(med);
                LocalDate today = LocalDate.now();

                Optional<Batch> fefoCandidate = batches.stream()
                        .filter(b -> b.getQuantity() > 0 && b.getExpiryDate().isAfter(today))
                        .findFirst();

                if (fefoCandidate.isPresent()) {
                    Batch b = fefoCandidate.get();
                    long daysLeft = ChronoUnit.DAYS.between(today, b.getExpiryDate());

                    if (daysLeft < treatmentDays) {
                        response.put("text",
                                "🚨 **Patient Expiry Conflict Detected! (DaysRemaining < TreatmentDays)**\n\n" +
                                        "• Medicine: " + med.getBrandName() + "\n" +
                                        "• Treatment Duration: " + treatmentDays + " Days\n" +
                                        "• Primary FEFO Batch: `" + b.getBatchNumber() + "` (Expires in " + daysLeft
                                        + " days on " + b.getExpiryDate() + ")\n" +
                                        "• Risk: This batch will expire during the patient's active treatment course!");
                        response.put("type", "danger");
                        actions.add(Map.of("label", "Dispense Alternative", "path", "/pharmacist/dispense"));
                        response.put("actions", actions);
                        return response;
                    } else {
                        response.put("text", "✅ **FEFO Batch Verification Passed!**\n\n" +
                                "• Medicine: " + med.getBrandName() + "\n" +
                                "• Treatment Duration: " + treatmentDays + " Days\n" +
                                "• Allocated Batch: `" + b.getBatchNumber() + "` (Expires: " + b.getExpiryDate() + ", "
                                + daysLeft + " days left)\n" +
                                "• Available Quantity: " + b.getQuantity() + " units\n" +
                                "Safe to dispense under MediTrack FEFO policy.");
                        response.put("type", "success");
                        actions.add(Map.of("label", "Proceed to Dispense", "path", "/pharmacist/dispense"));
                        response.put("actions", actions);
                        return response;
                    }
                }
            }
        }

        // 3. FEFO & Allocation
        if (q.contains("what is fefo") || q.contains("explain fefo") || q.contains("fefo vs fifo")
                || q.contains("why fefo")) {
            response.put("text", "🏷️ **FEFO (First-Expired, First-Out) Explained**\n\n" +
                    "• **Principle:** Medicines are dispensed strictly according to earliest expiration date, preventing shelf perishability and guaranteeing patient safety.\n"
                    +
                    "• **FEFO vs. FIFO:** FIFO dispenses by arrival date, which is hazardous in pharmacy because newer consignments can have shorter remaining shelf-lives.\n"
                    +
                    "• **Prescription Protection:** MediTrack automatically ensures DaysRemaining >= TreatmentDays before allocating any batch.");
            response.put("type", "info");
            actions.add(Map.of("label", "Dispense Console", "path", "/pharmacist/dispense"));
            actions.add(Map.of("label", "Expiry Radar", "path", "/admin/expiry"));
            response.put("actions", actions);
            return response;
        }

        // 4. How-To: Dispensing Guide
        if (q.contains("how to dispense") || q.contains("dispensing process") || q.contains("dispense steps")
                || q.contains("how do i dispense")) {
            response.put("text", "💊 **How to Dispense Medication (4 Steps)**\n\n" +
                    "1. Open **Dispense Medicine** (`/pharmacist/dispense`).\n" +
                    "2. Search medicine name or scan 1D/2D barcode.\n" +
                    "3. System automatically selects the earliest safe FEFO batch and tests for drug interactions.\n" +
                    "4. Enter quantity & course duration, verify safety margin, and click **'Complete Dispense & Print Invoice'**.");
            response.put("type", "info");
            actions.add(Map.of("label", "Open Dispense Cart", "path", "/pharmacist/dispense"));
            response.put("actions", actions);
            return response;
        }

        // 5. How-To: Add Medicine
        if (q.contains("add medicine") || q.contains("create medicine") || q.contains("register medicine")
                || q.contains("new drug")) {
            response.put("text", "➕ **How to Add a Medicine to Formulary**\n\n" +
                    "1. Sign in as Administrator (`admin@meditrack.com`).\n" +
                    "2. Go to **Medicine Catalog** (`/admin/medicines`).\n" +
                    "3. Click **'+ Add Medicine'**.\n" +
                    "4. Fill Brand Name, Generic Composition, Strength, Dosage Form, Manufacturer, and Minimum Safety Stock.\n"
                    +
                    "5. Click **'Save Medicine'**.");
            response.put("type", "info");
            actions.add(Map.of("label", "Medicine Catalog", "path", "/admin/medicines"));
            response.put("actions", actions);
            return response;
        }

        // 6. How-To: Add Batch
        if (q.contains("add batch") || q.contains("create batch") || q.contains("new batch")
                || q.contains("inward batch")) {
            response.put("text", "🏷️ **How to Add Batch Consignments**\n\n" +
                    "• **Manual Intake:** Go to **Batch Management** (`/admin/batches`) -> Click '+ Add Batch' -> Enter Batch Number, Expiry Date, Quantity, and Supplier.\n"
                    +
                    "• **Automated Intake:** Go to **Order Received** (`/admin/order-received`) -> Click 'Goods Received' on approved purchase orders to auto-create batches with barcode!");
            response.put("type", "info");
            actions.add(Map.of("label", "Batch Management", "path", "/admin/batches"));
            actions.add(Map.of("label", "Order Received", "path", "/admin/order-received"));
            response.put("actions", actions);
            return response;
        }

        // 7. Roles & Permissions: Admin vs Pharmacist
        if (q.contains("admin vs pharmacist") || q.contains("difference between admin") || q.contains("roles")
                || q.contains("permissions")) {
            response.put("text", "🛡️ **System Roles & Segregation of Duties**\n\n" +
                    "• **Administrator (`admin`):** Manages catalog formulary, batch entries, suppliers, auto-reorder approvals, stock adjustments, and immutable audit logs.\n"
                    +
                    "• **Pharmacist (`pharmacist`):** Operates clinical dispensing POS, verifies FEFO assignments, checks drug interactions, and prints patient receipts.\n\n"
                    +
                    "Demo accounts: `admin@meditrack.com` (admin123) and `pharmacist@meditrack.com` (pharma123).");
            response.put("type", "info");
            actions.add(Map.of("label", "Audit Logs", "path", "/admin/audit-logs"));
            actions.add(Map.of("label", "Dispense Console", "path", "/pharmacist/dispense"));
            response.put("actions", actions);
            return response;
        }

        // 8. Barcode Scanner Guide
        if (q.contains("barcode") || q.contains("scanner") || q.contains("how to scan")) {
            response.put("text", "📷 **Barcode Scanning System**\n\n" +
                    "• **Camera Scanner:** Tap the camera icon in Dispense or Inventory to read 1D Code128 or 2D DataMatrix.\n"
                    +
                    "• **Hardware Laser / USB Scanner:** Plug in any standard USB handheld scanner; focus on search and pull trigger for instant batch identification.");
            response.put("type", "info");
            actions.add(Map.of("label", "Test in Dispense", "path", "/pharmacist/dispense"));
            response.put("actions", actions);
            return response;
        }

        // 9. Stock Reconciliation / Damaged
        if (q.contains("damaged") || q.contains("reconcil") || q.contains("discrepancy")
                || q.contains("adjust stock")) {
            response.put("text", "⚖️ **Stock Reconciliation & Adjustment Protocol**\n\n" +
                    "1. Open **Inventory Management** (`/admin/inventory`).\n" +
                    "2. Select target batch and click **'Stock Adjustment'**.\n" +
                    "3. Select mandatory category: `DAMAGED`, `EXPIRED`, `AUDIT DISCREPANCY`, or `RETURN TO SUPPLIER`.\n"
                    +
                    "4. Input adjusted quantity and required justification note.\n" +
                    "5. An immutable entry is instantly written to the **Audit Ledger**.");
            response.put("type", "info");
            actions.add(Map.of("label", "Open Inventory", "path", "/admin/inventory"));
            actions.add(Map.of("label", "Audit Logs", "path", "/admin/audit-logs"));
            response.put("actions", actions);
            return response;
        }

        // 10. Reports & Exporting
        if (q.contains("report") || q.contains("export") || q.contains("pdf") || q.contains("excel")) {
            response.put("text", "📄 **Exporting Reports & Analytics**\n\n" +
                    "Navigate to **Reports & Analytics** (`/admin/reports`) to export:\n" +
                    "• **Sales & Revenue Report**\n" +
                    "• **Expiry Audit & Quarantine Ledger**\n" +
                    "• **Fast vs. Slow Moving Inventory (ABC)**\n" +
                    "• **Supplier Fulfillment Performance**\n" +
                    "Export format: Printable PDF or Excel spreadsheet.");
            response.put("type", "info");
            actions.add(Map.of("label", "Open Reports", "path", "/admin/reports"));
            response.put("actions", actions);
            return response;
        }

        // 11. Demand Forecasting & Croston-SBA
        if (q.contains("croston") || q.contains("forecast") || q.contains("sba") || q.contains("safety stock")
                || q.contains("roq")) {
            response.put("text", "📊 **Croston-SBA Forecasting & Safety Stock**\n\n" +
                    "• **Intermittent Demand Model:** Breaks transaction history into non-zero demand size and inter-arrival intervals with Syntetos-Boylan bias correction (1 - β/2).\n"
                    +
                    "• **Safety Stock ($SS$):** $SS = 1.65 \\times \\sigma_{\\text{daily}} \\times \\sqrt{7\\text{d}}$ for a 95% service level.\n"
                    +
                    "• **Recommended Order Quantity (ROQ):** $ROQ = \\max(0, S + D_{30} + SS - I_{\\text{curr}})$.");
            response.put("type", "info");
            actions.add(Map.of("label", "Auto Reorder", "path", "/admin/reorder"));
            actions.add(Map.of("label", "Smart Insights", "path", "/admin/insights"));
            response.put("actions", actions);
            return response;
        }

        // A. Multi-Medicine Batch Inquiry (e.g. "batches of dolo650 and calpol 650")
        List<Medicine> allMeds = medicineRepository.findAll();
        List<Medicine> detectedMeds = allMeds.stream()
                .filter(m -> {
                    String b = m.getBrandName().toLowerCase();
                    String bClean = b.replaceAll("[\\s-_]+", "");
                    String qClean = q.replaceAll("[\\s-_]+", "");
                    return q.contains(b) || (bClean.length() >= 3 && qClean.contains(bClean));
                })
                .toList();

        if (detectedMeds.size() >= 2 && (q.contains("batch") || q.contains("stock") || q.contains("inventory")
                || q.contains("and") || q.contains(","))) {
            StringBuilder sb = new StringBuilder("🏷️ **Batch Consignments Comparison: ");
            for (int i = 0; i < detectedMeds.size(); i++) {
                if (i > 0)
                    sb.append(" & ");
                sb.append(detectedMeds.get(i).getBrandName());
            }
            sb.append("**\n\n");

            LocalDate today = LocalDate.now();
            for (int i = 0; i < detectedMeds.size(); i++) {
                Medicine med = detectedMeds.get(i);
                List<Batch> batches = batchRepository.findByMedicineOrderByExpiryDateAsc(med);
                int totalUnits = batches.stream().filter(b -> b.getQuantity() > 0 && b.getExpiryDate().isAfter(today))
                        .mapToInt(Batch::getQuantity).sum();
                int minStock = med.getMinimumStock();
                String badge = totalUnits == 0 ? "🔴 OUT OF STOCK"
                        : totalUnits <= minStock ? "🟠 LOW STOCK" : "🟢 HEALTHY";

                sb.append("📦 **").append(i + 1).append(". ").append(med.getBrandName()).append("** (")
                        .append(med.getGenericMedicine() != null ? med.getGenericMedicine() : "").append(") — `")
                        .append(med.getDosageForm() != null ? med.getDosageForm() : "Tablet").append(" ")
                        .append(med.getStrength() != null ? med.getStrength() : "").append("`\n")
                        .append("• **Total Usable Stock:** **").append(totalUnits).append(" units** | Min Safety: ")
                        .append(minStock).append(" units [").append(badge).append("]\n")
                        .append("**Active Batches:**\n");

                List<Batch> activeBatches = batches.stream()
                        .filter(b -> b.getQuantity() > 0 && b.getExpiryDate().isAfter(today)).toList();
                if (!activeBatches.isEmpty()) {
                    for (int j = 0; j < activeBatches.size(); j++) {
                        Batch b = activeBatches.get(j);
                        long daysLeft = ChronoUnit.DAYS.between(today, b.getExpiryDate());
                        String fefoTag = j == 0 ? " [🟢 FEFO NEXT]" : "";
                        sb.append("  • Batch `").append(b.getBatchNumber()).append("`: **").append(b.getQuantity())
                                .append(" units** | Exp: ").append(b.getExpiryDate())
                                .append(" (").append(daysLeft).append("d left)").append(fefoTag).append("\n");
                    }
                } else {
                    sb.append("  • ⚠️ *No usable batches in stock (Depleted)*\n");
                }
                sb.append("\n");
            }
            sb.append(
                    "💡 **FEFO Dispensing Guidance:** Exhaust earliest-expiring batches first to eliminate shelf perishability.");
            response.put("text", sb.toString());
            response.put("type", "info");
            actions.add(Map.of("label", "Dispense Console", "path", "/pharmacist/dispense"));
            actions.add(Map.of("label", "Batch Management", "path", "/admin/batches"));
            response.put("actions", actions);
            return response;
        }

        // B. All Medicines with Batches (e.g. "list all medicines with batches")
        if (q.contains("medicines with batches") || (q.contains("all medicines") && q.contains("batch"))
                || (q.contains("medicines") && q.contains("batches"))) {
            StringBuilder sb = new StringBuilder(
                    "📋 **MediTrack Formulary: Active Medicines with Batch Consignments**\n\n");
            LocalDate today = LocalDate.now();
            for (Medicine med : allMeds) {
                List<Batch> batches = batchRepository.findByMedicineOrderByExpiryDateAsc(med);
                int totalUnits = batches.stream().filter(b -> b.getQuantity() > 0 && b.getExpiryDate().isAfter(today))
                        .mapToInt(Batch::getQuantity).sum();
                sb.append("• **").append(med.getBrandName()).append("** (")
                        .append(med.getGenericMedicine() != null ? med.getGenericMedicine() : "").append(") — **")
                        .append(totalUnits).append(" units** in stock\n");
                List<Batch> activeBatches = batches.stream()
                        .filter(b -> b.getQuantity() > 0 && b.getExpiryDate().isAfter(today)).toList();
                if (!activeBatches.isEmpty()) {
                    for (int j = 0; j < activeBatches.size(); j++) {
                        Batch b = activeBatches.get(j);
                        long daysLeft = ChronoUnit.DAYS.between(today, b.getExpiryDate());
                        String fefoTag = j == 0 ? " [🟢 FEFO Next]" : "";
                        sb.append("  - Batch `").append(b.getBatchNumber()).append("`: **").append(b.getQuantity())
                                .append(" units** (Exp: ").append(b.getExpiryDate()).append(", ").append(daysLeft)
                                .append("d left)").append(fefoTag).append("\n");
                    }
                } else {
                    sb.append("  - *No active batches in stock (Depleted)*\n");
                }
                sb.append("\n");
            }
            response.put("text", sb.toString());
            response.put("type", "info");
            actions.add(Map.of("label", "Batch Management", "path", "/admin/batches"));
            actions.add(Map.of("label", "Dispense Launchpad", "path", "/pharmacist/dispense"));
            response.put("actions", actions);
            return response;
        }

        // C. Inventory of Each Medicine (e.g. "inventory of each medicine", "full
        // inventory")
        if (q.contains("inventory of each") || q.contains("stock of each") || q.contains("full inventory")
                || q.contains("all inventory") || q.contains("inventory of all") || q.contains("stock of all")
                || q.contains("complete inventory")) {
            StringBuilder sb = new StringBuilder("📦 **Complete Pharmacy Inventory Breakdown (All Medicines)**\n\n");
            List<Batch> allBatches = batchRepository.findAll();
            int totalPhysicalUnits = allBatches.stream().mapToInt(Batch::getQuantity).sum();
            sb.append("• **Total Active Medicines:** **").append(allMeds.size()).append(" items** registered\n");
            sb.append("• **Total Usable Units in Stock:** **").append(totalPhysicalUnits).append(" units**\n\n");
            sb.append("📋 **Itemized Stock Levels:**\n\n");
            LocalDate today = LocalDate.now();
            for (Medicine med : allMeds) {
                List<Batch> batches = batchRepository.findByMedicineOrderByExpiryDateAsc(med);
                int totalUnits = batches.stream().filter(b -> b.getQuantity() > 0 && b.getExpiryDate().isAfter(today))
                        .mapToInt(Batch::getQuantity).sum();
                String badge = totalUnits == 0 ? "🔴 DEPLETED"
                        : totalUnits <= med.getMinimumStock() ? "🟠 LOW STOCK" : "🟢 OK";
                sb.append("• **").append(med.getBrandName()).append("** (")
                        .append(med.getGenericMedicine() != null ? med.getGenericMedicine() : "").append(") — `")
                        .append(med.getDosageForm() != null ? med.getDosageForm() : "Tablet").append(" ")
                        .append(med.getStrength() != null ? med.getStrength() : "").append("`\n")
                        .append("  Stock: **").append(totalUnits).append(" units** | Min: ")
                        .append(med.getMinimumStock()).append(" | Status: [").append(badge).append("]\n\n");
            }
            response.put("text", sb.toString());
            response.put("type", "info");
            actions.add(Map.of("label", "View Inventory", "path", "/admin/inventory"));
            actions.add(Map.of("label", "Auto Reorder", "path", "/admin/reorder"));
            response.put("actions", actions);
            return response;
        }

        // D. Single Medicine Direct Lookup / Stock & Batch Card (e.g. "dolo650",
        // "calpol 650", "batches of dolo650", "full inventory of dolo650")
        String qSpaceless = q.replaceAll("[\\s-_]+", "");
        Optional<Medicine> matchingMed = allMeds.stream()
                .filter(m -> {
                    String b = m.getBrandName().toLowerCase();
                    String bClean = b.replaceAll("[\\s-_]+", "");
                    String g = m.getGenericMedicine() != null ? m.getGenericMedicine().toLowerCase() : "";
                    String gClean = g.replaceAll("[\\s-_]+", "");
                    return q.equals(b) || qSpaceless.equals(bClean) || q.contains(b)
                            || (bClean.length() >= 3 && qSpaceless.contains(bClean))
                            || (g.length() >= 3 && q.contains(g))
                            || (gClean.length() >= 3 && qSpaceless.contains(gClean));
                })
                .findFirst();

        if (matchingMed.isPresent()) {
            Medicine med = matchingMed.get();
            List<Batch> batches = batchRepository.findByMedicineOrderByExpiryDateAsc(med);
            LocalDate today = LocalDate.now();
            List<Batch> activeBatches = batches.stream()
                    .filter(b -> b.getQuantity() > 0 && b.getExpiryDate().isAfter(today)).toList();
            int totalUnits = activeBatches.stream().mapToInt(Batch::getQuantity).sum();
            int minStock = med.getMinimumStock();
            String stockBadge = totalUnits == 0 ? "🔴 OUT OF STOCK / DEPLETED"
                    : totalUnits <= minStock ? ("🟠 LOW STOCK (" + totalUnits + "/" + minStock + " min)")
                            : ("🟢 HEALTHY STOCK (" + totalUnits + " units)");

            Batch fefo = activeBatches.isEmpty() ? null : activeBatches.get(0);
            StringBuilder sb = new StringBuilder();
            sb.append("💊 **Pharmacist Formulary & Stock Card: ").append(med.getBrandName()).append("** (")
                    .append(med.getGenericMedicine() != null ? med.getGenericMedicine() : "").append(")\n\n");
            sb.append("📦 **Live Inventory & FEFO Status:**\n");
            sb.append("• **Available Usable Stock:** **").append(totalUnits).append(" units** across ")
                    .append(activeBatches.size()).append(" active batch(es)\n");
            sb.append("• **Safety Minimum Threshold:** ").append(minStock).append(" units (Status: **")
                    .append(stockBadge).append("**)\n");
            if (fefo != null) {
                long days = ChronoUnit.DAYS.between(today, fefo.getExpiryDate());
                sb.append("• **Allocated FEFO Batch:** `").append(fefo.getBatchNumber()).append("` (**")
                        .append(fefo.getQuantity()).append(" units**, Expires: ").append(fefo.getExpiryDate())
                        .append(", **").append(days).append("d left**)\n\n");
            } else {
                sb.append("• **Allocated FEFO Batch:** ⚠️ No usable batch in stock!\n\n");
            }
            sb.append("🏷️ **Active Batches (FEFO Sorted):**\n");
            if (!activeBatches.isEmpty()) {
                for (int j = 0; j < activeBatches.size(); j++) {
                    Batch b = activeBatches.get(j);
                    long days = ChronoUnit.DAYS.between(today, b.getExpiryDate());
                    String statusTag = days <= 30 ? ("🟠 CRITICAL (" + days + "d)")
                            : (j == 0 ? ("🟢 FEFO PRIORITY (" + days + "d left)") : ("🟢 " + days + "d left"));
                    sb.append("• Batch `").append(b.getBatchNumber()).append("`: **").append(b.getQuantity())
                            .append(" units** | Exp: ").append(b.getExpiryDate()).append(" [").append(statusTag)
                            .append("] | Supplier: `").append(b.getSupplier() != null ? b.getSupplier() : "Standard")
                            .append("`\n");
                }
            } else {
                sb.append("• ⚠️ *No usable batches in active inventory.*\n");
            }
            sb.append("\n📋 **Formulary Specifications:**\n");
            sb.append("• **Dosage Form & Strength:** ")
                    .append(med.getDosageForm() != null ? med.getDosageForm() : "Tablet").append(" | ")
                    .append(med.getStrength() != null ? med.getStrength() : "Standard").append("\n");
            sb.append("• **Manufacturer:** ")
                    .append(med.getManufacturer() != null ? med.getManufacturer() : "Certified Supplier")
                    .append("\n\n");
            sb.append("🩺 **Clinical Quick Reference:**\n");
            sb.append("• **Description:** ")
                    .append(med.getDescription() != null ? med.getDescription() : "Pharmaceutical formulation")
                    .append("\n");
            sb.append("• *MediTrack FEFO enforces batch safety before every dispense.*");

            response.put("text", sb.toString());
            response.put("type", totalUnits <= minStock ? "warning" : "success");
            actions.add(Map.of("label", "Dispense " + med.getBrandName(), "path", "/pharmacist/dispense"));
            actions.add(Map.of("label", "View in Batches", "path", "/admin/batches"));
            response.put("actions", actions);
            return response;
        }

        // 12. General Stock / Inventory inquiry (when no specific medicine matched)
        if (q.contains("stock") || q.contains("inventory") || q.contains("batches")) {
            List<Medicine> meds = medicineRepository.findAll();
            List<Batch> allBatches = batchRepository.findAll();
            int totalStock = allBatches.stream().mapToInt(Batch::getQuantity).sum();
            long lowStockCount = allBatches.stream().filter(b -> b.getQuantity() <= b.getMinimumStock()).count();

            response.put("text", "📦 **Live Pharmacy Inventory Status**\n\n" +
                    "• Total Medicines Registered: " + meds.size() + "\n" +
                    "• Total Usable Units in Stock: " + totalStock + "\n" +
                    "• Batches Below Minimum Stock: " + lowStockCount + "\n\n" +
                    "Use the Auto-Reorder engine or Inventory module to adjust stock levels.");
            response.put("type", "info");
            actions.add(Map.of("label", "View Inventory", "path", "/admin/inventory"));
            actions.add(Map.of("label", "Auto Reorder", "path", "/admin/reorder"));
            response.put("actions", actions);
            return response;
        }

        // 13. Order Received & Awaiting Deliveries
        if (q.contains("awaiting") || q.contains("order received") || q.contains("orders received") ||
                q.contains("inwarding") || q.contains("pending shipment") || q.contains("pending delivery")
                || q.contains("goods received")) {
            List<ReorderOrder> awaitingOrders = reorderOrderRepository.findByStatus("ORDERED");
            if (awaitingOrders != null && !awaitingOrders.isEmpty()) {
                StringBuilder sb = new StringBuilder("📦 **Orders Received — Awaiting Inwarding & Delivery**\n\n");
                sb.append("There are currently **").append(awaitingOrders.size())
                        .append(" order(s) awaiting delivery / shipment intake**:\n\n");
                for (ReorderOrder o : awaitingOrders) {
                    sb.append("• **").append(o.getOrderNumber() != null ? o.getOrderNumber() : ("ORD-" + o.getId()))
                            .append("**: **")
                            .append(o.getMedicine() != null ? o.getMedicine().getBrandName() : "Medicine")
                            .append("** — **").append(o.getApprovedQuantity()).append(" units**\n")
                            .append("  Supplier: `")
                            .append(o.getSupplier() != null ? o.getSupplier() : "Standard Supplier")
                            .append("` | Status: `AWAITING SHIPMENT`\n\n");
                }
                sb.append(
                        "> Navigate to **Order Received** to verify physical quantities and auto-generate batch consignments upon shipment arrival.");
                response.put("text", sb.toString());
                response.put("type", "info");
                actions.add(Map.of("label", "Open Order Received Intake", "path", "/admin/order-received"));
                actions.add(Map.of("label", "Review Auto Reorder", "path", "/admin/reorder"));
                response.put("actions", actions);
                return response;
            } else {
                response.put("text",
                        "📦 **Orders Received & Inwarding Status**\n\nThere are currently no shipments awaiting intake. All placed orders have been received and converted into active inventory batches.");
                response.put("type", "success");
                actions.add(Map.of("label", "Go to Auto Reorder", "path", "/admin/reorder"));
                actions.add(Map.of("label", "View Order Received", "path", "/admin/order-received"));
                response.put("actions", actions);
                return response;
            }
        }

        // 15. Conversational & General Fallback
        if (q.contains("thank")) {
            response.put("text",
                    "😊 **You are very welcome!**\n\nI am always here to assist with clinical checks, batch lookups, or inventory workflows. Have a great shift!");
            response.put("type", "success");
            actions.add(Map.of("label", "Dispense Console", "path", "/pharmacist/dispense"));
            response.put("actions", actions);
            return response;
        }

        response.put("text", "🤖 **MediTrack Pro Chatbot**\n\n" +
                "I am integrated with your live database. You can ask me:\n" +
                "• *How to dispense medicine?* or *How to add a medicine?*\n" +
                "• *What is our stock for Dolo 650?* or *Where is batch PCM2026A?*\n" +
                "• *What is FEFO?* or *Explain Croston-SBA formula*\n" +
                "• *Show order received awaiting medicine*\n" +
                "• *How to scan barcode?* or *Difference between Admin and Pharmacist*\n" +
                "• *Check interaction between Ibuprofen and Warfarin*");
        response.put("type", "info");
        actions.add(Map.of("label", "Dispense Launchpad", "path", "/pharmacist/dispense"));
        actions.add(Map.of("label", "Order Received", "path", "/admin/order-received"));
        actions.add(Map.of("label", "Expiry Radar", "path", "/admin/expiry"));
        response.put("actions", actions);
        return response;
    }
}
