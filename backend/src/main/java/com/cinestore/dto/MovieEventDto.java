package com.cinestore.dto;

import java.math.BigDecimal;

public class MovieEventDto {
    private String type; // STOCK_CHANGED, PRICE_CHANGED, MOVIE_UPDATED, NEW_MOVIE
    private Long movieId;
    private String title;
    private BigDecimal price;
    private int copies;
    private String message;

    public MovieEventDto() {}

    public MovieEventDto(String type, Long movieId, String title, BigDecimal price, int copies, String message) {
        this.type = type;
        this.movieId = movieId;
        this.title = title;
        this.price = price;
        this.copies = copies;
        this.message = message;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Long getMovieId() { return movieId; }
    public void setMovieId(Long movieId) { this.movieId = movieId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public int getCopies() { return copies; }
    public void setCopies(int copies) { this.copies = copies; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
