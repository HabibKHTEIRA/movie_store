package com.cinestore.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class ReviewRequest {

    @NotBlank(message = "Le nom de l'auteur est requis")
    private String authorName;

    @Min(value = 1, message = "La note minimale est 1")
    @Max(value = 5, message = "La note maximale est 5")
    private int rating;

    @NotBlank(message = "Le commentaire ne peut pas être vide")
    private String comment;

    public ReviewRequest() {}

    public ReviewRequest(String authorName, int rating, String comment) {
        this.authorName = authorName;
        this.rating = rating;
        this.comment = comment;
    }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
