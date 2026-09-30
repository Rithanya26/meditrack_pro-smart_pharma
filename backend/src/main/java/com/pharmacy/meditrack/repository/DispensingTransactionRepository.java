package com.pharmacy.meditrack.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pharmacy.meditrack.entity.DispensingTransaction;
import com.pharmacy.meditrack.entity.User;

public interface DispensingTransactionRepository extends JpaRepository<DispensingTransaction, Long> {

    List<DispensingTransaction> findByPharmacistOrderByTransactionDateDesc(User pharmacist);

    List<DispensingTransaction> findAllByOrderByTransactionDateDesc();
}
