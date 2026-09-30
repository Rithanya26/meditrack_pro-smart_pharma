package com.pharmacy.meditrack.config;

import java.time.LocalDate;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.pharmacy.meditrack.entity.Batch;
import com.pharmacy.meditrack.entity.Medicine;
import com.pharmacy.meditrack.entity.User;
import com.pharmacy.meditrack.enums.MedicineStatus;
import com.pharmacy.meditrack.enums.UserRole;
import com.pharmacy.meditrack.enums.UserStatus;
import com.pharmacy.meditrack.repository.BatchRepository;
import com.pharmacy.meditrack.repository.MedicineRepository;
import com.pharmacy.meditrack.repository.UserRepository;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MedicineRepository medicineRepository;
    private final BatchRepository batchRepository;

    public DataSeeder(UserRepository userRepository, MedicineRepository medicineRepository, BatchRepository batchRepository) {
        this.userRepository = userRepository;
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
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
            Medicine paracetamol = createMedicine("Paracetamol 500mg", "Acetaminophen", "Tablets", "MediCorp Ltd", "500mg", "Tablet", "Pain reliever and fever reducer");
            Medicine ibuprofen = createMedicine("Ibuprofen 400mg", "Ibuprofen", "Tablets", "MediCorp Ltd", "400mg", "Tablet", "NSAID for pain and inflammation");
            Medicine amoxicillin = createMedicine("Amoxicillin 500mg", "Amoxicillin", "Capsules", "PharmaHealth Inc", "500mg", "Capsule", "Broad-spectrum antibiotic");
            Medicine cetirizine = createMedicine("Cetirizine 10mg", "Cetirizine Hydrochloride", "Tablets", "AllerCare Pharma", "10mg", "Tablet", "Antihistamine for allergies");

            medicineRepository.saveAll(List.of(paracetamol, ibuprofen, amoxicillin, cetirizine));

            Batch p1 = createBatch(paracetamol, "PCM2026A", LocalDate.of(2025, 6, 15), LocalDate.of(2027, 6, 14), "MediSupply Co", LocalDate.of(2025, 6, 20), 500, 50);
            Batch p2 = createBatch(paracetamol, "PCM2026B", LocalDate.of(2025, 9, 1), LocalDate.of(2027, 9, 1), "MediSupply Co", LocalDate.of(2025, 9, 10), 320, 50);
            Batch i1 = createBatch(ibuprofen, "IBU2027A", LocalDate.of(2025, 10, 1), LocalDate.of(2027, 10, 1), "MediSupply Co", LocalDate.of(2025, 10, 10), 400, 60);
            Batch a1 = createBatch(amoxicillin, "AMX2026A", LocalDate.of(2025, 8, 1), LocalDate.of(2026, 9, 13), "PharmaDist Ltd", LocalDate.of(2025, 8, 10), 200, 40);
            Batch c1 = createBatch(cetirizine, "CTZ2027A", LocalDate.of(2025, 10, 1), LocalDate.of(2027, 10, 1), "AllerSupply", LocalDate.of(2025, 10, 10), 200, 30);

            batchRepository.saveAll(List.of(p1, p2, i1, a1, c1));
        }
    }

    private Medicine createMedicine(String name, String genericName, String category, String manufacturer, String strength, String dosageForm, String description) {
        Medicine medicine = new Medicine();
        medicine.setName(name);
        medicine.setGenericName(genericName);
        medicine.setCategory(category);
        medicine.setManufacturer(manufacturer);
        medicine.setStrength(strength);
        medicine.setDosageForm(dosageForm);
        medicine.setDescription(description);
        medicine.setStatus(MedicineStatus.ACTIVE);
        return medicine;
    }

    private Batch createBatch(Medicine medicine, String batchNumber, LocalDate manufacturingDate, LocalDate expiryDate, String supplier, LocalDate receivedDate, int quantity, int minimumStock) {
        Batch batch = new Batch();
        batch.setMedicine(medicine);
        batch.setBatchNumber(batchNumber);
        batch.setManufacturingDate(manufacturingDate);
        batch.setExpiryDate(expiryDate);
        batch.setSupplier(supplier);
        batch.setReceivedDate(receivedDate);
        batch.setQuantity(quantity);
        batch.setMinimumStock(minimumStock);
        return batch;
    }
}
