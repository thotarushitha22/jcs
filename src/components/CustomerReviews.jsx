import { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import "./CustomerReviews.css";

export default function CustomerReviews() {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      author: "Rahul Sharma",
      rating: 5,
      date: "May 12, 2026",
      comment: "Amazing build quality and fast delivery! Highly recommended.",
      verified: true,
    },
    {
      id: 2,
      author: "Priya Patel",
      rating: 4,
      date: "May 10, 2026",
      comment: "Very good product, works as expected. Packaging could be slightly better.",
      verified: true,
    },
  ]);

  const [newReview, setNewReview] = useState({ author: "", comment: "", rating: 5 });
  const [showForm, setShowForm] = useState(false);

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

    setReviews([reviewToAdd, ...reviews]);
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

      {/* Review Submission Form */}
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

      {/* Reviews List */}
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