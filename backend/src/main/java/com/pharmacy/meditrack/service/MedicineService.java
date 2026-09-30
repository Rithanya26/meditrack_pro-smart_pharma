package com.pharmacy.meditrack.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pharmacy.meditrack.entity.Batch;
import com.pharmacy.meditrack.entity.Medicine;
import com.pharmacy.meditrack.enums.MedicineStatus;
import com.pharmacy.meditrack.exception.BadRequestException;
import com.pharmacy.meditrack.exception.ResourceNotFoundException;
import com.pharmacy.meditrack.repository.BatchRepository;
import com.pharmacy.meditrack.repository.MedicineRepository;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final BatchRepository batchRepository;

    public MedicineService(MedicineRepository medicineRepository, BatchRepository batchRepository) {
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
    }

    public List<Medicine> getAll() {
        return medicineRepository.findAll();
    }

    public Medicine getById(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + id));
    }

    public Medicine create(Medicine medicine) {
        if (medicineRepository.existsByNameIgnoreCase(medicine.getName())) {
            throw new BadRequestException("A medicine with this name already exists.");
        }
        medicine.setStatus(MedicineStatus.ACTIVE);
        return medicineRepository.save(medicine);
    }

    @Transactional
    public Medicine update(Long id, Medicine updated) {
        Medicine existing = getById(id);
        if (!existing.getName().equalsIgnoreCase(updated.getName())
                && medicineRepository.existsByNameIgnoreCase(updated.getName())) {
            throw new BadRequestException("A medicine with this name already exists.");
        }
        existing.setName(updated.getName());
        existing.setGenericName(updated.getGenericName());
        existing.setCategory(updated.getCategory());
        existing.setManufacturer(updated.getManufacturer());
        existing.setStrength(updated.getStrength());
        existing.setDosageForm(updated.getDosageForm());
        existing.setDescription(updated.getDescription());
        existing.setStatus(updated.getStatus());
        return medicineRepository.save(existing);
    }

    public List<Medicine> getExpiringSoon(int days) {
        return medicineRepository.findAll().stream()
                .filter(medicine -> medicine.getBatches().stream().anyMatch(batch ->
                        batch.getExpiryDate() != null && batch.getExpiryDate().isBefore(LocalDate.now().plusDays(days))))
                .toList();
    }

    public List<Batch> getBatchesForMedicine(Long medicineId) {
        getById(medicineId);
        return batchRepository.findByMedicineIdOrderByExpiryDateAsc(medicineId);
    }
}
