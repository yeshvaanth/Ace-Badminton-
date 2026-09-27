import { useEffect, useState } from 'react';
import api from '../api/axios.js';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/bookings/my')
      .then((res) => setBookings(res.data.bookings))
      .catch(() => setError('Could not load your bookings'));
  }, []);

  return (
    <div className="page">
      <h2>My Bookings</h2>
      {error && <p className="error-text">{error}</p>}
      {bookings.map((b) => (
        <div key={b._id} className="booking-item">
          <p><strong>{b.court.name}</strong> — {b.date}</p>
          <p>{b.slotTimes.join(', ')} ({b.durationHours}hr) — ₹{b.totalPrice}</p>
          <p>Status: <span className={`status-pill ${b.status}`}>{b.status}</span></p>
        </div>
      ))}
    </div>
  );
}

export default MyBookings;