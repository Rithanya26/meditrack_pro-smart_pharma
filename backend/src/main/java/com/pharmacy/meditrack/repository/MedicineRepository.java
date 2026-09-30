package com.pharmacy.meditrack.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pharmacy.meditrack.entity.Medicine;
import com.pharmacy.meditrack.enums.MedicineStatus;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    Optional<Medicine> findByName(String name);

    List<Medicine> findByStatus(MedicineStatus status);

    boolean existsByNameIgnoreCase(String name);
}
