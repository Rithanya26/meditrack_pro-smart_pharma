package com.pharmacy.meditrack.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.pharmacy.meditrack.entity.Batch;
import com.pharmacy.meditrack.entity.DispensingItem;
import com.pharmacy.meditrack.entity.DispensingTransaction;
import com.pharmacy.meditrack.entity.Medicine;
import com.pharmacy.meditrack.entity.User;
import com.pharmacy.meditrack.repository.BatchRepository;
import com.pharmacy.meditrack.repository.DispensingItemRepository;
import com.pharmacy.meditrack.repository.DispensingTransactionRepository;
import com.pharmacy.meditrack.repository.MedicineRepository;
import com.pharmacy.meditrack.repository.UserRepository;

/**
 * Initializes and ensures authentic 6-8 month historical dispensing transactions
 * for each Product / Brand in the standard dispensing database tables.
 * Preserves existing inventory batch quantities and valid existing records.
 */
@Component
public class DispensingHistoryInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DispensingHistoryInitializer.class);

    private final DispensingTransactionRepository transactionRepository;
    private final DispensingItemRepository itemRepository;
    private final MedicineRepository medicineRepository;
    private final BatchRepository batchRepository;
    private final UserRepository userRepository;

    public DispensingHistoryInitializer(DispensingTransactionRepository transactionRepository,
                                        DispensingItemRepository itemRepository,
                                        MedicineRepository medicineRepository,
                                        BatchRepository batchRepository,
                                        UserRepository userRepository) {
        this.transactionRepository = transactionRepository;
        this.itemRepository = itemRepository;
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        try {
            ensureHistoricalRecords();
        } catch (Exception e) {
            log.warn("Historical dispensing record verification encountered an exception: {}", e.getMessage());
        }
    }

    /**
     * Inspects dispensing history per medicine. If any medicine has fewer than 6 months
     * of dispensing history, creates realistic historical transactions across Feb-Sep 2026.
     */
    @Transactional
    public synchronized int ensureHistoricalRecords() {
        List<Medicine> medicines = medicineRepository.findAll();
        if (medicines.isEmpty()) {
            return 0;
        }

        // Find default pharmacist (e.g. Kavitha or first available user)
        User pharmacist = userRepository.findById(2L)
                .or(() -> userRepository.findAll().stream().findFirst())
                .orElse(null);

        if (pharmacist == null) {
            log.warn("No user available to associate with dispensing transactions.");
            return 0;
        }

        // Inspect existing transaction history depth per medicine
        Map<Long, Set<String>> medicineHistoryMonths = new HashMap<>();
        List<DispensingItem> existingItems = itemRepository.findAll();
        for (DispensingItem item : existingItems) {
            if (item.getMedicine() != null && item.getTransaction() != null && item.getTransaction().getTransactionDate() != null) {
                Long medId = item.getMedicine().getId();
                String ym = item.getTransaction().getTransactionDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
                medicineHistoryMonths.computeIfAbsent(medId, k -> new HashSet<>()).add(ym);
            }
        }

        // Customer pool for realistic normal pharmacy records
        String[][] customers = {
            {"Robert Johnson", "+1-555-0211", "PAT-1001"},
            {"Maria Garcia", "+1-555-0212", "PAT-1002"},
            {"David Smith", "+1-555-0213", "PAT-1003"},
            {"Anna Williams", "+1-555-0214", "PAT-1004"},
            {"Priya Sharma", "+1-555-0215", "PAT-1005"},
            {"Carlos Gomez", "+1-555-0216", "PAT-1006"},
            {"Sarah Jenkins", "+1-555-0217", "PAT-1007"},
            {"John Miller", "+1-555-0218", "PAT-1008"},
            {"Elena Rostova", "+1-555-0219", "PAT-1009"},
            {"Michael Chen", "+1-555-0220", "PAT-1010"},
            {"Anita Desai", "+1-555-0221", "PAT-1011"},
            {"Thomas Wright", "+1-555-0222", "PAT-1012"},
            {"Sunita Rao", "+1-555-0223", "PAT-1013"},
            {"James Wilson", "+1-555-0224", "PAT-1014"},
            {"Aisha Khan", "+1-555-0225", "PAT-1015"},
            {"Daniel Lee", "+1-555-0226", "PAT-1016"},
            {"Meera Joshi", "+1-555-0227", "PAT-1017"},
            {"George Davis", "+1-555-0228", "PAT-1018"},
            {"Fatima Ali", "+1-555-0229", "PAT-1019"},
            {"Vikram Singh", "+1-555-0230", "PAT-1020"},
            {"Susan Clark", "+1-555-0231", "PAT-1021"},
            {"Rajesh Kumar", "+1-555-0232", "PAT-1022"},
            {"Linda Martinez", "+1-555-0233", "PAT-1023"},
            {"Kevin Taylor", "+1-555-0234", "PAT-1024"}
        };

        // Standard monthly schedule [month (2..9), day (1..28), quantity]
        Map<Integer, int[][]> schedules = getDispensingSchedules();

        int createdTransactions = 0;
        int customerIndex = 0;
        int rxCounter = 1001;

        // Process each medicine
        for (Medicine med : medicines) {
            Set<String> existingMonths = medicineHistoryMonths.getOrDefault(med.getId(), Collections.emptySet());
            // If already has 6+ months of history, respect existing data
            if (existingMonths.size() >= 6) {
                continue;
            }

            // Find valid batch for this medicine
            List<Batch> batches = batchRepository.findByMedicineOrderByExpiryDateAsc(med);
            if (batches.isEmpty()) {
                continue;
            }
            Batch batch = batches.get(0);
            LocalDate expiryDate = batch.getExpiryDate() != null ? batch.getExpiryDate() : LocalDate.of(2027, 6, 30);

            int[][] schedule = schedules.getOrDefault(med.getId().intValue(), getDefaultSchedule(med));

            for (int[] event : schedule) {
                int month = event[0];
                int day = event[1];
                int quantity = event[2];

                String ym = String.format("2026-%02d", month);
                // If this specific month already has dispensing records for this medicine, do not duplicate
                if (existingMonths.contains(ym)) {
                    continue;
                }

                String[] cust = customers[customerIndex % customers.length];
                customerIndex++;

                int hour = 9 + ((customerIndex * 3) % 8);
                int minute = (customerIndex * 13) % 60;
                LocalDateTime txnDate = LocalDateTime.of(2026, month, day, hour, minute);

                DispensingTransaction txn = new DispensingTransaction();
                txn.setCustomerName(cust[0]);
                txn.setCustomerPhone(cust[1]);
                txn.setPatientId(cust[2]);
                txn.setReferenceNumber("RX-2026-" + rxCounter++);
                txn.setPharmacist(pharmacist);
                txn.setTransactionDate(txnDate);
                txn.setStatus("COMPLETED");

                DispensingItem item = new DispensingItem();
                item.setMedicine(med);
                item.setBatch(batch);
                item.setQuantity(quantity);
                item.setExpiryDateAtDispense(expiryDate);
                item.setTransaction(txn);

                txn.setItems(new ArrayList<>(List.of(item)));
                txn.setTotalItems(1);
                txn.setTotalQuantity(quantity);

                // Save directly to transaction table (preserving batch inventory stock)
                transactionRepository.save(txn);
                createdTransactions++;
            }
        }

        if (createdTransactions > 0) {
            log.info("Populated {} realistic historical dispensing transactions covering 6+ months.", createdTransactions);
        }
        return createdTransactions;
    }

    private int[][] getDefaultSchedule(Medicine med) {
        int base = Math.max(20, med.getMinimumStock() > 0 ? (med.getMinimumStock() / 2) : 25);
        return new int[][] {
            {2, 10, base}, {2, 22, base},
            {3, 8, base}, {3, 20, base + 5},
            {4, 9, base}, {4, 21, base + 2},
            {5, 7, base + 5}, {5, 23, base},
            {6, 11, base}, {6, 24, base + 4},
            {7, 8, base + 6}, {7, 22, base + 2},
            {8, 9, base}, {8, 23, base + 5},
            {9, 10, base + 2}, {9, 24, base + 4}
        };
    }

    private Map<Integer, int[][]> getDispensingSchedules() {
        Map<Integer, int[][]> map = new HashMap<>();
        // Med 1: Dolo 650 (Feb: 145, Mar: 160, Apr: 155, May: 175, Jun: 168, Jul: 182, Aug: 162, Sep: 180)
        map.put(1, new int[][]{
            {2,3,20},{2,7,25},{2,11,20},{2,16,20},{2,20,20},{2,24,20},{2,27,20},
            {3,2,20},{3,6,20},{3,10,20},{3,14,20},{3,18,20},{3,22,20},{3,26,20},{3,30,20},
            {4,3,20},{4,7,20},{4,11,15},{4,15,20},{4,19,20},{4,23,20},{4,26,20},{4,29,20},
            {5,2,20},{5,5,20},{5,9,20},{5,13,20},{5,16,15},{5,20,20},{5,24,20},{5,27,20},{5,30,20},
            {6,3,20},{6,7,24},{6,11,20},{6,15,20},{6,18,24},{6,22,20},{6,25,20},{6,29,20},
            {7,2,20},{7,6,22},{7,9,20},{7,13,20},{7,17,20},{7,21,20},{7,24,20},{7,28,20},{7,31,20},
            {8,3,20},{8,7,20},{8,11,20},{8,15,20},{8,18,22},{8,22,20},{8,29,20},{8,31,20},
            {9,2,20},{9,5,20},{9,9,20},{9,13,20},{9,16,20},{9,20,20},{9,23,20},{9,26,20},{9,29,20}
        });

        // Med 2: Calpol 650 (Feb: 115, Mar: 128, Apr: 135, May: 130, Jun: 142, Jul: 160, Aug: 130, Sep: 150)
        map.put(2, new int[][]{
            {2,4,20},{2,9,20},{2,14,15},{2,18,20},{2,22,20},{2,26,20},
            {3,3,20},{3,8,20},{3,13,20},{3,18,24},{3,23,24},{3,28,20},
            {4,2,20},{4,6,20},{4,11,15},{4,16,20},{4,21,20},{4,25,20},{4,29,20},
            {5,3,20},{5,8,25},{5,14,20},{5,19,25},{5,24,20},{5,29,20},
            {6,2,20},{6,6,20},{6,11,22},{6,16,20},{6,20,20},{6,24,20},{6,28,20},
            {7,2,20},{7,6,20},{7,10,20},{7,14,20},{7,18,20},{7,22,20},{7,26,20},{7,30,20},
            {8,4,20},{8,8,20},{8,13,25},{8,18,25},{8,22,20},{8,29,20},
            {9,3,20},{9,7,25},{9,12,20},{9,16,25},{9,21,20},{9,25,20},{9,29,20}
        });

        // Med 3: Crocin 650 (Feb: 82, Mar: 120, Apr: 90, May: 130, Jun: 105, Jul: 122, Aug: 110, Sep: 125)
        map.put(3, new int[][]{
            {2,5,20},{2,12,22},{2,19,20},{2,25,20},
            {3,4,20},{3,9,20},{3,14,20},{3,19,20},{3,24,20},{3,29,20},
            {4,5,20},{4,12,15},{4,18,20},{4,24,15},{4,28,20},
            {5,4,20},{5,9,25},{5,15,20},{5,20,25},{5,25,20},{5,30,20},
            {6,4,20},{6,10,25},{6,17,20},{6,23,20},{6,28,20},
            {7,3,20},{7,8,22},{7,14,20},{7,19,20},{7,24,20},{7,29,20},
            {8,5,25},{8,11,20},{8,17,25},{8,23,20},{8,28,20},
            {9,4,20},{9,9,25},{9,14,20},{9,19,20},{9,24,20},{9,28,20}
        });

        // Med 4: PCM 500 (Feb: 65, Mar: 75, Apr: 70, May: 85, Jun: 80, Jul: 92, Aug: 78, Sep: 88)
        map.put(4, new int[][]{
            {2,6,20},{2,15,25},{2,23,20},
            {3,5,20},{3,12,15},{3,20,20},{3,27,20},
            {4,6,25},{4,15,25},{4,24,20},
            {5,5,20},{5,12,25},{5,20,20},{5,27,20},
            {6,5,20},{6,12,20},{6,19,20},{6,26,20},
            {7,4,25},{7,11,22},{7,18,25},{7,26,20},
            {8,5,20},{8,12,18},{8,19,20},{8,27,20},
            {9,4,22},{9,11,22},{9,18,22},{9,25,22}
        });

        // Med 5: Brufen 400 (Feb: 110, Mar: 122, Apr: 135, May: 128, Jun: 142, Jul: 145, Aug: 145, Sep: 150)
        map.put(5, new int[][]{
            {2,3,20},{2,8,25},{2,14,25},{2,20,20},{2,25,20},
            {3,2,20},{3,7,22},{3,12,20},{3,17,20},{3,22,20},{3,27,20},
            {4,2,25},{4,7,20},{4,13,25},{4,18,25},{4,23,20},{4,28,20},
            {5,2,20},{5,7,24},{5,13,20},{5,18,24},{5,23,20},{5,28,20},
            {6,2,20},{6,6,20},{6,11,22},{6,16,20},{6,20,20},{6,24,20},{6,28,20},
            {7,2,20},{7,6,25},{7,11,20},{7,16,20},{7,20,20},{7,25,20},{7,29,20},
            {8,2,25},{8,7,20},{8,12,25},{8,17,25},{8,22,25},{8,28,25},
            {9,2,25},{9,6,20},{9,11,25},{9,15,20},{9,20,20},{9,24,20},{9,28,20}
        });

        // Med 6: Ibugesic 400 (Feb: 85, Mar: 95, Apr: 90, May: 105, Jun: 100, Jul: 110, Aug: 105, Sep: 100)
        map.put(6, new int[][]{
            {2,5,20},{2,11,25},{2,18,20},{2,25,20},
            {3,4,25},{3,11,25},{3,18,25},{3,25,20},
            {4,4,20},{4,11,25},{4,18,25},{4,25,20},
            {5,3,20},{5,9,25},{5,15,20},{5,21,20},{5,27,20},
            {6,3,20},{6,9,20},{6,16,20},{6,22,20},{6,27,20},
            {7,3,25},{7,9,20},{7,15,25},{7,22,20},{7,28,20},
            {8,3,20},{8,9,25},{8,15,20},{8,21,20},{8,27,20},
            {9,3,20},{9,9,20},{9,15,20},{9,21,20},{9,27,20}
        });

        // Med 7: Amoxil 500 (Feb: 70, Mar: 85, Apr: 90, May: 80, Jun: 95, Jul: 102, Aug: 58, Sep: 96)
        map.put(7, new int[][]{
            {2,7,20},{2,16,25},{2,24,25},
            {3,5,20},{3,12,25},{3,20,20},{3,27,20},
            {4,4,25},{4,11,20},{4,18,25},{4,26,20},
            {5,4,20},{5,11,20},{5,18,20},{5,26,20},
            {6,4,25},{6,11,25},{6,18,25},{6,25,20},
            {7,3,20},{7,8,22},{7,15,20},{7,22,20},{7,28,20},
            {8,4,20},{8,12,20},{8,20,18},
            {9,3,24},{9,10,24},{9,17,24},{9,24,24}
        });

        // Med 8: Zyrtec 10mg (Feb: 90, Mar: 105, Apr: 115, May: 125, Jun: 130, Jul: 128, Aug: 103, Sep: 110)
        map.put(8, new int[][]{
            {2,6,20},{2,13,25},{2,20,25},{2,26,20},
            {3,4,20},{3,10,20},{3,17,25},{3,23,20},{3,29,20},
            {4,3,25},{4,9,25},{4,16,25},{4,22,20},{4,28,20},
            {5,2,20},{5,7,25},{5,13,20},{5,18,20},{5,24,20},{5,29,20},
            {6,2,20},{6,7,25},{6,12,25},{6,17,20},{6,22,20},{6,27,20},
            {7,2,20},{7,7,20},{7,12,24},{7,18,24},{7,23,20},{7,28,20},
            {8,3,20},{8,8,20},{8,14,23},{8,20,20},{8,27,20},
            {9,3,20},{9,9,25},{9,15,25},{9,21,20},{9,27,20}
        });

        // Med 9: Prilosec 20mg (Feb: 60, Mar: 72, Apr: 68, May: 80, Jun: 75, Jul: 85, Aug: 78, Sep: 82)
        map.put(9, new int[][]{
            {2,8,20},{2,17,20},{2,25,20},
            {3,6,24},{3,15,24},{3,25,24},
            {4,7,20},{4,16,24},{4,25,24},
            {5,4,20},{5,12,20},{5,20,20},{5,28,20},
            {6,5,25},{6,15,25},{6,25,25},
            {7,4,20},{7,11,25},{7,19,20},{7,27,20},
            {8,5,20},{8,12,20},{8,19,20},{8,27,18},
            {9,4,20},{9,11,22},{9,19,20},{9,26,20}
        });

        // Med 10: Benadryl Cough (Feb: 75, Mar: 60, Apr: 45, May: 40, Jun: 50, Jul: 65, Aug: 75, Sep: 80)
        map.put(10, new int[][]{
            {2,4,20},{2,11,20},{2,18,20},{2,25,15},
            {3,6,20},{3,15,20},{3,24,20},
            {4,8,15},{4,17,15},{4,26,15},
            {5,10,20},{5,22,20},
            {6,8,15},{6,17,15},{6,26,20},
            {7,6,20},{7,15,25},{7,24,20},
            {8,4,20},{8,11,20},{8,18,20},{8,25,15},
            {9,4,20},{9,11,20},{9,18,20},{9,25,20}
        });

        // Med 11: Lantus SoloStar (Feb: 30, Mar: 35, Apr: 32, May: 38, Jun: 36, Jul: 40, Aug: 35, Sep: 38)
        map.put(11, new int[][]{
            {2,7,10},{2,16,10},{2,24,10},
            {3,6,10},{3,16,15},{3,26,10},
            {4,7,10},{4,17,12},{4,26,10},
            {5,6,10},{5,16,15},{5,26,13},
            {6,6,12},{6,16,12},{6,26,12},
            {7,5,10},{7,12,10},{7,20,10},{7,27,10},
            {8,6,10},{8,16,15},{8,26,10},
            {9,6,10},{9,16,14},{9,26,14}
        });

        // Med 12: Cortizone 10 (Feb: 25, Mar: 30, Apr: 28, May: 35, Jun: 32, Jul: 38, Aug: 30, Sep: 34)
        map.put(12, new int[][]{
            {2,8,8},{2,17,8},{2,25,9},
            {3,7,10},{3,17,10},{3,26,10},
            {4,8,8},{4,18,10},{4,27,10},
            {5,7,10},{5,17,15},{5,27,10},
            {6,7,10},{6,17,12},{6,26,10},
            {7,6,12},{7,16,14},{7,26,12},
            {8,7,10},{8,17,10},{8,26,10},
            {9,7,10},{9,17,12},{9,26,12}
        });

        // Med 13: Bactroban Ointment (Feb: 35, Mar: 40, Apr: 38, May: 45, Jun: 42, Jul: 48, Aug: 40, Sep: 44)
        map.put(13, new int[][]{
            {2,6,10},{2,15,15},{2,23,10},
            {3,5,10},{3,12,10},{3,20,10},{3,27,10},
            {4,6,12},{4,15,14},{4,24,12},
            {5,5,10},{5,12,15},{5,20,10},{5,27,10},
            {6,6,14},{6,16,14},{6,25,14},
            {7,5,12},{7,12,12},{7,20,12},{7,27,12},
            {8,5,10},{8,12,10},{8,20,10},{8,27,10},
            {9,5,11},{9,12,11},{9,20,11},{9,27,11}
        });

        // Med 14: Ventolin Inhaler (Feb: 20, Mar: 25, Apr: 22, May: 28, Jun: 26, Jul: 30, Aug: 24, Sep: 28)
        map.put(14, new int[][]{
            {2,8,6},{2,17,7},{2,25,7},
            {3,7,8},{3,17,8},{3,26,9},
            {4,8,7},{4,17,7},{4,26,8},
            {5,7,9},{5,17,9},{5,26,10},
            {6,7,8},{6,17,9},{6,26,9},
            {7,6,10},{7,16,10},{7,26,10},
            {8,7,8},{8,17,8},{8,26,8},
            {9,7,9},{9,17,9},{9,26,10}
        });

        // Med 15: Ecotrin 75mg (Feb: 120, Mar: 130, Apr: 125, May: 140, Jun: 135, Jul: 145, Aug: 140, Sep: 145)
        map.put(15, new int[][]{
            {2,4,25},{2,9,25},{2,14,25},{2,19,25},{2,25,20},
            {3,3,25},{3,8,25},{3,14,30},{3,20,25},{3,26,25},
            {4,3,25},{4,8,25},{4,14,25},{4,20,25},{4,26,25},
            {5,2,30},{5,7,25},{5,13,30},{5,19,25},{5,26,30},
            {6,2,25},{6,7,30},{6,13,25},{6,19,25},{6,26,30},
            {7,2,30},{7,7,30},{7,13,25},{7,19,30},{7,26,30},
            {8,2,25},{8,7,30},{8,13,30},{8,19,25},{8,26,30},
            {9,2,30},{9,7,30},{9,13,25},{9,19,30},{9,26,30}
        });

        // Med 16: Glucophage 500mg (Feb: 80, Mar: 90, Apr: 85, May: 95, Jun: 92, Jul: 100, Aug: 94, Sep: 98)
        map.put(16, new int[][]{
            {2,5,20},{2,12,20},{2,19,20},{2,26,20},
            {3,4,25},{3,11,20},{3,18,25},{3,25,20},
            {4,4,20},{4,11,25},{4,18,20},{4,25,20},
            {5,3,25},{5,10,25},{5,17,25},{5,24,20},
            {6,4,23},{6,11,23},{6,18,23},{6,25,23},
            {7,3,20},{7,9,20},{7,15,20},{7,21,20},{7,27,20},
            {8,4,24},{8,11,24},{8,18,23},{8,25,23},
            {9,4,25},{9,11,25},{9,18,24},{9,25,24}
        });

        // Med 17: Zithromax 250mg (Feb: 50, Mar: 65, Apr: 55, May: 70, Jun: 60, Jul: 68, Aug: 58, Sep: 62)
        map.put(17, new int[][]{
            {2,7,15},{2,16,15},{2,24,20},
            {3,5,15},{3,12,15},{3,20,15},{3,27,20},
            {4,6,15},{4,16,20},{4,25,20},
            {5,5,15},{5,12,20},{5,19,15},{5,26,20},
            {6,6,20},{6,16,20},{6,25,20},
            {7,5,17},{7,12,17},{7,19,17},{7,26,17},
            {8,6,18},{8,16,20},{8,25,20},
            {9,5,20},{9,15,21},{9,24,21}
        });

        // Med 18: Prinivil 10mg (Feb: 65, Mar: 70, Apr: 68, May: 75, Jun: 72, Jul: 80, Aug: 76, Sep: 78)
        map.put(18, new int[][]{
            {2,6,20},{2,15,25},{2,23,20},
            {3,6,25},{3,15,25},{3,24,20},
            {4,6,20},{4,15,24},{4,24,24},
            {5,5,20},{5,12,20},{5,19,20},{5,26,15},
            {6,6,24},{6,15,24},{6,24,24},
            {7,4,20},{7,11,20},{7,18,20},{7,25,20},
            {8,5,19},{8,12,19},{8,19,19},{8,26,19},
            {9,5,20},{9,12,20},{9,19,19},{9,26,19}
        });

        // Med 19: Lipitor 20mg (Feb: 75, Mar: 85, Apr: 80, May: 90, Jun: 88, Jul: 95, Aug: 90, Sep: 92)
        map.put(19, new int[][]{
            {2,6,25},{2,15,25},{2,23,25},
            {3,5,20},{3,12,25},{3,19,20},{3,26,20},
            {4,5,20},{4,12,20},{4,19,20},{4,26,20},
            {5,4,25},{5,11,25},{5,18,20},{5,25,20},
            {6,5,22},{6,12,22},{6,19,22},{6,26,22},
            {7,4,25},{7,11,25},{7,18,25},{7,25,20},
            {8,4,25},{8,11,25},{8,18,20},{8,25,20},
            {9,4,23},{9,11,23},{9,18,23},{9,25,23}
        });

        // Med 20: Rocephin 1g (Feb: 40, Mar: 50, Apr: 45, May: 55, Jun: 52, Jul: 60, Aug: 50, Sep: 55)
        map.put(20, new int[][]{
            {2,7,12},{2,16,14},{2,24,14},
            {3,6,16},{3,16,17},{3,26,17},
            {4,7,15},{4,16,15},{4,25,15},
            {5,5,12},{5,12,14},{5,19,14},{5,26,15},
            {6,6,17},{6,16,17},{6,25,18},
            {7,4,15},{7,11,15},{7,18,15},{7,25,15},
            {8,6,16},{8,16,17},{8,25,17},
            {9,5,12},{9,12,14},{9,19,14},{9,26,15}
        });

        return map;
    }
}
