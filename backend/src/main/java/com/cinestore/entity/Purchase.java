package com.cinestore.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchases", indexes = {
    @Index(name = "idx_purch_movie", columnList = "movieId"),
    @Index(name = "idx_purch_ip", columnList = "clientIp"),
    @Index(name = "idx_purch_session", columnList = "clientSessionId")
})
public class Purchase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long movieId;

    @Column(nullable = false)
    private String movieTitle;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal pricePaid;

    @Column(nullable = true, length = 64)
    private String clientIp;

    @Column(length = 128)
    private String clientSessionId;

    @Column(nullable = false)
    private LocalDateTime purchaseDate;

    public Purchase() {}

    public Purchase(Long movieId, String movieTitle, int quantity, BigDecimal pricePaid,
                    String clientIp, String clientSessionId) {
        this.movieId = movieId;
        this.movieTitle = movieTitle;
        this.quantity = quantity;
        this.pricePaid = pricePaid;
        this.clientIp = clientIp;
        this.clientSessionId = clientSessionId;
        this.purchaseDate = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }

    public String getMovieTitle() { return movieTitle; }
    public void setMovieTitle(String movieTitle) { this.movieTitle = movieTitle; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getPricePaid() { return pricePaid; }
    public void setPricePaid(BigDecimal pricePaid) { this.pricePaid = pricePaid; }

    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }

    public String getClientSessionId() { return clientSessionId; }
    public void setClientSessionId(String clientSessionId) { this.clientSessionId = clientSessionId; }

    public LocalDateTime getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDateTime purchaseDate) { this.purchaseDate = purchaseDate; }
}
