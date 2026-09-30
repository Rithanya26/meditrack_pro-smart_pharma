package com.pharmacy.meditrack.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pharmacy.meditrack.entity.User;
import com.pharmacy.meditrack.enums.UserRole;
import com.pharmacy.meditrack.enums.UserStatus;
import com.pharmacy.meditrack.exception.BadRequestException;
import com.pharmacy.meditrack.exception.ResourceNotFoundException;
import com.pharmacy.meditrack.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password."));

        if (!user.getPassword().equals(password)) {
            throw new BadRequestException("Invalid email or password.");
        }

        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new BadRequestException("This account has been deactivated. Contact your administrator.");
        }

        return user;
    }

    public List<User> getAll() {
        return userRepository.findAll();
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public List<User> getPharmacists() {
        return userRepository.findByRole(UserRole.PHARMACIST);
    }

    public User createPharmacist(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new BadRequestException("A user with this email already exists.");
        }
        user.setRole(UserRole.PHARMACIST);
        user.setStatus(UserStatus.ACTIVE);
        return userRepository.save(user);
    }

    @Transactional
    public User updatePharmacist(Long id, User updatedUser) {
        User existing = getById(id);
        if (!existing.getEmail().equals(updatedUser.getEmail())
                && userRepository.findByEmail(updatedUser.getEmail()).isPresent()) {
            throw new BadRequestException("A user with this email already exists.");
        }
        existing.setName(updatedUser.getName());
        existing.setEmail(updatedUser.getEmail());
        existing.setPhone(updatedUser.getPhone());
        existing.setStatus(updatedUser.getStatus());
        return userRepository.save(existing);
    }

    @Transactional
    public User toggleStatus(Long id) {
        User user = getById(id);
        user.setStatus(user.getStatus() == UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE);
        return userRepository.save(user);
    }
}
