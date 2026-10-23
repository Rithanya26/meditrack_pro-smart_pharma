package com.pharmacy.meditrack.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pharmacy.meditrack.entity.ReorderOrder;
import com.pharmacy.meditrack.service.ReorderService;

@RestController
@RequestMapping("/api/reorders")
public class ReorderController {

    private final ReorderService reorderService;

    public ReorderController(ReorderService reorderService) {
        this.reorderService = reorderService;
    }

    @GetMapping
    public ResponseEntity<List<ReorderOrder>> getAllReorders(@RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(reorderService.getReordersByStatus(status));
        }
        return ResponseEntity.ok(reorderService.getAllReorders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReorderOrder> getReorderById(@PathVariable Long id) {
        return ResponseEntity.ok(reorderService.getReorderById(id));
    }

    @PostMapping
    public ResponseEntity<ReorderOrder> createReorder(@RequestBody ReorderOrder order) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reorderService.createReorder(order));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ReorderOrder> approveReorder(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        Integer approvedQuantity = null;
        if (body != null && body.containsKey("approvedQuantity")) {
            Object val = body.get("approvedQuantity");
            if (val instanceof Number) {
                approvedQuantity = ((Number) val).intValue();
            } else if (val instanceof String) {
                try {
                    approvedQuantity = Integer.parseInt((String) val);
                } catch (NumberFormatException ignored) {}
            }
        }
        return ResponseEntity.ok(reorderService.approveReorder(id, approvedQuantity));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ReorderOrder> rejectReorder(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ResponseEntity.ok(reorderService.rejectReorder(id, reason));
    }

    @PutMapping("/{id}/receive")
    public ResponseEntity<ReorderOrder> receiveReorder(@PathVariable Long id) {
        return ResponseEntity.ok(reorderService.receiveReorder(id));
    }
}
