import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

function Booking() {
  const { courtId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (date) {
      api.get(`/bookings/availability?courtId=${courtId}&date=${date}`)
        .then((res) => setSlots(res.data.slots))
        .catch(() => setMessage('Could not load availability'));
    }
  }, [date, courtId]);

  async function handleBookAndPay() {
    if (!user) {
      navigate('/login');
      return;
    }
    setMessage('');
    try {
      const bookingRes = await api.post('/bookings', {
        courtId,
        date,
        startTime: selectedTime,
        durationHours: duration,
      });
      const bookingId = bookingRes.data.booking._id;

      await api.post(`/bookings/${bookingId}/pay`);
      const mockRes = await api.post(`/bookings/${bookingId}/mock-pay`);
      const { paymentId, signature } = mockRes.data;

      const verifyRes = await api.post(`/bookings/${bookingId}/verify`, { paymentId, signature });

      setMessage(`Booking confirmed! Status: ${verifyRes.data.booking.status}`);
      setTimeout(() => navigate('/my-bookings'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Booking failed');
    }
  }

  return (
    <div className="page">
      <h2>Book a Court</h2>
      {message && <p className="status-message">{message}</p>}

      <div className="date-row">
        <label>Date:</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {slots.length > 0 && (
        <div className="slot-grid">
          {slots.map((slot) => (
            <button
              key={slot.time}
              disabled={slot.status === 'booked'}
              onClick={() => setSelectedTime(slot.time)}
              className={`slot-btn ${slot.status === 'booked' ? 'booked' : ''} ${selectedTime === slot.time ? 'selected' : ''}`}
            >
              {slot.time}
            </button>
          ))}
        </div>
      )}

      <div className="duration-row">
        <label>
          <input type="radio" checked={duration === 1} onChange={() => setDuration(1)} /> 1 hour
        </label>
        <label>
          <input type="radio" checked={duration === 2} onChange={() => setDuration(2)} /> 2 hours
        </label>
      </div>

      <button className="btn-primary" onClick={handleBookAndPay} disabled={!selectedTime}>
        Book and pay
      </button>
    </div>
  );
}

export default Booking;