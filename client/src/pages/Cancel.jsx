import React from 'react';
import { useNavigate } from 'react-router-dom';

const Cancel = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#fbf5ffff', 
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '35px', 
        borderRadius: '24px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)', 
        textAlign: 'center',
        maxWidth: '380px', 
        width: '100%'
      }}>
        <div style={{ fontSize: '50px', marginBottom: '15px' }}>✨</div>
        
        <h1 style={{ 
          color: '#c82d2dff', 
          marginBottom: '10px', 
          fontWeight: '700',
          fontSize: '26px' 
        }}>
          Payment Cancelled
        </h1>
        
        <p style={{ color: '#59606d', lineHeight: '1.5', fontSize: '15px' }}>
          No worries! Your wallet hasn't been charged. You can try again whenever you're ready.
        </p>

        <button 
          onClick={() => navigate('/wallet')} 
          style={{
            marginTop: '25px',
            width: '100%',
            padding: '12px',
            backgroundColor: '#ba64fcff',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          Try Again
        </button>

        <p 
          onClick={() => navigate('/')}
          style={{ 
            marginTop: '18px', 
            color: '#9ca3af', 
            fontSize: '13px', 
            cursor: 'pointer',
            textDecoration: 'underline' 
          }}
        >
          Return to Home
        </p>
      </div>
    </div>
  );
};

export default Cancel;