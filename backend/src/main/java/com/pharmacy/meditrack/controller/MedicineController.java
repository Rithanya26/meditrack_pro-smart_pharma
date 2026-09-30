package com.pharmacy.meditrack.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pharmacy.meditrack.entity.Medicine;
import com.pharmacy.meditrack.service.MedicineService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @GetMapping("/medicines")
    public ResponseEntity<List<Medicine>> getMedicines() {
        return ResponseEntity.ok(medicineService.getAll());
    }

    @GetMapping("/medicines/{id}")
    public ResponseEntity<Medicine> getMedicineById(@PathVariable Long id) {
        return ResponseEntity.ok(medicineService.getById(id));
    }

    @GetMapping("/medicines/expiring-soon")
    public ResponseEntity<List<Medicine>> getExpiringSoon(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(medicineService.getExpiringSoon(days));
    }

    @PostMapping("/medicines")
    public ResponseEntity<Medicine> createMedicine(@Valid @RequestBody Medicine medicine) {
        return ResponseEntity.status(HttpStatus.CREATED).body(medicineService.create(medicine));
    }

    @PutMapping("/medicines/{id}")
    public ResponseEntity<Medicine> updateMedicine(@PathVariable Long id, @Valid @RequestBody Medicine medicine) {
        return ResponseEntity.ok(medicineService.update(id, medicine));
    }

    @PatchMapping("/medicines/{id}/toggle-status")
    public ResponseEntity<Medicine> toggleStatus(@PathVariable Long id) {
        Medicine existing = medicineService.getById(id);
        existing.setStatus(existing.getStatus() == com.pharmacy.meditrack.enums.MedicineStatus.ACTIVE
                ? com.pharmacy.meditrack.enums.MedicineStatus.INACTIVE
                : com.pharmacy.meditrack.enums.MedicineStatus.ACTIVE);
        return ResponseEntity.ok(medicineService.update(id, existing));
    }
}
