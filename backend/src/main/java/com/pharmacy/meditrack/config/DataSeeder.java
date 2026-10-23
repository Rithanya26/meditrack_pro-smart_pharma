package com.pharmacy.meditrack.config;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.pharmacy.meditrack.entity.Batch;
import com.pharmacy.meditrack.entity.DispensingItem;
import com.pharmacy.meditrack.entity.DispensingTransaction;
import com.pharmacy.meditrack.entity.Medicine;
import com.pharmacy.meditrack.entity.User;
import com.pharmacy.meditrack.enums.MedicineStatus;
import com.pharmacy.meditrack.enums.UserRole;
import com.pharmacy.meditrack.enums.UserStatus;
import com.pharmacy.meditrack.entity.ReorderOrder;
import com.pharmacy.meditrack.repository.BatchRepository;
import com.pharmacy.meditrack.repository.DispensingTransactionRepository;
import com.pharmacy.meditrack.repository.MedicineRepository;
import com.pharmacy.meditrack.repository.ReorderOrderRepository;
import com.pharmacy.meditrack.repository.UserRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final BatchRepository batchRepository;
    private final DispensingTransactionRepository dispensingTransactionRepository;
    private final ReorderOrderRepository reorderOrderRepository;

    public DataSeeder(UserRepository userRepository,
                      MedicineRepository medicineRepository,
                      BatchRepository batchRepository,
                      DispensingTransactionRepository dispensingTransactionRepository,
                      ReorderOrderRepository reorderOrderRepository) {
        this.userRepository = userRepository;
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
        this.dispensingTransactionRepository = dispensingTransactionRepository;
        this.reorderOrderRepository = reorderOrderRepository;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = new User();
            admin.setName("Latha");
            admin.setEmail("admin@meditrack.com");
            admin.setPhone("+1-555-0101");
            admin.setPassword("admin123");
            admin.setRole(UserRole.ADMIN);
            admin.setStatus(UserStatus.ACTIVE);
            userRepository.save(admin);

            User pharmacist = new User();
            pharmacist.setName("Kavitha");
            pharmacist.setEmail("pharmacist@meditrack.com");
            pharmacist.setPhone("+1-555-0102");
            pharmacist.setPassword("pharma123");
            pharmacist.setRole(UserRole.PHARMACIST);
            pharmacist.setStatus(UserStatus.ACTIVE);
            userRepository.save(pharmacist);
        }

        if (medicineRepository.count() == 0) {
            Medicine dolo = createMedicine("Dolo 650", "Paracetamol", "Micro Labs", "650 mg", "Tablet", "Pain reliever and fever reducer", 50);
            Medicine calpol = createMedicine("Calpol 650", "Paracetamol", "GlaxoSmithKline", "650 mg", "Tablet", "Analgesic and antipyretic", 60);
            Medicine crocin = createMedicine("Crocin 650", "Paracetamol", "GlaxoSmithKline", "650 mg", "Tablet", "Fast action paracetamol tablet", 40);
            Medicine pcm = createMedicine("PCM 500", "Paracetamol", "MediCorp Ltd", "500 mg", "Tablet", "Standard paracetamol 500mg tablet", 30);
            Medicine brufen = createMedicine("Brufen 400", "Ibuprofen", "Abbott", "400 mg", "Tablet", "NSAID for pain and inflammation", 45);
            Medicine ibugesic = createMedicine("Ibugesic 400", "Ibuprofen", "Cipla Ltd", "400 mg", "Tablet", "Anti-inflammatory and analgesic", 40);
            Medicine amoxil = createMedicine("Amoxil 500", "Amoxicillin", "PharmaHealth Inc", "500 mg", "Capsule", "Broad-spectrum penicillin antibiotic", 35);
            Medicine zyrtec = createMedicine("Zyrtec 10mg", "Cetirizine", "AllerCare Pharma", "10 mg", "Tablet", "Antihistamine for allergies", 50);

            medicineRepository.saveAll(List.of(dolo, calpol, crocin, pcm, brufen, ibugesic, amoxil, zyrtec));

            Batch p1 = createBatch(dolo, "DLO2026A", LocalDate.of(2025, 6, 15), LocalDate.of(2027, 6, 14), "Micro Supply Co", LocalDate.of(2025, 6, 20), 500);
            Batch p2 = createBatch(dolo, "DLO2026B", LocalDate.of(2025, 9, 1), LocalDate.of(2027, 9, 1), "Micro Supply Co", LocalDate.of(2025, 9, 10), 320);
            Batch p3 = createBatch(calpol, "CAL2027A", LocalDate.of(2025, 10, 1), LocalDate.of(2027, 10, 1), "GSK Logistics", LocalDate.of(2025, 10, 10), 400);
            Batch p4 = createBatch(crocin, "CRO2026A", LocalDate.of(2025, 8, 1), LocalDate.of(2026, 9, 13), "GSK Logistics", LocalDate.of(2025, 8, 10), 200);
            Batch p5 = createBatch(pcm, "PCM2027A", LocalDate.of(2025, 10, 1), LocalDate.of(2027, 10, 1), "MediSupply Co", LocalDate.of(2025, 10, 10), 250);
            Batch b1 = createBatch(brufen, "BRU2027A", LocalDate.of(2025, 11, 1), LocalDate.of(2027, 11, 1), "Abbott Supply", LocalDate.of(2025, 11, 10), 350);
            Batch b2 = createBatch(ibugesic, "IBU2026A", LocalDate.of(2025, 7, 1), LocalDate.of(2026, 8, 15), "Cipla Dist", LocalDate.of(2025, 7, 10), 180);
            Batch a1 = createBatch(amoxil, "AMX2026A", LocalDate.of(2025, 5, 1), LocalDate.of(2026, 10, 1), "PharmaDist Ltd", LocalDate.of(2025, 5, 10), 220);
            Batch c1 = createBatch(zyrtec, "ZYR2027A", LocalDate.of(2025, 12, 1), LocalDate.of(2027, 12, 1), "AllerSupply", LocalDate.of(2025, 12, 10), 300);

            batchRepository.saveAll(List.of(p1, p2, p3, p4, p5, b1, b2, a1, c1));
        }

        if (dispensingTransactionRepository.count() == 0) {
            User pharmacist = userRepository.findByEmail("pharmacist@meditrack.com")
                    .orElse(userRepository.findAll().stream()
                            .filter(u -> u.getRole() == UserRole.PHARMACIST)
                            .findFirst().orElse(null));

            List<Medicine> medicines = medicineRepository.findAll();
            List<Batch> batches = batchRepository.findAll();

            if (pharmacist != null && !medicines.isEmpty() && !batches.isEmpty()) {
                Medicine dolo = medicines.stream().filter(m -> "Dolo 650".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(medicines.get(0));
                Batch doloBatch = batches.stream().filter(b -> b.getMedicine().getId().equals(dolo.getId())).findFirst().orElse(batches.get(0));

                Medicine calpol = medicines.stream().filter(m -> "Calpol 650".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(medicines.get(0));
                Batch calpolBatch = batches.stream().filter(b -> b.getMedicine().getId().equals(calpol.getId())).findFirst().orElse(doloBatch);

                Medicine brufen = medicines.stream().filter(m -> "Brufen 400".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(medicines.get(0));
                Batch brufenBatch = batches.stream().filter(b -> b.getMedicine().getId().equals(brufen.getId())).findFirst().orElse(doloBatch);

                Medicine amoxil = medicines.stream().filter(m -> "Amoxil 500".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(medicines.get(0));
                Batch amoxilBatch = batches.stream().filter(b -> b.getMedicine().getId().equals(amoxil.getId())).findFirst().orElse(doloBatch);

                // Transaction 1
                DispensingTransaction tx1 = new DispensingTransaction();
                tx1.setCustomerName("Robert Johnson");
                tx1.setCustomerPhone("+1-555-0211");
                tx1.setPatientId("PAT-1001");
                tx1.setReferenceNumber("RX-2026-001");
                tx1.setPharmacist(pharmacist);
                tx1.setStatus("COMPLETED");
                tx1.setTransactionDate(LocalDateTime.now().minusHours(5));

                DispensingItem item1 = createDispensingItem(tx1, dolo, doloBatch, 20);
                DispensingItem item2 = createDispensingItem(tx1, brufen, brufenBatch, 10);
                tx1.setItems(List.of(item1, item2));
                tx1.setTotalItems(2);
                tx1.setTotalQuantity(30);

                // Transaction 2
                DispensingTransaction tx2 = new DispensingTransaction();
                tx2.setCustomerName("Maria Garcia");
                tx2.setCustomerPhone("+1-555-0212");
                tx2.setPatientId("PAT-1002");
                tx2.setReferenceNumber("RX-2026-002");
                tx2.setPharmacist(pharmacist);
                tx2.setStatus("COMPLETED");
                tx2.setTransactionDate(LocalDateTime.now().minusHours(3));

                DispensingItem item3 = createDispensingItem(tx2, calpol, calpolBatch, 15);
                tx2.setItems(List.of(item3));
                tx2.setTotalItems(1);
                tx2.setTotalQuantity(15);

                // Transaction 3
                DispensingTransaction tx3 = new DispensingTransaction();
                tx3.setCustomerName("David Smith");
                tx3.setCustomerPhone("+1-555-0213");
                tx3.setPatientId("PAT-1003");
                tx3.setReferenceNumber("RX-2026-003");
                tx3.setPharmacist(pharmacist);
                tx3.setStatus("COMPLETED");
                tx3.setTransactionDate(LocalDateTime.now().minusDays(1));

                DispensingItem item4 = createDispensingItem(tx3, amoxil, amoxilBatch, 30);
                tx3.setItems(List.of(item4));
                tx3.setTotalItems(1);
                tx3.setTotalQuantity(30);

                dispensingTransactionRepository.saveAll(List.of(tx1, tx2, tx3));
            }
        }

        if (reorderOrderRepository.count() == 0) {
            List<Medicine> meds = medicineRepository.findAll();
            Medicine dolo = meds.stream().filter(m -> "Dolo 650".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(null);
            Medicine amoxil = meds.stream().filter(m -> "Amoxil 500".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(null);
            Medicine calpol = meds.stream().filter(m -> "Calpol 650".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(null);
            Medicine brufen = meds.stream().filter(m -> "Brufen 400".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(null);
            Medicine zyrtec = meds.stream().filter(m -> "Zyrtec 10mg".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(null);
            Medicine crocin = meds.stream().filter(m -> "Crocin 650".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(null);
            Medicine pcm = meds.stream().filter(m -> "PCM 500".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(null);
            Medicine ibugesic = meds.stream().filter(m -> "Ibugesic 400".equalsIgnoreCase(m.getBrandName())).findFirst().orElse(null);

            if (dolo != null) createAndSaveOrder(dolo, 45, 50, 150, 95, 88, 135, 135, "ORDERED", "Forecast-based auto replenishment approved by admin.");
            if (amoxil != null) createAndSaveOrder(amoxil, 12, 35, 100, 65, 85, 80, 80, "ORDERED", "Stock below threshold; 80 units approved.");
            if (calpol != null) createAndSaveOrder(calpol, 38, 60, 150, 110, 86, 120, 120, "ORDERED", "Low stock replenishment approved.");
            if (brufen != null) createAndSaveOrder(brufen, 25, 45, 120, 80, 84, 95, 95, "ORDERED", "Seasonal high demand replenishment approved.");
            if (zyrtec != null) createAndSaveOrder(zyrtec, 18, 50, 80, 50, 87, 60, 60, "ORDERED", "Allergy medication stock replenishment approved.");

            if (crocin != null) createAndSaveOrder(crocin, 140, 40, 140, 85, 90, 100, 100, "RECEIVED", "Goods received and batch CRO2026B registered.");
            if (pcm != null) createAndSaveOrder(pcm, 90, 30, 90, 55, 85, 75, 75, "RECEIVED", "Goods received and batch PCM2026C registered.");
            if (ibugesic != null) createAndSaveOrder(ibugesic, 110, 40, 110, 70, 88, 90, 90, "RECEIVED", "Goods received and batch IBU2026B registered.");
        }
    }

    private void createAndSaveOrder(Medicine medicine, int currentStock, int minStock, int targetStock, int demand30d, int accuracy, int suggestedQty, int approvedQty, String status, String reason) {
        ReorderOrder order = new ReorderOrder();
        order.setMedicine(medicine);
        order.setCurrentStock(currentStock);
        order.setMinimumStock(minStock);
        order.setTargetStock(targetStock);
        order.setPredictedDemand30d(demand30d);
        order.setForecastAccuracy(accuracy);
        order.setSuggestedQuantity(suggestedQty);
        order.setApprovedQuantity(approvedQty);
        order.setStatus(status);
        order.setReason(reason);
        order.setApprovedDate(LocalDateTime.now().minusDays(1));
        reorderOrderRepository.save(order);
    }

    private Medicine createMedicine(String brandName, String genericMedicine, String manufacturer, String strength, String dosageForm, String description, int minimumStock) {
        Medicine medicine = new Medicine();
        medicine.setBrandName(brandName);
        medicine.setGenericMedicine(genericMedicine);
        medicine.setManufacturer(manufacturer);
        medicine.setStrength(strength);
        medicine.setDosageForm(dosageForm);
        medicine.setDescription(description);
        medicine.setMinimumStock(minimumStock);
        medicine.setStatus(MedicineStatus.ACTIVE);
        return medicine;
    }

    private Batch createBatch(Medicine medicine, String batchNumber, LocalDate manufacturingDate, LocalDate expiryDate, String supplier, LocalDate receivedDate, int quantity) {
        Batch batch = new Batch();
        batch.setMedicine(medicine);
        batch.setBatchNumber(batchNumber);
        batch.setManufacturingDate(manufacturingDate);
        batch.setExpiryDate(expiryDate);
        batch.setSupplier(supplier);
        batch.setReceivedDate(receivedDate);
        batch.setQuantity(quantity);
        return batch;
    }

    private DispensingItem createDispensingItem(DispensingTransaction tx, Medicine medicine, Batch batch, int quantity) {
        DispensingItem item = new DispensingItem();
        item.setTransaction(tx);
        item.setMedicine(medicine);
        item.setBatch(batch);
        item.setQuantity(quantity);
        item.setExpiryDateAtDispense(batch != null && batch.getExpiryDate() != null ? batch.getExpiryDate() : LocalDate.now().plusYears(1));
        return item;
    }
}
