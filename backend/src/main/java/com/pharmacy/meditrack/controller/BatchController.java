package com.pharmacy.meditrack.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pharmacy.meditrack.entity.Batch;
import com.pharmacy.meditrack.service.BatchService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @GetMapping("/batches")
    public ResponseEntity<List<Batch>> getBatches() {
        return ResponseEntity.ok(batchService.getAll());
    }

    @GetMapping("/batches/{id}")
    public ResponseEntity<Batch> getBatchById(@PathVariable Long id) {
        return ResponseEntity.ok(batchService.getById(id));
    }

    @GetMapping("/medicines/{medicineId}/batches")
    public ResponseEntity<List<Batch>> getBatchesByMedicine(@PathVariable Long medicineId) {
        return ResponseEntity.ok(batchService.getAll().stream()
                .filter(batch -> batch.getMedicine() != null && batch.getMedicine().getId().equals(medicineId))
                .toList());
    }

    @PostMapping("/batches")
    public ResponseEntity<Batch> createBatch(@Valid @RequestBody Batch batch) {
        return ResponseEntity.status(HttpStatus.CREATED).body(batchService.create(batch));
    }

    @PutMapping("/batches/{id}")
    public ResponseEntity<Batch> updateBatch(@PathVariable Long id, @Valid @RequestBody Batch batch) {
        return ResponseEntity.ok(batchService.update(id, batch));
    }

    @DeleteMapping("/batches/{id}")
    public ResponseEntity<Void> deleteBatch(@PathVariable Long id) {
        batchService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
