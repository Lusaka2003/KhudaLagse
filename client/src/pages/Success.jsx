import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';

const Success = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasCalled = useRef(false);

  useEffect(() => {
    const finalizeRecharge = async () => {
      if (hasCalled.current) return;
      
      const amount = localStorage.getItem("pendingRecharge");
      
      if (amount) {
        hasCalled.current = true;
        try {
          await axiosInstance.post("/api/wallet/recharge", { 
            amount: Number(amount),
            method: "stripe" 
          });
          
          setLoading(false);
          localStorage.removeItem("pendingRecharge");
        } catch (err) {
          console.error("Payment sync error:", err);
          setError(err.response?.data?.message || err.message);
          setLoading(false);
        }
      } else {
        navigate('/wallet');
      }
    };

    finalizeRecharge();
  }, [navigate]);

  // Main container styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: '20px',
    textAlign: 'center'
  };

  const buttonStyle = {
    marginTop: '30px',
    padding: '12px 32px',
    backgroundColor: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease'
  };

  return (
    <div style={containerStyle}>
      {loading ? (
        <div className="loader-container">
          <h2 style={{ color: '#4b5563' }}>Updating your balance...</h2>
          <p style={{ color: '#9ca3af' }}>Please don't close this page</p>
        </div>
      ) : error ? (
        <div style={{ maxWidth: '400px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
          <h1 style={{ color: '#1f2937', marginBottom: '10px' }}>Something went wrong</h1>
          <p style={{ color: '#6b7280', lineHeight: '1.5' }}>
            The payment was successful, but we couldn't update your wallet automatically. 
            Don't worry, our team can help.
          </p>
          <p style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '15px', fontWeight: '500' }}>
            Error: {error}
          </p>
          <button style={buttonStyle} onClick={() => navigate('/wallet')}>
            Return to Wallet
          </button>
        </div>
      ) : (
        <div style={{ maxWidth: '450px' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '20px' }}>✨</div>
          <h1 style={{ color: '#111827', fontWeight: '800', fontSize: '2.25rem', marginBottom: '16px' }}>
            Funds Added!
          </h1>
          <p style={{ color: '#4b5563', fontSize: '1.1rem', lineHeight: '1.6' }}>
            Your recharge was successful. Your wallet balance has been updated and you're ready to order.
          </p>
          <button 
            style={buttonStyle} 
            onClick={() => navigate('/dashboard/customer')}
            onMouseOver={(e) => e.target.style.opacity = '0.9'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default Success;