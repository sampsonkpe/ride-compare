import React from 'react';

const RideCard = ({ ride }) => {
  const { provider, category, price, eta_min, distance_km, link, error } = ride;

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
      }}
    >
      <h3 style={{ margin: '0 0 10px 0' }}>{provider}</h3>

      {error ? (
        <p style={{ color: 'red', margin: 0 }}>{error}</p>
      ) : (
        <>
          <p style={{ margin: '5px 0' }}>
            <strong>Category:</strong> {category}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Price:</strong> {price}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>ETA:</strong> {eta_min} min
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Distance:</strong> {distance_km} km
          </p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '8px 12px',
              backgroundColor: '#007bff',
              color: '#fff',
              borderRadius: '5px',
              textDecoration: 'none',
            }}
          >
            Book Ride
          </a>
        </>
      )}
    </div>
  );
};

export default RideCard;