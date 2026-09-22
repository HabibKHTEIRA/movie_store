package com.cinestore;

import com.cinestore.dto.PurchaseRequest;
import com.cinestore.dto.ReviewRequest;
import com.cinestore.entity.Movie;
import com.cinestore.entity.Purchase;
import com.cinestore.repository.MovieRepository;
import com.cinestore.service.PurchaseService;
import com.cinestore.service.ReviewService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class CinestoreApplicationTests {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private PurchaseService purchaseService;

    @Autowired
    private ReviewService reviewService;

    @Test
    void contextLoadsAndSeedsMovies() {
        long count = movieRepository.count();
        assertTrue(count > 0, "Les films initiaux doivent être chargés en base");
    }

    @Test
    void testAntiOversellingConcurrency() throws InterruptedException {
        // Création d'un film avec exactement 1 seule copie restante
        Movie movie = new Movie("ttTest01", "Last Copy Movie", 2024, "Action", 120,
                8.5, 50000, new BigDecimal("19.99"), 1, "/test.jpg", "Test description");
        movie = movieRepository.save(movie);
        Long movieId = movie.getId();

        int numberOfThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            final int index = i;
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Tous les threads démarrent au même millième de seconde
                    PurchaseRequest req = new PurchaseRequest(List.of(new PurchaseRequest.CartItemDto(movieId, 1)));
                    purchaseService.processPurchase(req, "192.168.1." + index, "session-" + index);
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await();
        startLatch.countDown(); // FEU !
        doneLatch.await();
        executor.shutdown();

        // Exactement 1 client doit avoir réussi à acheter la dernière copie !
        assertEquals(1, successCount.get(), "Exactement une seule transaction doit réussir pour la dernière copie");
        assertEquals(numberOfThreads - 1, failureCount.get(), "Toutes les autres requêtes concurrentes doivent échouer sans survente");

        // Vérification en base : le stock final doit être exactement 0
        Movie finalMovie = movieRepository.findById(movieId).orElseThrow();
        assertEquals(0, finalMovie.getCopies(), "Le stock ne peut jamais être inférieur à 0");
    }

    @Test
    void testAntiSpamReviewsRestrictions() {
        Movie movie = new Movie("ttTestReview", "Reviewable Movie", 2024, "Drama", 110,
                8.0, 40000, new BigDecimal("14.99"), 500, "/rev.jpg", "Desc");
        movie = movieRepository.save(movie);
        Long movieId = movie.getId();

        String clientIp = "10.0.0.42";
        String sessionId = "sess-buyer-42";

        // 1. Tenter de laisser un avis SANS avoir acheté -> SecurityException (403)
        ReviewRequest reviewReq = new ReviewRequest("Hacker", 5, "Super film sans achat !");
        assertThrows(SecurityException.class, () -> {
            reviewService.addReview(movieId, reviewReq, clientIp, sessionId);
        }, "Un non-acheteur ne doit pas pouvoir laisser d'avis");

        // 2. L'utilisateur achète le film
        PurchaseRequest purchaseReq = new PurchaseRequest(List.of(new PurchaseRequest.CartItemDto(movieId, 1)));
        purchaseService.processPurchase(purchaseReq, clientIp, sessionId);

        // 3. L'utilisateur peut maintenant laisser son avis
        ReviewRequest legitimateReview = new ReviewRequest("Habib", 5, "Chef d'oeuvre absolu !");
        assertDoesNotThrow(() -> {
            reviewService.addReview(movieId, legitimateReview, clientIp, sessionId);
        });

        // 4. L'utilisateur tente de laisser un DEUXIÈME avis -> IllegalStateException (409 Conflict)
        ReviewRequest duplicateReview = new ReviewRequest("Habib", 4, "Deuxième avis spam");
        assertThrows(IllegalStateException.class, () -> {
            reviewService.addReview(movieId, duplicateReview, clientIp, sessionId);
        }, "Un utilisateur ne peut pas laisser plus d'un avis pour un même film");
    }
}
