export interface Movie {
  id: number;
  imdbId: string;
  title: string;
  year: number;
  genres: string;
  runtime: number;
  rating: number;
  numVotes: number;
  price: number;
  copies: number;
  posterPath: string;
  description: string;
}

export interface Review {
  id: number;
  movieId: number;
  clientIp: string;
  clientSessionId?: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface MovieDetail extends Movie {
  userRatingAverage: number;
  userReviewCount: number;
  hasPurchased: boolean;
  hasReviewed: boolean;
  reviews: Review[];
}

export interface Purchase {
  id: number;
  movieId: number;
  movieTitle: string;
  quantity: number;
  pricePaid: number;
  clientIp: string;
  purchaseDate: string;
}

export interface CartItem {
  movie: Movie;
  quantity: number;
}

export interface MovieEvent {
  type: string;
  movieId: number;
  title: string;
  price: number;
  copies: number;
  message: string;
}

export interface MoviePageResponse {
  content: Movie[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AdminStats {
  totalMovies: number;
  totalSalesCount: number;
  totalRevenue: number;
}
