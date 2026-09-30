package com.pharmacy.meditrack.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pharmacy.meditrack.entity.DispensingItem;
import com.pharmacy.meditrack.entity.Medicine;

public interface DispensingItemRepository extends JpaRepository<DispensingItem, Long> {

    List<DispensingItem> findByMedicine(Medicine medicine);
}
