import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Users, Shield, Zap } from 'lucide-react';
import axios from 'axios';

const Home = ({ user }) => {
  const navigate = useNavigate();
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await axios.get('http://localhost:5000/online-count');
        setOnlineCount(res.data.count);
      } catch (err) {
        setOnlineCount(0);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleGuestChat = () => {
    const guestName = `Guest_${Math.floor(Math.random() * 9000) + 1000}`;
    localStorage.setItem('guestUser', JSON.stringify({ username: guestName, isGuest: true }));
    navigate('/chat');
  };

  return (
    <div className="home-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Animated Background Elements */}
      <div className="bg-glow" style={{ position: 'absolute', width: '400px', height: '400px', background: 'var(--neon-purple)', filter: 'blur(150px)', opacity: '0.2', top: '-100px', left: '-100px' }}></div>
      <div className="bg-glow" style={{ position: 'absolute', width: '400px', height: '400px', background: 'var(--neon-blue)', filter: 'blur(150px)', opacity: '0.2', bottom: '-100px', right: '-100px' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{ padding: '3rem', maxWidth: '800px', width: '90%', textAlign: 'center', zIndex: 1 }}
      >
        <motion.h1 
          className="float"
          style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, var(--neon-blue), var(--neon-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}
        >
          teenchat24.online
        </motion.h1>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '2rem' }}>
          Real-time chat for the next generation. Join the vibe.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <button onClick={() => navigate('/chat')} className="btn-neon btn-primary">Start Chat</button>
          {!user && (
            <>
              <button onClick={() => navigate('/login')} className="btn-neon btn-secondary">Login / Signup</button>
              <button onClick={handleGuestChat} className="btn-neon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>Guest Chat</button>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          <div className="stat-card">
            <Users size={32} color="var(--neon-blue)" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.5rem' }}>{onlineCount + 24}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Online Now</p>
          </div>
          <div className="stat-card">
            <Zap size={32} color="var(--neon-purple)" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.5rem' }}>Instant</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time</p>
          </div>
          <div className="stat-card">
            <Shield size={32} color="#00ff88" style={{ marginBottom: '0.5rem' }} />
            <h3 style={{ fontSize: '1.5rem' }}>Secure</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Safe & Moderated</p>
          </div>
        </div>
      </motion.div>

      {/* Footer Text */}
      <p style={{ position: 'absolute', bottom: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        &copy; 2026 teenchat24.online - Modern Social Experience
      </p>
    </div>
  );
};

export default Home;
