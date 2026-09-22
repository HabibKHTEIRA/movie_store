package com.cinestore.controller;

import com.cinestore.dto.PurchaseRequest;
import com.cinestore.entity.Purchase;
import com.cinestore.service.PurchaseService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    private final PurchaseService purchaseService;

    public PurchaseController(PurchaseService purchaseService) {
        this.purchaseService = purchaseService;
    }

    @PostMapping
    public ResponseEntity<?> checkout(
            @RequestBody PurchaseRequest purchaseRequest,
            @RequestHeader(value = "X-Client-Id", required = false) String clientId,
            HttpServletRequest request
    ) {
        try {
            List<Purchase> purchases = purchaseService.processPurchase(purchaseRequest, null, clientId);
            return ResponseEntity.status(HttpStatus.CREATED).body(purchases);
        } catch (IllegalStateException e) {
            // Rupture de stock ou stock insuffisant
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "error", "STOCK_UNAVAILABLE",
                    "message", e.getMessage()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "SERVER_ERROR",
                    "message", "Une erreur est survenue lors de l'achat : " + e.getMessage()
            ));
        }
    }

    @GetMapping("/my-purchases")
    public ResponseEntity<List<Purchase>> getMyPurchases(
            @RequestHeader(value = "X-Client-Id", required = false) String clientId
    ) {
        return ResponseEntity.ok(purchaseService.getPurchasesForClient(null, clientId));
    }
}
