package com.pharmacy.meditrack.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pharmacy.meditrack.entity.User;
import com.pharmacy.meditrack.enums.UserRole;
import com.pharmacy.meditrack.enums.UserStatus;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    List<User> findByRole(UserRole role);

    List<User> findByStatus(UserStatus status);
}
