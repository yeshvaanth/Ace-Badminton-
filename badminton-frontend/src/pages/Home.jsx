import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

function Home() {
  const [courts, setCourts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courts')
      .then((res) => setCourts(res.data.courts))
      .catch(() => setError('Could not load courts'));
  }, []);

  return (
    <div className="page">
      <h2>Available Courts</h2>
      {error && <p className="error-text">{error}</p>}
      <div className="court-grid">
        {courts.map((court) => (
          <div key={court._id} className="court-card">
            <h3>{court.name}</h3>
            <p>{court.location}</p>
            <p className="court-price">₹{court.pricePerHour} / hour</p>
            <Link to={`/booking/${court._id}`}>
              <button className="btn-primary">Book this court</button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;