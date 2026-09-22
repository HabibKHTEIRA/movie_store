package com.cinestore.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews", indexes = {
    @Index(name = "idx_rev_movie", columnList = "movieId"),
    @Index(name = "idx_rev_ip", columnList = "clientIp"),
    @Index(name = "idx_rev_session", columnList = "clientSessionId")
})
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long movieId;

    @Column(nullable = true, length = 64)
    private String clientIp;

    @Column(length = 128)
    private String clientSessionId;

    @Column(nullable = false, length = 64)
    private String authorName;

    @Column(nullable = false)
    private int rating; // 1 à 5 étoiles

    @Column(nullable = false, length = 1000)
    private String comment;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public Review() {}

    public Review(Long movieId, String clientIp, String clientSessionId, String authorName, int rating, String comment) {
        this.movieId = movieId;
        this.clientIp = clientIp;
        this.clientSessionId = clientSessionId;
        this.authorName = authorName;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }

    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }

    public String getClientSessionId() { return clientSessionId; }
    public void setClientSessionId(String clientSessionId) { this.clientSessionId = clientSessionId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
