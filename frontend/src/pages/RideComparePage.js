import React, { useState, useEffect } from 'react';
import axios from 'axios';
import RideCard from '../components/RideCard';

const RideComparePage = () => {
  const [pickupLat, setPickupLat] = useState('');
  const [pickupLng, setPickupLng] = useState('');
  const [dropoffLat, setDropoffLat] = useState('');
  const [dropoffLng, setDropoffLng] = useState('');
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState(localStorage.getItem('access_token') || '');

  useEffect(() => {
    if (!token) {
      setError('Please log in first.');
    }
  }, [token]);

  const fetchRides = async () => {
    if (!token) {
      setError('JWT token missing. Please login again.');
      return;
    }

    setLoading(true);
    setError('');
    setRides([]);

    try {
      const res = await axios.get('http://127.0.0.1:8000/api/rides/options/', {
        params: {
          pickup_lat: pickupLat,
          pickup_lng: pickupLng,
          dropoff_lat: dropoffLat,
          dropoff_lng: dropoffLng,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRides(res.data.results);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError('Unauthorized. Please login again.');
      } else {
        setError('Failed to fetch ride estimates.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Ride Compare</h1>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Pickup Latitude"
          value={pickupLat}
          onChange={(e) => setPickupLat(e.target.value)}
        />
        <input
          type="text"
          placeholder="Pickup Longitude"
          value={pickupLng}
          onChange={(e) => setPickupLng(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <input
          type="text"
          placeholder="Dropoff Latitude"
          value={dropoffLat}
          onChange={(e) => setDropoffLat(e.target.value)}
        />
        <input
          type="text"
          placeholder="Dropoff Longitude"
          value={dropoffLng}
          onChange={(e) => setDropoffLng(e.target.value)}
        />
      </div>

      <button onClick={fetchRides} disabled={loading}>
        {loading ? 'Fetching...' : 'Compare Rides'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginTop: '20px' }}>
        {rides.length === 0 && !loading && <p>No ride estimates available.</p>}
        {rides.map((ride, index) => (
          <RideCard key={index} ride={ride} />
        ))}
      </div>
    </div>
  );
};

export default RideComparePage;