package com.cinestore.dto;

import java.util.List;

public class PurchaseRequest {
    private List<CartItemDto> items;

    public PurchaseRequest() {}

    public PurchaseRequest(List<CartItemDto> items) {
        this.items = items;
    }

    public List<CartItemDto> getItems() { return items; }
    public void setItems(List<CartItemDto> items) { this.items = items; }

    public static class CartItemDto {
        private Long movieId;
        private int quantity;

        public CartItemDto() {}

        public CartItemDto(Long movieId, int quantity) {
            this.movieId = movieId;
            this.quantity = quantity;
        }

        public Long getMovieId() { return movieId; }
        public void setMovieId(Long movieId) { this.movieId = movieId; }

        public int getQuantity() { return quantity; }
        public void setQuantity(int quantity) { this.quantity = quantity; }
    }
}
