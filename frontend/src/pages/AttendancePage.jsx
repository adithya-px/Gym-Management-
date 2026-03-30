import API_BASE from '../config';
import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, X, Save, AlertCircle, Filter, List, Activity, Calendar } from 'lucide-react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import '../chartSetup';

const API = API_BASE;

const AttendancePage = () => {
    const [attendance, setAttendance] = useState([]);
    const [members, setMembers] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [showLog, setShowLog] = useState(false);
    const [selectedMember, setSelectedMember] = useState('');
    const [memberSearch, setMemberSearch] = useState('');
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ member_id: '', instructor_id: '', visit_date: '', check_in_time: '', check_out_time: '' });

    const fetchData = async () => {
        try {
            const [attRes, memRes, instRes] = await Promise.all([
                axios.get(`${API}/attendance`),
                axios.get(`${API}/members`),
                axios.get(`${API}/instructors`)
            ]);
            setAttendance(attRes.data);
            setMembers(memRes.data);
            setInstructors(instRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setForm({ member_id: '', instructor_id: '', visit_date: '', check_in_time: '', check_out_time: '' });
        setEditing(null);
        setShowForm(false);
    };

    const handleEdit = (a) => {
        setForm({
            member_id: a.member_id || '', instructor_id: a.instructor_id || '',
            visit_date: a.visit_date || '', check_in_time: a.check_in_time || '',
            check_out_time: a.check_out_time || ''
        });
        setEditing(a.attendance_id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editing) {
                await axios.put(`${API}/attendance/${editing}`, form);
            } else {
                await axios.post(`${API}/attendance`, form);
            }
            resetForm();
            fetchData();
        } catch (err) { alert('Error saving attendance'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this record?')) return;
        try {
            await axios.delete(`${API}/attendance/${id}`);
            fetchData();
        } catch (err) { alert('Error deleting attendance'); }
    };

    if (loading) return <div style={{ color: 'var(--text-muted)', padding: '2rem' }}>Loading attendance...</div>;

    // Date calculations
    const getYYYYMMDD = (d) => {
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
    };
    const today = new Date();
    const todayStr = getYYYYMMDD(today);
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = getYYYYMMDD(yesterdayDate);

    const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM

    // Determines if a record is from today or yesterday
    const isEditable = (dateString) => {
        if (!dateString) return true;
        return dateString >= yesterdayStr;
    };

    // Filter logic
    const filteredMembers = members.filter(m =>
        m.first_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.last_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.member_id.toString().includes(memberSearch)
    );

    const displayedAttendance = selectedMember
        ? attendance.filter(a => a.member_id.toString() === selectedMember.toString())
        : attendance;

    // Stats calculations
    let todayCount = 0;
    let monthCount = 0;
    const dateCounts = {};

    displayedAttendance.forEach(a => {
        if (!a.visit_date) return;

        if (a.visit_date === todayStr) todayCount++;
        if (a.visit_date.startsWith(currentMonthPrefix)) monthCount++;

        dateCounts[a.visit_date] = (dateCounts[a.visit_date] || 0) + 1;
    });

    const sortedDates = Object.keys(dateCounts).sort().slice(-7);
    const chartData = {
        labels: sortedDates.map(d => {
            if (d === todayStr) return 'Today';
            if (d === yesterdayStr) return 'Yesterday';
            return d;
        }),
        datasets: [{
            label: selectedMember ? 'Member Check-ins' : 'Total Check-ins',
            data: sortedDates.map(d => dateCounts[d]),
            backgroundColor: '#66FCF1',
            borderRadius: 4,
            barPercentage: 0.5,
        }]
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={24} /> Attendance Analytics
                </h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setShowLog(!showLog)} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.6rem 1.2rem', background: 'rgba(69,162,158,0.1)', border: '1px solid var(--neon-green)',
                        color: 'var(--neon-green)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600'
                    }}>
                        {showLog ? <X size={18} /> : <List size={18} />}
                        {showLog ? 'Hide Log' : 'View Full Log'}
                    </button>
                    <button onClick={() => { resetForm(); setShowForm(true); }} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.6rem 1.2rem', background: 'var(--neon-green)', border: 'none',
                        color: 'var(--bg-darker)', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: '600'
                    }}>
                        <Plus size={18} /> Add Record
                    </button>
                </div>
            </div>

            {/* Top Dashboard Filters & Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <GlowCard className="neon-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }} customSize={true}>
                    <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                        <Filter size={16} /> Filter by Member
                    </label>
                    <input
                        type="text"
                        placeholder="Search Name or ID..."
                        value={memberSearch}
                        onChange={e => setMemberSearch(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', marginBottom: '0.5rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }}
                    />
                    <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }}>
                        <option value="">All Members (Total Gym)</option>
                        {filteredMembers.map(m => <option key={m.member_id} value={m.member_id}>{m.first_name} {m.last_name}</option>)}
                    </select>
                </GlowCard>

                <GlowCard className="neon-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} customSize={true}>
                    <div style={{ padding: '1rem', background: 'rgba(69, 162, 158, 0.1)', borderRadius: '0.5rem', color: 'var(--electric-blue)' }}>
                        <Activity size={32} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Today's Check-ins</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 'bold' }}>{todayCount}</div>
                    </div>
                </GlowCard>

                <GlowCard className="neon-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} customSize={true}>
                    <div style={{ padding: '1rem', background: 'rgba(102, 252, 241, 0.1)', borderRadius: '0.5rem', color: 'var(--neon-green)' }}>
                        <Calendar size={32} />
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This Month</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '1.8rem', fontWeight: 'bold' }}>{monthCount}</div>
                    </div>
                </GlowCard>
            </div>

            {/* Add Record Form */}
            {showForm && (
                <GlowCard className="neon-card" style={{ marginBottom: '2rem' }} customSize={true}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit' }}>{editing ? 'Edit Record' : 'New Record'}</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Member</label>
                            <select value={form.member_id} onChange={e => setForm({ ...form, member_id: e.target.value })} required style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }}>
                                <option value="">Select Member...</option>
                                {members.map(m => <option key={m.member_id} value={m.member_id}>{m.first_name} {m.last_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Instructor (Optional)</label>
                            <select value={form.instructor_id} onChange={e => setForm({ ...form, instructor_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }}>
                                <option value="">No Instructor</option>
                                {instructors.map(i => <option key={i.instructor_id} value={i.instructor_id}>{i.first_name} {i.last_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Visit Date</label>
                            <input type="date" value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} required style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Check In</label>
                            <input type="datetime-local" value={form.check_in_time} onChange={e => setForm({ ...form, check_in_time: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block', marginBottom: '0.3rem' }}>Check Out</label>
                            <input type="datetime-local" value={form.check_out_time} onChange={e => setForm({ ...form, check_out_time: e.target.value })} style={{ width: '100%', padding: '0.6rem', backgroundColor: 'rgba(11,12,16,0.5)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button type="button" onClick={resetForm} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '0.4rem', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--neon-green)', color: 'var(--neon-green)', borderRadius: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Save size={16} /> Save</button>
                        </div>
                    </form>
                </GlowCard>
            )}

            {/* Chart Section */}
            {!showLog && sortedDates.length > 0 && (
                <GlowCard className="neon-card" style={{ marginBottom: '2rem' }} customSize={true}>
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'Outfit' }}>
                        {selectedMember ? 'Member Attendance Activity' : 'Total Gym Attendance Activity'}
                    </h3>
                    <div style={{ height: '300px' }}>
                        <Bar
                            data={chartData}
                            options={{
                                maintainAspectRatio: false,
                                responsive: true,
                                scales: {
                                    y: {
                                        ticks: { precision: 0 }
                                    }
                                }
                            }}
                        />
                    </div>
                </GlowCard>
            )}

            {/* Raw Log Table Toggleable */}
            {showLog && (
                <GlowCard className="neon-card" style={{ padding: 0, overflow: 'auto', border: '1px solid var(--electric-blue)' }} customSize={true}>
                    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(69,162,158,0.05)' }}>
                        <h3 style={{ color: 'var(--text-primary)', margin: 0, fontFamily: 'Outfit' }}>Detailed Attendance Log {selectedMember && '- Filtered'}</h3>
                        <button onClick={() => setShowLog(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>ID</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Member</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Instructor</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Date</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Time Range</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedAttendance.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No records found.</td>
                                </tr>
                            ) : displayedAttendance.map(a => {
                                const editable = isEditable(a.visit_date);
                                return (
                                    <tr key={a.attendance_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', opacity: editable ? 1 : 0.6 }}>
                                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>#{a.attendance_id}</td>
                                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{a.member_name || a.member_id}</td>
                                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{a.instructor_name || '-'}</td>
                                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontWeight: a.visit_date === todayStr ? '600' : 'normal' }}>
                                            {a.visit_date === todayStr ? 'Today' : (a.visit_date === yesterdayStr ? 'Yesterday' : a.visit_date)}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                                            {a.check_in_time ? a.check_in_time.split('T')[1] : '-'} to {a.check_out_time ? a.check_out_time.split('T')[1] : '-'}
                                        </td>
                                        <td style={{ padding: '0.85rem 1rem' }}>
                                            {editable ? (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleEdit(a)} style={{ background: 'none', border: '1px solid var(--electric-blue)', color: 'var(--electric-blue)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}><Edit2 size={14} /> Edit</button>
                                                    <button onClick={() => handleDelete(a.attendance_id)} style={{ background: 'none', border: '1px solid var(--danger-red)', color: 'var(--danger-red)', padding: '0.3rem 0.6rem', borderRadius: '0.3rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}><Trash2 size={14} /> Delete</button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <AlertCircle size={14} /> Locked
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </GlowCard>
            )}
        </div>
    );
};

export default AttendancePage;
