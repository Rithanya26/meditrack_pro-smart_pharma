package com.pharmacy.meditrack.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.pharmacy.meditrack.entity.AuditLog;
import com.pharmacy.meditrack.entity.User;
import com.pharmacy.meditrack.repository.AuditLogRepository;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void record(User user, String action, String entity, String entityId, String description) {
        AuditLog log = new AuditLog();
        log.setUserId(user != null ? user.getId() : null);
        log.setUserName(user != null ? user.getName() : "System");
        log.setRole(user != null ? user.getRole() : null);
        log.setAction(action);
        log.setEntity(entity);
        log.setEntityId(entityId);
        log.setDescription(description);
        auditLogRepository.save(log);
    }

    public List<AuditLog> getAll() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc();
    }
}
