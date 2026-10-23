package com.pharmacy.meditrack.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pharmacy.meditrack.service.ChatbotService;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> query(@RequestBody Map<String, String> payload) {
        String query = payload.getOrDefault("query", "");
        String userRole = payload.getOrDefault("role", "pharmacist");
        String userName = payload.getOrDefault("name", "User");

        Map<String, Object> result = chatbotService.processQuery(query, userRole, userName);
        return ResponseEntity.ok(result);
    }
}
