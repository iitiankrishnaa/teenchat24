import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, ArrowRight, Github } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('email'); // 'email' or 'phone'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [error, setError] = useState('');

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/chat');
        } catch (err) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                navigate('/chat');
            } catch (innerErr) {
                setError(innerErr.message);
            }
        }
    };

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible'
            });
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setupRecaptcha();
        const appVerifier = window.recaptchaVerifier;
        try {
            const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
            window.confirmationResult = confirmationResult;
            setShowOtp(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        try {
            await window.confirmationResult.confirm(otp);
            navigate('/chat');
        } catch (err) {
            setError("Invalid OTP");
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass"
                style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}
            >
                <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', background: 'linear-gradient(to right, var(--neon-blue), var(--neon-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>teenchat24</h1>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>Authenticate to start chatting</p>

                {error && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => setMode('email')} style={{ flex: 1, padding: '10px', background: mode === 'email' ? 'var(--neon-purple)' : 'transparent', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Email</button>
                    <button onClick={() => setMode('phone')} style={{ flex: 1, padding: '10px', background: mode === 'phone' ? 'var(--neon-purple)' : 'transparent', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>OTP / Phone</button>
                </div>

                {mode === 'email' ? (
                    <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                            <input 
                                type="email" placeholder="Email Address" required 
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '12px 12px 12px 40px', borderRadius: '8px', color: 'white', outline: 'none' }} 
                            />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                            <input 
                                type="password" placeholder="Password" required 
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '12px 12px 12px 40px', borderRadius: '8px', color: 'white', outline: 'none' }} 
                            />
                        </div>
                        <button type="submit" className="btn-neon btn-primary" style={{ marginTop: '1rem' }}>Sign In / Up</button>
                    </form>
                ) : (
                    <form onSubmit={showOtp ? handleVerifyOtp : handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {!showOtp ? (
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" placeholder="+1234567890" required 
                                    value={phone} onChange={(e) => setPhone(e.target.value)}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '12px 12px 12px 40px', borderRadius: '8px', color: 'white', outline: 'none' }} 
                                />
                            </div>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <ArrowRight size={18} style={{ position: 'absolute', left: '12px', top: '15px', color: 'var(--text-muted)' }} />
                                <input 
                                    type="text" placeholder="Enter 6-digit OTP" required 
                                    value={otp} onChange={(e) => setOtp(e.target.value)}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '12px 12px 12px 40px', borderRadius: '8px', color: 'white', outline: 'none' }} 
                                />
                            </div>
                        )}
                        <div id="recaptcha-container"></div>
                        <button type="submit" className="btn-neon btn-secondary" style={{ marginTop: '1rem' }}>{showOtp ? 'Verify OTP' : 'Send OTP'}</button>
                    </form>
                )}

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>Or continue with</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <div className="glass" style={{ padding: '10px', cursor: 'pointer' }}><Github /></div>
                        <div className="glass" style={{ padding: '10px', cursor: 'pointer' }}><Mail /></div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
