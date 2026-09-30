package com.pharmacy.meditrack.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pharmacy.meditrack.entity.Batch;
import com.pharmacy.meditrack.service.BatchService;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final BatchService batchService;

    public InventoryController(BatchService batchService) {
        this.batchService = batchService;
    }

    @PatchMapping("/{id}/adjust")
    public ResponseEntity<Batch> adjustStock(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        int adjustment = ((Number) request.get("adjustment")).intValue();
        String type = String.valueOf(request.getOrDefault("type", "add"));
        return ResponseEntity.ok(batchService.adjustStock(id, adjustment, type));
    }
}