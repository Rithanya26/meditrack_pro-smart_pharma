package com.pharmacy.meditrack.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pharmacy.meditrack.dto.AuthRequest;
import com.pharmacy.meditrack.dto.LoginResponse;
import com.pharmacy.meditrack.entity.User;
import com.pharmacy.meditrack.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/auth/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody AuthRequest request) {
        User user = userService.login(request.getEmail(), request.getPassword());
        String token = "jwt-token-" + user.getId() + "-" + System.currentTimeMillis();
        return ResponseEntity.ok(new LoginResponse(user, token));
    }
}
