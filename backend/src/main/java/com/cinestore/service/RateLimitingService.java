package com.cinestore.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingService.class);

    private final boolean enabled;
    private final int requestsPerMinute;
    private final int maxConcurrentUsers;
    private final long userIdleTimeoutMs;

    // Historique glissant des timestamps de requêtes par client (fenêtre de 60 secondes)
    private final ConcurrentHashMap<String, Deque<Long>> clientRequestLog = new ConcurrentHashMap<>();

    // Suivi des utilisateurs actifs simultanés (clientId -> lastSeenTimestamp)
    private final ConcurrentHashMap<String, Long> activeUsers = new ConcurrentHashMap<>();

    public RateLimitingService(
            @Value("${app.rate-limit.enabled:true}") boolean enabled,
            @Value("${app.rate-limit.requests-per-minute:30}") int requestsPerMinute,
            @Value("${app.rate-limit.max-concurrent-users:10}") int maxConcurrentUsers,
            @Value("${app.rate-limit.user-idle-timeout-minutes:5}") int userIdleTimeoutMinutes) {
        this.enabled = enabled;
        this.requestsPerMinute = requestsPerMinute;
        this.maxConcurrentUsers = maxConcurrentUsers;
        this.userIdleTimeoutMs = userIdleTimeoutMinutes * 60L * 1000L;

        log.info("🛡️ RateLimiting initialisé : actif={}, maxReq/min={}, maxUsers={}, timeoutIdle={}min",
                enabled, requestsPerMinute, maxConcurrentUsers, userIdleTimeoutMinutes);
    }

    public enum AccessStatus {
        ALLOWED,
        RATE_LIMIT_EXCEEDED,
        CONCURRENT_USERS_EXCEEDED
    }

    public static class AccessCheckResult {
        private final AccessStatus status;
        private final int remainingRequests;
        private final int activeUsersCount;

        public AccessCheckResult(AccessStatus status, int remainingRequests, int activeUsersCount) {
            this.status = status;
            this.remainingRequests = remainingRequests;
            this.activeUsersCount = activeUsersCount;
        }

        public AccessStatus getStatus() { return status; }
        public int getRemainingRequests() { return remainingRequests; }
        public int getActiveUsersCount() { return activeUsersCount; }
        public boolean isAllowed() { return status == AccessStatus.ALLOWED; }
    }

    /**
     * Vérifie si un client (identifié par son IP ou UUID frontend) peut effectuer la requête.
     */
    public synchronized AccessCheckResult checkAccess(String clientId) {
        if (!enabled || clientId == null || clientId.isBlank()) {
            return new AccessCheckResult(AccessStatus.ALLOWED, requestsPerMinute, activeUsers.size());
        }

        long now = System.currentTimeMillis();

        // 1. Nettoyage des sessions inactives
        activeUsers.entrySet().removeIf(entry -> (now - entry.getValue()) > userIdleTimeoutMs);

        // 2. Vérification de la capacité d'utilisateurs simultanés (Max 10)
        boolean isAlreadyActive = activeUsers.containsKey(clientId);
        if (!isAlreadyActive) {
            if (activeUsers.size() >= maxConcurrentUsers) {
                log.warn("Capacité maximale atteinte ({} / {} utilisateurs actifs). Refus pour : {}",
                        activeUsers.size(), maxConcurrentUsers, clientId);
                return new AccessCheckResult(AccessStatus.CONCURRENT_USERS_EXCEEDED, 0, activeUsers.size());
            }
            activeUsers.put(clientId, now);
        } else {
            activeUsers.put(clientId, now); // Actualisation du timestamp de dernière activité
        }

        // 3. Vérification du débit par minute (Max 30 req/min)
        Deque<Long> timestamps = clientRequestLog.computeIfAbsent(clientId, k -> new ArrayDeque<>());
        long windowStart = now - 60_000L;

        // Retirer les requêtes de plus de 60 secondes
        while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= requestsPerMinute) {
            log.warn("Rate limit dépassé ({} req/min) pour le client : {}", timestamps.size(), clientId);
            return new AccessCheckResult(AccessStatus.RATE_LIMIT_EXCEEDED, 0, activeUsers.size());
        }

        // Enregistrer la requête courante
        timestamps.addLast(now);
        int remaining = Math.max(0, requestsPerMinute - timestamps.size());

        return new AccessCheckResult(AccessStatus.ALLOWED, remaining, activeUsers.size());
    }

    public boolean isEnabled() {
        return enabled;
    }

    public int getRequestsPerMinute() {
        return requestsPerMinute;
    }

    public int getMaxConcurrentUsers() {
        return maxConcurrentUsers;
    }

    public int getActiveUsersCount() {
        return activeUsers.size();
    }
}
