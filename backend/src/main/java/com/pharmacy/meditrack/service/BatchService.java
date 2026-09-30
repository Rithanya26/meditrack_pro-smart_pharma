package com.pharmacy.meditrack.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pharmacy.meditrack.entity.Batch;
import com.pharmacy.meditrack.entity.Medicine;
import com.pharmacy.meditrack.exception.BadRequestException;
import com.pharmacy.meditrack.exception.ResourceNotFoundException;
import com.pharmacy.meditrack.repository.BatchRepository;
import com.pharmacy.meditrack.repository.MedicineRepository;

@Service
public class BatchService {

    private final BatchRepository batchRepository;
    private final MedicineRepository medicineRepository;

    public BatchService(BatchRepository batchRepository, MedicineRepository medicineRepository) {
        this.batchRepository = batchRepository;
        this.medicineRepository = medicineRepository;
    }

    public List<Batch> getAll() {
        return batchRepository.findAll();
    }

    public Batch getById(Long id) {
        return batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + id));
    }

    public Batch create(Batch batch) {
        if (batch.getMedicine() == null || batch.getMedicine().getId() == null) {
            throw new BadRequestException("Medicine is required for batch registration.");
        }

        Medicine medicine = medicineRepository.findById(batch.getMedicine().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + batch.getMedicine().getId()));

        if (batchRepository.findByBatchNumber(batch.getBatchNumber()).isPresent()) {
            throw new BadRequestException("This batch number is already in use.");
        }

        batch.setMedicine(medicine);
        if (batch.getExpiryDate() != null && batch.getExpiryDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Expiry date cannot be in the past.");
        }
        return batchRepository.save(batch);
    }

    public Batch update(Long id, Batch updated) {
        Batch existing = getById(id);
        existing.setBatchNumber(updated.getBatchNumber());
        existing.setExpiryDate(updated.getExpiryDate());
        existing.setManufacturingDate(updated.getManufacturingDate());
        existing.setSupplier(updated.getSupplier());
        existing.setReceivedDate(updated.getReceivedDate());
        existing.setQuantity(updated.getQuantity());
        existing.setMinimumStock(updated.getMinimumStock());
        if (updated.getMedicine() != null) {
            existing.setMedicine(updated.getMedicine());
        }
        return batchRepository.save(existing);
    }

    public void delete(Long id) {
        Batch batch = getById(id);
        batchRepository.delete(batch);
    }

    @Transactional
    public Batch adjustStock(Long id, int adjustment, String type) {
        if (adjustment <= 0) {
            throw new BadRequestException("Adjustment must be greater than zero.");
        }
        Batch batch = getById(id);
        int newQuantity = "add".equalsIgnoreCase(type)
                ? batch.getQuantity() + adjustment
                : batch.getQuantity() - adjustment;
        if (newQuantity < 0) {
            throw new BadRequestException("Cannot remove more than available stock.");
        }
        batch.setQuantity(newQuantity);
        return batchRepository.save(batch);
    }
}
