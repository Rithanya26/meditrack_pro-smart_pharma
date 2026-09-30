package com.pharmacy.meditrack.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pharmacy.meditrack.entity.Batch;
import com.pharmacy.meditrack.entity.Medicine;

public interface BatchRepository extends JpaRepository<Batch, Long> {

    List<Batch> findByMedicineOrderByExpiryDateAsc(Medicine medicine);

    List<Batch> findByMedicineIdOrderByExpiryDateAsc(Long medicineId);

    Optional<Batch> findByBatchNumber(String batchNumber);
}
