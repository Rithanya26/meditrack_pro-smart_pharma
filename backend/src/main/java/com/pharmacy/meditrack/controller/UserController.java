package com.pharmacy.meditrack.controller;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pharmacy.meditrack.entity.User;
import com.pharmacy.meditrack.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/pharmacists")
    public ResponseEntity<List<Map<String, Object>>> getPharmacists() {
        return ResponseEntity.ok(userService.getPharmacists().stream().map(this::toResponse).toList());
    }

    @PostMapping("/pharmacists")
    public ResponseEntity<User> createPharmacist(@Valid @RequestBody User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createPharmacist(user));
    }

    @PutMapping("/pharmacists/{id}")
    public ResponseEntity<User> updatePharmacist(@PathVariable Long id, @RequestBody User user) {
        return ResponseEntity.ok(userService.updatePharmacist(id, user));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<User> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleStatus(id));
    }

    private Map<String, Object> toResponse(User user) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhone());
        response.put("role", user.getRole());
        response.put("status", user.getStatus());
        response.put("createdAt", user.getCreatedAt());
        return response;
    }
}