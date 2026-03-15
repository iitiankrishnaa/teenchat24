import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Trash2, Ban, PlusCircle, Monitor, Users } from 'lucide-react';
import axios from 'axios';

const Admin = () => {
    const [stats, setStats] = useState({ online: 0, rooms: [] });
    const [messages, setMessages] = useState([]); // This would normally fetch from DB

    useEffect(() => {
        // Fetch Admin Stats
        const fetchStats = async () => {
             const res = await axios.get('http://localhost:5000/online-count');
             const roomsRes = await axios.get('http://localhost:5000/rooms');
             setStats({ online: res.data.count, rooms: roomsRes.data });
        };
        fetchStats();
    }, []);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                <ShieldAlert size={40} color="var(--neon-purple)" />
                <h1 style={{ fontSize: '2.5rem', fontWeight: '800' }}>Admin Control Center</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--neon-blue)' }}>
                        <Users size={20} />
                        <span style={{ fontWeight: '600' }}>Online Users</span>
                    </div>
                    <p style={{ fontSize: '2rem', marginTop: '0.5rem' }}>{stats.online}</p>
                </div>
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--neon-purple)' }}>
                        <Monitor size={20} />
                        <span style={{ fontWeight: '600' }}>Active Rooms</span>
                    </div>
                    <p style={{ fontSize: '2rem', marginTop: '0.5rem' }}>{stats.rooms.length}</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <section className="glass" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Ban size={20} color="#ff4d4d" /> Ban Users</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input placeholder="Enter UID or Username" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '8px', color: 'white' }} />
                        <button className="btn-neon" style={{ background: '#ff4d4d', color: 'white' }}>Ban</button>
                    </div>
                    <div style={{ marginTop: '1.5rem' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Recently Banned:</p>
                        <ul style={{ listStyle: 'none', marginTop: '0.5rem' }}>
                            <li style={{ fontSize: '0.85rem', color: '#ff4d4d', padding: '5px 0' }}>Spammer_123 (Auto-Mod)</li>
                            <li style={{ fontSize: '0.85rem', color: '#ff4d4d', padding: '5px 0' }}>BadWordUser1 (Admin)</li>
                        </ul>
                    </div>
                </section>

                <section className="glass" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><PlusCircle size={20} color="var(--neon-blue)" /> Manage Rooms</h3>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <input placeholder="New Room Name" style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '8px', color: 'white' }} />
                        <button className="btn-neon btn-secondary">Create</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {stats.rooms.map(r => (
                            <div key={r} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>{r}</span>
                                <Trash2 size={14} style={{ cursor: 'pointer', color: '#ff4d4d' }} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Admin;
