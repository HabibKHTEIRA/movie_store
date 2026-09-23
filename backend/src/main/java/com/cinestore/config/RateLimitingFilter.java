package com.cinestore.config;

import com.cinestore.service.RateLimitingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;
    private final ObjectMapper objectMapper;

    public RateLimitingFilter(RateLimitingService rateLimitingService, ObjectMapper objectMapper) {
        this.rateLimitingService = rateLimitingService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Toujours laisser passer les requêtes préliminaires CORS (OPTIONS)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Toujours laisser passer la console H2 locale et les endpoints de swagger s'ils existent
        String path = request.getRequestURI();
        if (path.startsWith("/h2-console") || path.startsWith("/favicon.ico")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Identifier le client (UUID frontend en priorité, sinon IP réelle)
        String clientId = resolveClientId(request);

        RateLimitingService.AccessCheckResult result = rateLimitingService.checkAccess(clientId);

        if (result.isAllowed()) {
            // Ajout des en-têtes informatifs sur les quotas restants
            response.setHeader("X-RateLimit-Limit", String.valueOf(rateLimitingService.getRequestsPerMinute()));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemainingRequests()));
            response.setHeader("X-Active-Users", result.getActiveUsersCount() + "/" + rateLimitingService.getMaxConcurrentUsers());

            filterChain.doFilter(request, response);
            return;
        }

        // 4. Gestion des refus
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        if (result.getStatus() == RateLimitingService.AccessStatus.RATE_LIMIT_EXCEEDED) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value()); // HTTP 429
            response.setHeader("Retry-After", "60");

            Map<String, Object> errorBody = Map.of(
                    "status", 429,
                    "error", "TOO_MANY_REQUESTS",
                    "message", "Trop de requêtes. La limite est fixée à " + rateLimitingService.getRequestsPerMinute() + " requêtes par minute pour ce portfolio.",
                    "retryAfterSeconds", 60
            );
            response.getWriter().write(objectMapper.writeValueAsString(errorBody));
        } else if (result.getStatus() == RateLimitingService.AccessStatus.CONCURRENT_USERS_EXCEEDED) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value()); // HTTP 429
            response.setHeader("Retry-After", "30");

            Map<String, Object> errorBody = Map.of(
                    "status", 429,
                    "error", "MAX_CONCURRENT_USERS_REACHED",
                    "message", "Le serveur a atteint sa capacité maximale de démonstration (" + rateLimitingService.getMaxConcurrentUsers() + " utilisateurs simultanés). Veuillez patienter quelques instants.",
                    "retryAfterSeconds", 30
            );
            response.getWriter().write(objectMapper.writeValueAsString(errorBody));
        }
    }

    private String resolveClientId(HttpServletRequest request) {
        String clientUuid = request.getHeader("X-Client-Id");
        if (clientUuid != null && !clientUuid.isBlank()) {
            return clientUuid.trim();
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            // Prendre la première IP de la chaîne si passage par des proxies (Vercel, Cloudflare, Northflank)
            return xForwardedFor.split(",")[0].trim();
        }

        return request.getRemoteAddr();
    }
}
