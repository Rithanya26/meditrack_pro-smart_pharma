package com.pharmacy.meditrack.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pharmacy.meditrack.entity.Medicine;
import com.pharmacy.meditrack.entity.ReorderOrder;
import com.pharmacy.meditrack.exception.BadRequestException;
import com.pharmacy.meditrack.exception.ResourceNotFoundException;
import com.pharmacy.meditrack.repository.MedicineRepository;
import com.pharmacy.meditrack.repository.ReorderOrderRepository;

@Service
public class ReorderService {

    private final ReorderOrderRepository reorderOrderRepository;
    private final MedicineRepository medicineRepository;

    public ReorderService(ReorderOrderRepository reorderOrderRepository, MedicineRepository medicineRepository) {
        this.reorderOrderRepository = reorderOrderRepository;
        this.medicineRepository = medicineRepository;
    }

    public List<ReorderOrder> getAllReorders() {
        return reorderOrderRepository.findAll();
    }

    public List<ReorderOrder> getReordersByStatus(String status) {
        return reorderOrderRepository.findByStatus(status.toUpperCase());
    }

    public ReorderOrder getReorderById(Long id) {
        return reorderOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reorder order not found with id: " + id));
    }

    @Transactional
    public ReorderOrder createReorder(ReorderOrder order) {
        if (order.getMedicine() == null || order.getMedicine().getId() == null) {
            throw new BadRequestException("Medicine reference is required for reorder.");
        }
        Medicine medicine = medicineRepository.findById(order.getMedicine().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine not found with id: " + order.getMedicine().getId()));

        order.setMedicine(medicine);
        if (order.getStatus() == null || order.getStatus().isBlank()) {
            order.setStatus("PENDING_APPROVAL");
        }
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        return reorderOrderRepository.save(order);
    }

    @Transactional
    public ReorderOrder approveReorder(Long id, Integer approvedQuantity) {
        ReorderOrder order = getReorderById(id);
        if (approvedQuantity != null && approvedQuantity > 0) {
            order.setApprovedQuantity(approvedQuantity);
        } else if (order.getApprovedQuantity() == null) {
            order.setApprovedQuantity(order.getSuggestedQuantity());
        }
        order.setStatus("ORDERED");
        order.setApprovedDate(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        return reorderOrderRepository.save(order);
    }

    @Transactional
    public ReorderOrder rejectReorder(Long id, String reason) {
        ReorderOrder order = getReorderById(id);
        order.setStatus("REJECTED");
        if (reason != null && !reason.isBlank()) {
            order.setReason(reason);
        }
        order.setUpdatedAt(LocalDateTime.now());
        return reorderOrderRepository.save(order);
    }

    @Transactional
    public ReorderOrder receiveReorder(Long id) {
        ReorderOrder order = getReorderById(id);
        order.setStatus("RECEIVED");
        order.setUpdatedAt(LocalDateTime.now());
        return reorderOrderRepository.save(order);
    }
}
