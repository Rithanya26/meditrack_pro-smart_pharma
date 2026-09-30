package com.pharmacy.meditrack.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pharmacy.meditrack.entity.Batch;
import com.pharmacy.meditrack.entity.DispensingItem;
import com.pharmacy.meditrack.entity.DispensingTransaction;
import com.pharmacy.meditrack.entity.Medicine;
import com.pharmacy.meditrack.entity.User;
import com.pharmacy.meditrack.exception.BadRequestException;
import com.pharmacy.meditrack.exception.ResourceNotFoundException;
import com.pharmacy.meditrack.repository.BatchRepository;
import com.pharmacy.meditrack.repository.DispensingItemRepository;
import com.pharmacy.meditrack.repository.DispensingTransactionRepository;
import com.pharmacy.meditrack.repository.MedicineRepository;
import com.pharmacy.meditrack.repository.UserRepository;

@Service
public class DispensingService {

    private final DispensingTransactionRepository transactionRepository;
    private final DispensingItemRepository itemRepository;
    private final BatchRepository batchRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public DispensingService(DispensingTransactionRepository transactionRepository,
                             DispensingItemRepository itemRepository,
                             BatchRepository batchRepository,
                             MedicineRepository medicineRepository,
                             UserRepository userRepository,
                             AuditService auditService) {
        this.transactionRepository = transactionRepository;
        this.itemRepository = itemRepository;
        this.batchRepository = batchRepository;
        this.medicineRepository = medicineRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Transactional
    public DispensingTransaction createTransaction(DispensingTransaction transaction) {
        if (transaction.getPharmacist() == null || transaction.getPharmacist().getId() == null) {
            throw new BadRequestException("Pharmacist is required.");
        }

        User pharmacist = userRepository.findById(transaction.getPharmacist().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Pharmacist not found."));
        transaction.setPharmacist(pharmacist);

        if (transaction.getItems() == null || transaction.getItems().isEmpty()) {
            throw new BadRequestException("At least one dispensing item is required.");
        }

        List<DispensingItem> savedItems = new ArrayList<>();
        int totalQuantity = 0;

        for (DispensingItem item : transaction.getItems()) {
            if (item.getMedicine() == null || item.getMedicine().getId() == null) {
                throw new BadRequestException("Medicine is required in each dispensing item.");
            }

            Medicine medicine = medicineRepository.findById(item.getMedicine().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + item.getMedicine().getId()));
            item.setMedicine(medicine);

            if (item.getBatch() == null || item.getBatch().getId() == null) {
                throw new BadRequestException("Batch is required for medicine: " + medicine.getName());
            }

            Batch batch = batchRepository.findById(item.getBatch().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Batch not found for medicine: " + medicine.getName()));
            item.setBatch(batch);

            if (item.getQuantity() <= 0) {
                throw new BadRequestException("Dispense quantity must be greater than zero.");
            }

            if (batch.getQuantity() < item.getQuantity()) {
                throw new BadRequestException("Insufficient stock for batch " + batch.getBatchNumber());
            }

            batch.setQuantity(batch.getQuantity() - item.getQuantity());
            batchRepository.save(batch);

            item.setTransaction(transaction);
            item.setExpiryDateAtDispense(batch.getExpiryDate());
            totalQuantity += item.getQuantity();
            savedItems.add(item);
        }

        transaction.setItems(savedItems);
        transaction.setTotalItems(savedItems.size());
        transaction.setTotalQuantity(totalQuantity);
        transaction.setTransactionDate(LocalDateTime.now());

        DispensingTransaction savedTransaction = transactionRepository.save(transaction);
        auditService.record(pharmacist, "DISPENSING_COMPLETED", "DispensingTransaction", String.valueOf(savedTransaction.getId()),
            "Dispensed " + savedTransaction.getTotalQuantity() + " units for " + savedTransaction.getCustomerName());
        return savedTransaction;
    }

    @Transactional(readOnly = true)
    public List<DispensingTransaction> getAll() {
        List<DispensingTransaction> transactions = transactionRepository.findAllByOrderByTransactionDateDesc();
        transactions.forEach(this::initializeForResponse);
        return transactions;
    }

    @Transactional(readOnly = true)
    public DispensingTransaction getById(Long id) {
        DispensingTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Dispensing transaction not found with id: " + id));
        initializeForResponse(transaction);
        return transaction;
    }

    private void initializeForResponse(DispensingTransaction transaction) {
        if (transaction.getPharmacist() != null) {
            transaction.getPharmacist().getName();
        }
        transaction.getItems().forEach(item -> {
            if (item.getMedicine() != null) {
                item.getMedicine().getName();
            }
            if (item.getBatch() != null) {
                item.getBatch().getBatchNumber();
            }
        });
    }
}
