package com.pharmacy.meditrack.controller;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pharmacy.meditrack.entity.DispensingTransaction;
import com.pharmacy.meditrack.service.DispensingService;
import com.pharmacy.meditrack.service.DispensingHistoryInitializer;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class DispensingController {

    private final DispensingService dispensingService;
    private final DispensingHistoryInitializer historyInitializer;

    public DispensingController(DispensingService dispensingService,
                                DispensingHistoryInitializer historyInitializer) {
        this.dispensingService = dispensingService;
        this.historyInitializer = historyInitializer;
    }

    @PostMapping("/dispensing/ensure-history")
    public ResponseEntity<Map<String, Object>> ensureHistory() {
        int created = historyInitializer.ensureHistoricalRecords();
        return ResponseEntity.ok(Map.of(
            "status", "SUCCESS",
            "message", "Historical dispensing records verified across 6+ months",
            "createdRecords", created
        ));
    }

    @GetMapping("/dispensing")
    public ResponseEntity<List<Map<String, Object>>> getAllTransactions() {
        return ResponseEntity.ok(dispensingService.getAll().stream().map(this::toResponse).toList());
    }

    @GetMapping("/dispensing/{id}")
    public ResponseEntity<Map<String, Object>> getTransactionById(@PathVariable Long id) {
        return ResponseEntity.ok(toResponse(dispensingService.getById(id)));
    }

    @PostMapping("/dispensing")
    public ResponseEntity<Map<String, Object>> createTransaction(@Valid @RequestBody DispensingTransaction transaction) {
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(dispensingService.createTransaction(transaction)));
    }

    private Map<String, Object> toResponse(DispensingTransaction transaction) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", transaction.getId());
        response.put("customerName", transaction.getCustomerName());
        response.put("customerPhone", transaction.getCustomerPhone());
        response.put("patientId", transaction.getPatientId());
        response.put("referenceNumber", transaction.getReferenceNumber());
        response.put("transactionDate", transaction.getTransactionDate());
        response.put("totalItems", transaction.getTotalItems());
        response.put("totalQuantity", transaction.getTotalQuantity());
        response.put("status", transaction.getStatus());
        if (transaction.getPharmacist() != null) {
            response.put("pharmacist", Map.of("id", transaction.getPharmacist().getId(), "name", transaction.getPharmacist().getName()));
        }
        response.put("items", transaction.getItems().stream().map(item -> {
            Map<String, Object> itemResponse = new LinkedHashMap<>();
            itemResponse.put("id", item.getId());
            itemResponse.put("quantity", item.getQuantity());
            itemResponse.put("expiryDateAtDispense", item.getExpiryDateAtDispense());
            if (item.getMedicine() != null) {
                Map<String, Object> medMap = new LinkedHashMap<>();
                medMap.put("id", item.getMedicine().getId());
                medMap.put("name", item.getMedicine().getName() != null ? item.getMedicine().getName() : "");
                medMap.put("brandName", item.getMedicine().getBrandName() != null ? item.getMedicine().getBrandName() : item.getMedicine().getName());
                medMap.put("genericMedicine", item.getMedicine().getGenericMedicine() != null ? item.getMedicine().getGenericMedicine() : "");
                medMap.put("genericName", item.getMedicine().getGenericMedicine() != null ? item.getMedicine().getGenericMedicine() : "");
                medMap.put("strength", item.getMedicine().getStrength() != null ? item.getMedicine().getStrength() : "");
                medMap.put("dosageForm", item.getMedicine().getDosageForm() != null ? item.getMedicine().getDosageForm() : "");
                itemResponse.put("medicine", medMap);
            }
            if (item.getBatch() != null) {
                Map<String, Object> batchMap = new LinkedHashMap<>();
                batchMap.put("id", item.getBatch().getId());
                batchMap.put("batchNumber", item.getBatch().getBatchNumber() != null ? item.getBatch().getBatchNumber() : "");
                batchMap.put("expiryDate", item.getBatch().getExpiryDate());
                itemResponse.put("batch", batchMap);
            }
            return itemResponse;
        }).collect(Collectors.toList()));
        return response;
    }
}
