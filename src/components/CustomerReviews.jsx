import { useState, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import "./CustomerReviews.css";

export default function CustomerReviews({ productId }) {
  const storageKey = `jcs_reviews_${productId}`;

  // Load initial reviews from localStorage or default list
  const [reviews, setReviews] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback if parsing fails
      }
    }
    return [
      {
        id: 1,
        author: "Rahul Sharma",
        rating: 5,
        date: "May 12, 2026",
        comment: "Amazing build quality and fast delivery! Highly recommended.",
        verified: true,
      },
    ];
  });

  const [newReview, setNewReview] = useState({ author: "", comment: "", rating: 5 });
  const [showForm, setShowForm] = useState(false);

  // Save to localStorage whenever reviews change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(reviews));
  }, [reviews, storageKey]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newReview.author || !newReview.comment) return;

    const reviewToAdd = {
      id: Date.now(),
      author: newReview.author,
      rating: Number(newReview.rating),
      date: new Date().toLocaleDateString(),
      comment: newReview.comment,
      verified: true,
    };

    const updatedReviews = [reviewToAdd, ...reviews];
    setReviews(updatedReviews);
    
    setNewReview({ author: "", comment: "", rating: 5 });
    setShowForm(false);
  };

  return (
    <div className="customer-reviews-section">
      <div className="reviews-header">
        <h3>Customer Reviews</h3>
        <button className="write-review-toggle-btn" onClick={() => setShowForm(!showForm)}>
          <MessageSquare size={16} />
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your Name"
            value={newReview.author}
            onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
            required
          />
          <select
            value={newReview.rating}
            onChange={(e) => setNewReview({ ...newReview, rating: e.target.value })}
          >
            <option value="5">5 Stars - Excellent</option>
            <option value="4">4 Stars - Good</option>
            <option value="3">3 Stars - Average</option>
            <option value="2">2 Stars - Poor</option>
            <option value="1">1 Star - Terrible</option>
          </select>
          <textarea
            placeholder="Write your review here..."
            value={newReview.comment}
            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
            rows="3"
            required
          ></textarea>
          <button type="submit" className="submit-review-btn">Submit Review</button>
        </form>
      )}

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="review-card">
              <div className="review-top-row">
                <strong>{rev.author}</strong>
                <span className="review-date">{rev.date}</span>
              </div>

              <div className="review-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < rev.rating ? "#f59e0b" : "none"}
                    color={i < rev.rating ? "#f59e0b" : "#d1d5db"}
                  />
                ))}
              </div>

              <p className="review-text">{rev.comment}</p>

              {rev.verified && (
                <span className="verified-badge">✓ Verified Buyer</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}