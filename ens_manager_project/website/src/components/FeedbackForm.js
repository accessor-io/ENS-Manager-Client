import React, { useState } from "react";

const FeedbackForm = () => {
  const [feedback, setFeedback] = useState("");

  const submitFeedback = () => {
    // Send feedback to your backend or a third-party service
    fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feedback }),
    })
      .then(() => alert("Thank you for your feedback!"))
      .catch((err) => console.error(err));
  };

  return (
    <div>
      <h3>We Value Your Feedback</h3>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Share your thoughts..."
      />
      <button onClick={submitFeedback}>Submit</button>
    </div>
  );
};

export default FeedbackForm;