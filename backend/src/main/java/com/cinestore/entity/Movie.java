package com.cinestore.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "movies", indexes = {
    @Index(name = "idx_movie_imdb", columnList = "imdbId"),
    @Index(name = "idx_movie_year", columnList = "release_year"),
    @Index(name = "idx_movie_rating", columnList = "rating")
})
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String imdbId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "release_year")
    private int year;

    @Column(length = 255)
    private String genres;

    private int runtime;

    private double rating;

    private long numVotes;

    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private int copies;

    @Column(length = 255)
    private String posterPath;

    @Column(length = 1000)
    private String description;

    @Version
    private Long version;

    public Movie() {}

    public Movie(String imdbId, String title, int year, String genres, int runtime,
                 double rating, long numVotes, BigDecimal price, int copies,
                 String posterPath, String description) {
        this.imdbId = imdbId;
        this.title = title;
        this.year = year;
        this.genres = genres;
        this.runtime = runtime;
        this.rating = rating;
        this.numVotes = numVotes;
        this.price = price;
        this.copies = copies;
        this.posterPath = posterPath;
        this.description = description;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getImdbId() { return imdbId; }
    public void setImdbId(String imdbId) { this.imdbId = imdbId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public String getGenres() { return genres; }
    public void setGenres(String genres) { this.genres = genres; }

    public int getRuntime() { return runtime; }
    public void setRuntime(int runtime) { this.runtime = runtime; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public long getNumVotes() { return numVotes; }
    public void setNumVotes(long numVotes) { this.numVotes = numVotes; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public int getCopies() { return copies; }
    public void setCopies(int copies) { this.copies = copies; }

    public String getPosterPath() { return posterPath; }
    public void setPosterPath(String posterPath) { this.posterPath = posterPath; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
