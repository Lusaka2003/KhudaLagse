import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axios';

const Success = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [type, setType] = useState(null); // 'cart_checkout' or 'wallet_recharge'
  const [errorMessage, setErrorMessage] = useState(null);
  
  const hasVerified = useRef(false);

  useEffect(() => {
    // If no session ID, redirect back to dashboard/customer
    if (!sessionId) {
      navigate('/dashboard/customer');
      return;
    }

    if (hasVerified.current) return;
    hasVerified.current = true;

    const verifyPayment = async () => {
      try {
        const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");

        const { data } = await axiosInstance.post("/api/payment/success", { 
          sessionId,
          cartItems: storedCart 
        });

        if (data.success) {
          setType(data.type); 
          setStatus("success");

          // Clean up cart if it was a food order
          if (data.type === 'cart_checkout') {
            localStorage.removeItem("cart");
            window.dispatchEvent(new Event("cartUpdated")); 
          }
          
          // Clean up wallet recharge pending state
          localStorage.removeItem("pendingRecharge");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setErrorMessage(err.response?.data?.message || err.message);
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);

  // --- STYLES ---
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f9fafb'
  };

  const cardStyle = {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    maxWidth: '500px',
    width: '100%'
  };

  const buttonStyle = {
    marginTop: '24px',
    width: '100%',
    padding: '14px',
    backgroundColor: '#7c3aed',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        
        {/* LOADING STATE */}
        {status === 'loading' && (
          <div className="loader-container">
            <div style={{ fontSize: '3rem', marginBottom: '20px', animation: 'bounce 1s infinite' }}>⏳</div>
            <h2 style={{ color: '#1f2937', fontSize: '1.5rem', fontWeight: 'bold' }}>Verifying Payment...</h2>
            <p style={{ color: '#6b7280', marginTop: '8px' }}>Please wait while we secure your order.</p>
          </div>
        )}

        {/* ERROR STATE */}
        {status === 'error' && (
          <div>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
            <h1 style={{ color: '#1f2937', marginBottom: '10px', fontSize: '2rem', fontWeight: 'bold' }}>Something went wrong</h1>
            <p style={{ color: '#6b7280', lineHeight: '1.5' }}>
              We received your payment, but couldn't finalize the order automatically.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#ef4444', marginTop: '15px', fontWeight: '500', padding: '10px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
              Error: {errorMessage}
            </p>
            <button style={buttonStyle} onClick={() => navigate('/dashboard/customer')}>
              Return to Dashboard
            </button>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'success' && (
          <div>
            {/* DYNAMIC ICON */}
            <div style={{ fontSize: '4.5rem', marginBottom: '24px' }}>
              {type === 'cart_checkout' ? '🍔' : '✨'}
            </div>

            {/* DYNAMIC TITLE */}
            <h1 style={{ color: '#111827', fontWeight: '800', fontSize: '2.25rem', marginBottom: '16px' }}>
              {type === 'cart_checkout' ? 'Order Placed!' : 'Funds Added!'}
            </h1>

            {/* DYNAMIC MESSAGE */}
            <p style={{ color: '#4b5563', fontSize: '1.1rem', lineHeight: '1.6' }}>
              {type === 'cart_checkout' 
                ? "Yum! Your food order has been confirmed and is being prepared." 
                : "Your wallet recharge was successful. You are ready to spend!"}
            </p>

            {/* SINGLE BUTTON -> GO TO DASHBOARD */}
            <button 
              style={buttonStyle} 
              onClick={() => navigate('/dashboard/customer')}
              onMouseOver={(e) => e.target.style.opacity = '0.9'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              Go to Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Success;