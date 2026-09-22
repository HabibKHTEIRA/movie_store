package com.cinestore.dto;

import com.cinestore.entity.Movie;
import com.cinestore.entity.Review;

import java.math.BigDecimal;
import java.util.List;

public class MovieDetailDto {
    private Long id;
    private String imdbId;
    private String title;
    private int year;
    private String genres;
    private int runtime;
    private double rating;
    private long numVotes;
    private BigDecimal price;
    private int copies;
    private String posterPath;
    private String description;
    
    // Données communautaires
    private double userRatingAverage;
    private long userReviewCount;
    private boolean hasPurchased;
    private boolean hasReviewed;
    private List<Review> reviews;

    public MovieDetailDto() {}

    public static MovieDetailDto fromMovie(Movie m, double userRatingAverage, long userReviewCount,
                                           boolean hasPurchased, boolean hasReviewed, List<Review> reviews) {
        MovieDetailDto dto = new MovieDetailDto();
        dto.id = m.getId();
        dto.imdbId = m.getImdbId();
        dto.title = m.getTitle();
        dto.year = m.getYear();
        dto.genres = m.getGenres();
        dto.runtime = m.getRuntime();
        dto.rating = m.getRating();
        dto.numVotes = m.getNumVotes();
        dto.price = m.getPrice();
        dto.copies = m.getCopies();
        dto.posterPath = m.getPosterPath();
        dto.description = m.getDescription();
        dto.userRatingAverage = userRatingAverage;
        dto.userReviewCount = userReviewCount;
        dto.hasPurchased = hasPurchased;
        dto.hasReviewed = hasReviewed;
        dto.reviews = reviews;
        return dto;
    }

    public Long getId() { return id; }
    public String getImdbId() { return imdbId; }
    public String getTitle() { return title; }
    public int getYear() { return year; }
    public String getGenres() { return genres; }
    public int getRuntime() { return runtime; }
    public double getRating() { return rating; }
    public long getNumVotes() { return numVotes; }
    public BigDecimal getPrice() { return price; }
    public int getCopies() { return copies; }
    public String getPosterPath() { return posterPath; }
    public String getDescription() { return description; }
    public double getUserRatingAverage() { return userRatingAverage; }
    public long getUserReviewCount() { return userReviewCount; }
    public boolean isHasPurchased() { return hasPurchased; }
    public boolean isHasReviewed() { return hasReviewed; }
    public List<Review> getReviews() { return reviews; }
}
