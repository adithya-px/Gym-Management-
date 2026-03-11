import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { NeonCard } from '../components/NeonCard';
import { Activity, LogOut, Users, Send, MessageCircle, BarChart3 } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const InstructorDashboard = () => {
    const { user, logout } = useAuth();
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentAttendance, setStudentAttendance] = useState(null);
    const [msgText, setMsgText] = useState('');
    const [msgStatus, setMsgStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await axios.get(`${API}/instructor/${user.id}/students`);
                setStudents(res.data);
                if (res.data.length > 0) {
                    setSelectedStudent(res.data[0]);
                }
            } catch (err) {
                console.error('Failed to fetch students', err);
            } finally {
                setLoading(false);
            }
        };
        if (user?.id) fetchStudents();
    }, [user]);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentAttendance(selectedStudent.member_id);
        }
    }, [selectedStudent]);

    const fetchStudentAttendance = async (memberId) => {
        try {
            const res = await axios.get(`${API}/instructor/${user.id}/student/${memberId}/attendance`);
            setStudentAttendance(res.data);
        } catch (err) {
            console.error('Failed to fetch attendance', err);
        }
    };

    const handleSendMessage = async () => {
        if (!msgText.trim() || !selectedStudent) return;
        setMsgStatus('sending');
        try {
            await axios.post(`${API}/instructor/${user.id}/message`, {
                member_id: selectedStudent.member_id,
                content: msgText
            });
            setMsgText('');
            setMsgStatus('sent');
            setTimeout(() => setMsgStatus(null), 3000);
        } catch (err) {
            setMsgStatus('error');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
                <div style={{ textAlign: 'center', color: 'var(--electric-blue)' }}>
                    <Activity size={40} style={{ animation: 'spin 2s linear infinite' }} />
                    <p style={{ marginTop: '1rem', fontFamily: 'Outfit' }}>Loading Coach Portal...</p>
                </div>
            </div>
        );
    }


    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-dark)' }}>
            {/* Top Navbar */}
            <header style={{
                backgroundColor: 'rgba(11, 12, 16, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--border-color)',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Activity color="var(--neon-green)" size={28} />
                    <h1 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', margin: 0, fontSize: '1.5rem' }}>Neon Iron</h1>
                    <span style={{ color: 'var(--electric-purple)', fontSize: '0.85rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem', fontWeight: '600' }}>Coach Portal</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Coach {user?.name}</div>
                    <button onClick={logout} style={{
                        background: 'transparent', border: '1px solid var(--danger-red)',
                        color: 'var(--danger-red)', padding: '0.4rem 1rem', borderRadius: '0.25rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            {/* Content */}
            <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                    <Users size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                    Your Students ({students.length})
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem', minHeight: '60vh' }}>
                    {/* Left: Student List */}
                    <div className="neon-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ color: 'var(--text-primary)', margin: 0, fontFamily: 'Outfit', fontSize: '1rem' }}>Assigned Members</h3>
                        </div>
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {students.map((s) => (
                                <div
                                    key={s.member_id}
                                    onClick={() => setSelectedStudent(s)}
                                    style={{
                                        padding: '1rem',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        backgroundColor: selectedStudent?.member_id === s.member_id ? 'rgba(69, 162, 158, 0.1)' : 'transparent',
                                        borderLeft: selectedStudent?.member_id === s.member_id ? '3px solid var(--neon-green)' : '3px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{s.first_name} {s.last_name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.plan_name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Ends: {s.end_date}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Student Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {selectedStudent ? (
                            <>
                                {/* Student Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <NeonCard
                                        title="Student"
                                        value={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
                                        icon={<Users size={20} />}
                                        glowColor="var(--neon-green)"
                                        subtitle={selectedStudent.email}
                                    />
                                    <NeonCard
                                        title="Plan"
                                        value={selectedStudent.plan_name}
                                        icon={<Activity size={20} />}
                                        glowColor="var(--electric-blue)"
                                        subtitle={`${selectedStudent.start_date} → ${selectedStudent.end_date}`}
                                    />
                                    <NeonCard
                                        title="Total Visits"
                                        value={studentAttendance?.totalVisits || 0}
                                        icon={<BarChart3 size={20} />}
                                        glowColor="var(--electric-purple)"
                                        subtitle="All Time"
                                    />
                                </div>

                                {/* Attendance Blocks */}
                                {studentAttendance && (
                                    <div className="neon-card">
                                        <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'Outfit' }}>
                                            {selectedStudent.first_name}'s Attendance (Last 14 Days)
                                        </h3>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '1rem' }}>
                                            {studentAttendance.labels.map((label, index) => {
                                                const isPresent = studentAttendance.data[index] === 1;
                                                return (
                                                    <div key={index} style={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
                                                    }}>
                                                        <div
                                                            title={`${label}: ${isPresent ? 'Present' : 'Absent'}`}
                                                            style={{
                                                                width: '32px',
                                                                height: '32px',
                                                                borderRadius: '4px',
                                                                backgroundColor: isPresent ? 'var(--neon-green)' : 'rgba(255,255,255,0.05)',
                                                                border: isPresent ? '1px solid var(--neon-green)' : '1px solid rgba(255,255,255,0.1)',
                                                                boxShadow: isPresent ? '0 0 8px rgba(102, 252, 241, 0.4)' : 'none',
                                                                transition: 'all 0.2s',
                                                                cursor: 'pointer'
                                                            }}
                                                        ></div>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                            {label.split(' ')[1] ? label.split(' ')[1] : label}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'var(--neon-green)', boxShadow: '0 0 8px rgba(102, 252, 241, 0.4)' }}></div> Present
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}></div> Absent
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Send Message */}
                                <div className="neon-card">
                                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MessageCircle size={20} color="var(--electric-blue)" /> Send Message to {selectedStudent.first_name}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <input
                                            type="text"
                                            value={msgText}
                                            onChange={(e) => setMsgText(e.target.value)}
                                            placeholder="Write a message..."
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            style={{
                                                flex: 1,
                                                padding: '0.75rem 1rem',
                                                backgroundColor: 'rgba(11, 12, 16, 0.5)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '0.5rem',
                                                color: 'var(--text-primary)',
                                                outline: 'none'
                                            }}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!msgText.trim()}
                                            style={{
                                                padding: '0.75rem 1.5rem',
                                                backgroundColor: msgStatus === 'sent' ? 'rgba(69, 162, 158, 0.2)' : 'transparent',
                                                border: '1px solid var(--neon-green)',
                                                color: 'var(--neon-green)',
                                                borderRadius: '0.5rem',
                                                cursor: msgText.trim() ? 'pointer' : 'not-allowed',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                transition: 'all 0.3s'
                                            }}
                                        >
                                            <Send size={16} />
                                            {msgStatus === 'sending' ? 'Sending...' : msgStatus === 'sent' ? 'Sent ✓' : 'Send'}
                                        </button>
                                    </div>
                                    {msgStatus === 'error' && (
                                        <p style={{ color: 'var(--danger-red)', marginTop: '0.5rem', fontSize: '0.85rem' }}>Failed to send message.</p>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="neon-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                                <p style={{ color: 'var(--text-muted)' }}>Select a student to view their progress</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default InstructorDashboard;
