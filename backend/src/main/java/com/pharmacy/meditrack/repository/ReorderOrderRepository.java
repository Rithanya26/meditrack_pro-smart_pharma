package com.pharmacy.meditrack.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pharmacy.meditrack.entity.ReorderOrder;

@Repository
public interface ReorderOrderRepository extends JpaRepository<ReorderOrder, Long> {

    List<ReorderOrder> findByStatus(String status);

    Optional<ReorderOrder> findTopByMedicineIdOrderByCreatedAtDesc(Long medicineId);

    List<ReorderOrder> findByMedicineId(Long medicineId);
}
