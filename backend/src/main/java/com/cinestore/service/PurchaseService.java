package com.cinestore.service;

import com.cinestore.dto.MovieEventDto;
import com.cinestore.dto.PurchaseRequest;
import com.cinestore.entity.Movie;
import com.cinestore.entity.Purchase;
import com.cinestore.repository.MovieRepository;
import com.cinestore.repository.PurchaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class PurchaseService {

    private final MovieRepository movieRepository;
    private final PurchaseRepository purchaseRepository;
    private final NotificationService notificationService;

    public PurchaseService(MovieRepository movieRepository,
                           PurchaseRepository purchaseRepository,
                           NotificationService notificationService) {
        this.movieRepository = movieRepository;
        this.purchaseRepository = purchaseRepository;
        this.notificationService = notificationService;
    }

    /**
     * Traitement atomique sécurisé des achats avec isolation stricte.
     * Garantit qu'en cas d'achats simultanés sur la dernière copie,
     * une seule transaction réussira et les autres seront rejetées sans survente.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<Purchase> processPurchase(PurchaseRequest request, String clientIp, String clientSessionId) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Le panier est vide.");
        }

        List<Purchase> savedPurchases = new ArrayList<>();

        for (PurchaseRequest.CartItemDto item : request.getItems()) {
            Long movieId = item.getMovieId();
            int qty = item.getQuantity() > 0 ? item.getQuantity() : 1;

            Movie movie = movieRepository.findById(movieId)
                    .orElseThrow(() -> new NoSuchElementException("Film introuvable avec l'ID " + movieId));

            // Décrémentation atomique au niveau SQL direct si non déjà réservé lors de la mise au panier
            if (!request.isAlreadyReserved()) {
                int rowsAffected = movieRepository.decrementCopiesAtomically(movieId, qty);
                if (rowsAffected == 0) {
                    throw new IllegalStateException(
                            String.format("Désolé, '%s' n'a plus assez de copies disponibles (demandé: %d, disponible: %d).",
                                    movie.getTitle(), qty, movie.getCopies())
                    );
                }
            }

            // Récupération de l'état rafraîchi du film pour notification
            Movie refreshed = movieRepository.findById(movieId).orElse(movie);

            // Calcul du montant payé
            BigDecimal totalItemPrice = movie.getPrice().multiply(BigDecimal.valueOf(qty));

            // Enregistrement de l'achat (zéro tracking IP) - Fusion si le film a déjà été acheté
            List<Purchase> existingList = (clientSessionId != null && !clientSessionId.isEmpty())
                    ? purchaseRepository.findByMovieIdAndClientSessionId(movieId, clientSessionId)
                    : Collections.emptyList();

            Purchase saved;
            if (!existingList.isEmpty()) {
                Purchase existing = existingList.get(0);
                existing.setQuantity(existing.getQuantity() + qty);
                existing.setPricePaid(existing.getPricePaid().add(totalItemPrice));
                existing.setPurchaseDate(java.time.LocalDateTime.now());
                saved = purchaseRepository.save(existing);
            } else {
                Purchase purchase = new Purchase(
                        movie.getId(),
                        movie.getTitle(),
                        qty,
                        totalItemPrice,
                        "",
                        clientSessionId
                );
                saved = purchaseRepository.save(purchase);
            }
            savedPurchases.add(saved);

            // Diffusion temps réel immédiate à tous les clients connectés
            notificationService.broadcastMovieEvent(new MovieEventDto(
                    "STOCK_CHANGED",
                    refreshed.getId(),
                    refreshed.getTitle(),
                    refreshed.getPrice(),
                    refreshed.getCopies(),
                    String.format("Une copie de '%s' vient d'être achetée ! %d copies restantes.",
                            refreshed.getTitle(), refreshed.getCopies())
            ));
        }

        return savedPurchases;
    }

    public List<Purchase> getPurchasesForClient(String clientIp, String clientSessionId) {
        List<Purchase> purchases = purchaseRepository.findPurchasesByClient(clientIp, clientSessionId);
        if (purchases == null || purchases.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Purchase> grouped = new LinkedHashMap<>();
        for (Purchase p : purchases) {
            if (grouped.containsKey(p.getMovieId())) {
                Purchase existing = grouped.get(p.getMovieId());
                existing.setQuantity(existing.getQuantity() + p.getQuantity());
                existing.setPricePaid(existing.getPricePaid().add(p.getPricePaid()));
                if (p.getPurchaseDate() != null &&
                    (existing.getPurchaseDate() == null || p.getPurchaseDate().isAfter(existing.getPurchaseDate()))) {
                    existing.setPurchaseDate(p.getPurchaseDate());
                }
            } else {
                Purchase copy = new Purchase(
                        p.getMovieId(),
                        p.getMovieTitle(),
                        p.getQuantity(),
                        p.getPricePaid(),
                        p.getClientIp(),
                        p.getClientSessionId()
                );
                copy.setId(p.getId());
                copy.setPurchaseDate(p.getPurchaseDate());
                grouped.put(p.getMovieId(), copy);
            }
        }

        return new ArrayList<>(grouped.values());
    }

    public Map<String, Object> getAdminStatistics() {
        Map<String, Object> stats = new HashMap<>();
        long totalMovies = movieRepository.count();
        long totalSalesCount = purchaseRepository.count();
        BigDecimal totalRevenue = purchaseRepository.sumTotalRevenue();

        stats.put("totalMovies", totalMovies);
        stats.put("totalSalesCount", totalSalesCount);
        stats.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
        return stats;
    }
}
