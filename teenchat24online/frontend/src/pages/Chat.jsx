import { Send, Image, Smile, Settings, Users, LogOut, MessageSquare, Plus, Flag, User, Camera, X } from 'lucide-react';
import { auth, db } from '../firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

const Chat = ({ user }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [room, setRoom] = useState('General');
  const [rooms, setRooms] = useState(['General', 'Teens', 'Music', 'Gaming']);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [showEmoji, setShowEmoji] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const scrollRef = useRef();

  const currentUser = user || JSON.parse(localStorage.getItem('guestUser'));

  useEffect(() => {
    if (!currentUser) return navigate('/login');

    socket.emit('join', { 
        uid: currentUser.uid || 'guest', 
        username: currentUser.displayName || currentUser.username, 
        room 
    });

    socket.on('receive-message', (msg) => {
        setMessages((prev) => [...prev, msg]);
        if (msg.username !== (currentUser.displayName || currentUser.username) && msg.type !== 'system') {
            new Audio('/notification.mp3').play().catch(e => {});
        }
    });

    socket.on('user-joined', ({ username }) => {
        setMessages((prev) => [...prev, { 
            id: Date.now().toString(), 
            username: 'System', 
            text: `${username} joined the chat!`, 
            type: 'system',
            avatar: 'https://cdn-icons-png.flaticon.com/512/1791/1791412.png'
        }]);
    });

    socket.on('user-left', ({ username }) => {
        setMessages((prev) => [...prev, { 
            id: Date.now().toString(), 
            username: 'System', 
            text: `${username} left the chat.`, 
            type: 'system',
            avatar: 'https://cdn-icons-png.flaticon.com/512/1791/1791412.png'
        }]);
    });

    socket.on('room-users', (users) => setOnlineUsers(users));
    
    socket.on('user-typing', ({ username, isTyping }) => {
        setTypingUsers(prev => ({ ...prev, [username]: isTyping }));
    });

    return () => {
        socket.off('receive-message');
        socket.off('room-users');
        socket.off('user-typing');
    };
  }, [room, currentUser, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msgData = {
        room,
        text: input,
        username: currentUser.displayName || currentUser.username,
        uid: currentUser.uid || 'guest',
        avatar: currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || currentUser.username}&background=random`,
        type: 'text'
    };

    socket.emit('send-message', msgData);
    setInput('');
    socket.emit('typing', { room, username: currentUser.displayName || currentUser.username, isTyping: false });
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (e.target.value.length > 0) {
        socket.emit('typing', { room, username: currentUser.displayName || currentUser.username, isTyping: true });
    } else {
        socket.emit('typing', { room, username: currentUser.displayName || currentUser.username, isTyping: false });
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    if (user) {
        await updateProfile(auth.currentUser, { 
            displayName: newUsername,
            photoURL: newAvatar || currentUser.photoURL 
        });
    } else {
        const updated = { ...currentUser, username: newUsername, photoURL: newAvatar };
        localStorage.setItem('guestUser', JSON.stringify(updated));
    }

    socket.emit('update-profile', { 
        uid: currentUser.uid || 'guest', 
        username: newUsername, 
        avatar: newAvatar || currentUser.photoURL 
    });
    
    setShowProfileModal(false);
    window.location.reload(); // Quick refresh to update state
  };

  const handleReport = (reportedUser, messageId) => {
    const reason = prompt(`Reason for reporting ${reportedUser}?`);
    if (reason) {
        socket.emit('report-user', {
            reporter: currentUser.displayName || currentUser.username,
            reported: reportedUser,
            reason: reason,
            messageId: messageId
        });
        alert("User reported to moderators.");
    }
    setSelectedUser(null);
  };

  return (
    <div className="chat-layout" style={{ display: 'flex', height: '100vh', padding: '1rem', gap: '1rem', color: 'white' }}>
      
      {/* Sidebar: Rooms */}
      <div className="glass" style={{ width: '280px', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' }}></div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>teenchat24</h2>
        </div>

        <div style={{ flex: 1 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem', textTransform: 'uppercase' }}>Chat Rooms</p>
            {rooms.map(r => (
                <div 
                    key={r} 
                    onClick={() => { setRoom(r); setMessages([]); }}
                    style={{ 
                        padding: '10px 15px', 
                        borderRadius: '8px', 
                        cursor: 'pointer', 
                        marginBottom: '5px',
                        background: room === r ? 'rgba(255,255,255,0.1)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                >
                    <MessageSquare size={18} color={room === r ? 'var(--neon-blue)' : 'gray'} />
                    <span>{r}</span>
                </div>
            ))}
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <Plus size={18} />
                <span style={{ fontSize: '0.9rem' }}>Create Room</span>
            </div>
        </div>

        <div className="user-profile" style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.displayName || currentUser?.username}`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} alt="Avatar" />
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.displayName || currentUser?.username}</p>
                <p style={{ fontSize: '0.7rem', color: '#00ff88' }}>Online</p>
            </div>
            <LogOut size={18} style={{ cursor: 'pointer' }} onClick={handleLogout} />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h3 style={{ fontSize: '1.1rem' }}># {room}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Welcome to the {room} room!</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Users size={20} className="mobile-hide" />
                <Settings size={20} />
            </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {messages.map((m, i) => (
                <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={m.id || i} 
                    style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        opacity: m.type === 'system' ? 0.7 : 1,
                        background: m.type === 'system' ? 'rgba(255,255,255,0.02)' : 'transparent',
                        padding: m.type === 'system' ? '5px 10px' : '0',
                        borderRadius: '8px',
                        position: 'relative'
                    }}
                >
                    <img 
                      src={m.avatar} 
                      onClick={() => m.type !== 'system' && setSelectedUser(m)}
                      style={{ width: m.type === 'system' ? '24px' : '40px', height: m.type === 'system' ? '24px' : '40px', borderRadius: '10px', cursor: 'pointer' }} 
                      alt="" 
                    />
                    <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span 
                              onClick={() => m.type !== 'system' && setSelectedUser(m)}
                              style={{ fontWeight: '700', color: m.type === 'system' ? '#aaa' : 'var(--neon-blue)', fontSize: '0.95rem', cursor: 'pointer' }}
                            >
                                {m.username}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {m.type !== 'system' && (
                                <Flag size={12} className="report-btn" style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.2)' }} onClick={() => handleReport(m.username, m.id)} />
                            )}
                        </div>
                        <p style={{ 
                            marginTop: '3px', 
                            lineHeight: '1.4', 
                            color: m.type === 'system' ? '#999' : '#eee', 
                            fontStyle: m.type === 'system' ? 'italic' : 'normal',
                            fontSize: m.type === 'system' ? '0.85rem' : '1rem' 
                        }}>
                            {m.text.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                                <img src={m.text} alt="Shared" style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px', maxHeight: '300px' }} />
                            ) : m.text}
                        </p>
                    </div>
                </motion.div>
            ))}
            <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1rem 1.5rem' }}>
            {Object.entries(typingUsers).map(([u, is]) => is && u !== (currentUser.displayName || currentUser.username) && (
                <p key={u} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px' }}>{u} is typing...</p>
            ))}
            <form onSubmit={handleSend} className="glass" style={{ display: 'flex', alignItems: 'center', padding: '8px 15px', gap: '12px', background: 'rgba(255,255,255,0.08)' }}>
                <Plus size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
                <input 
                    value={input}
                    onChange={handleTyping}
                    placeholder={`Message #${room}`} 
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '10px 0', outline: 'none', fontSize: '1rem' }}
                />
                <Smile size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowEmoji(!showEmoji)} />
                <button type="submit" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    <Send size={24} color="var(--neon-purple)" />
                </button>
            </form>
        </div>
      </div>

      {/* Right Sidebar: Online Users */}
      <div className="glass online-sidebar" style={{ width: '240px', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Online Users — {onlineUsers.length}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {onlineUsers.map((u, i) => (
                <div key={i} onClick={() => setSelectedUser({ username: u.username, avatar: `https://ui-avatars.com/api/?name=${u.username}&background=random` })} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <div style={{ position: 'relative' }}>
                        <img src={`https://ui-avatars.com/api/?name=${u.username}&background=random`} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: '#00ff88', border: '2px solid var(--bg-dark)' }}></div>
                    </div>
                    <span style={{ fontSize: '0.9rem', color: '#ccc' }}>{u.username}</span>
                </div>
            ))}
        </div>
        <button 
          onClick={() => { setShowProfileModal(true); setNewUsername(currentUser.displayName || currentUser.username); }}
          className="btn-neon" 
          style={{ marginTop: 'auto', background: 'var(--glass-bg)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <User size={14} /> My Profile
        </button>
      </div>

      {/* User Popup Modal */}
      <AnimatePresence>
        {selectedUser && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setSelectedUser(null)}
            >
                <motion.div 
                    initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                    className="glass" style={{ width: '300px', padding: '2rem', textAlign: 'center' }}
                    onClick={e => e.stopPropagation()}
                >
                    <img src={selectedUser.avatar} style={{ width: '80px', height: '80px', borderRadius: '20px', marginBottom: '1rem' }} alt="" />
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedUser.username}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Member since 2026</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button className="btn-neon btn-primary">Message</button>
                        <button onClick={() => handleReport(selectedUser.username)} style={{ background: 'rgba(255,77,77,0.1)', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.2)' }} className="btn-neon">
                            <Flag size={14} style={{ marginRight: '8px' }} /> Report User
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}

        {showProfileModal && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <div className="glass" style={{ width: '400px', padding: '2.5rem', position: 'relative' }}>
                    <X size={24} style={{ position: 'absolute', top: '15px', right: '15px', cursor: 'pointer' }} onClick={() => setShowProfileModal(false)} />
                    <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Edit Profile</h2>
                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <img src={newAvatar || currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || currentUser.username}`} style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid var(--neon-purple)' }} alt="" />
                                <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--neon-purple)', padding: '5px', borderRadius: '50%', cursor: 'pointer' }}>
                                    <Camera size={16} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Display Name</label>
                            <input 
                                value={newUsername} onChange={e => setNewUsername(e.target.value)}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', color: 'white', marginTop: '5px' }} 
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avatar URL (Optional)</label>
                            <input 
                                value={newAvatar} onChange={e => setNewAvatar(e.target.value)}
                                placeholder="https://..."
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '8px', color: 'white', marginTop: '5px' }} 
                            />
                        </div>
                        <button type="submit" className="btn-neon btn-primary">Save Changes</button>
                    </form>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Chat;
