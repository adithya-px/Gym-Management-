import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Plus, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Line } from 'react-chartjs-2';

const API = 'http://localhost:5000/api';

const WorkoutLog = ({ memberId }) => {
    const [logs, setLogs] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [personalBests, setPersonalBests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form states
    const [showNewLog, setShowNewLog] = useState(false);
    const [newLogTitle, setNewLogTitle] = useState('');
    const [newLogNotes, setNewLogNotes] = useState('');
    const [newLogDate, setNewLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [entries, setEntries] = useState([{ exercise_id: '', reps: '', weight_kg: '' }]);
    
    // Expanded log state
    const [expandedLogId, setExpandedLogId] = useState(null);

    // Chart state for progress
    const [selectedExerciseId, setSelectedExerciseId] = useState(null);
    const [progressData, setProgressData] = useState(null);

    useEffect(() => {
        if (memberId) {
            fetchData();
        }
    }, [memberId]);

    const fetchData = async () => {
        try {
            const [logsRes, exRes, pbRes] = await Promise.all([
                axios.get(`${API}/workout-logs/${memberId}`),
                axios.get(`${API}/exercises`),
                axios.get(`${API}/workout-logs/${memberId}/personal-bests`)
            ]);
            setLogs(logsRes.data);
            setExercises(exRes.data);
            setPersonalBests(pbRes.data);
            
            if (exRes.data.length > 0 && pbRes.data.length > 0) {
                const firstPbExId = pbRes.data[0].exercise_id;
                setSelectedExerciseId(firstPbExId);
                fetchProgress(firstPbExId);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching workout data:', error);
            setLoading(false);
        }
    };

    const fetchProgress = async (exId) => {
        if (!exId) return;
        try {
            const res = await axios.get(`${API}/workout-logs/${memberId}/progress/${exId}`);
            const data = res.data;
            setProgressData({
                labels: data.map(d => d.log_date),
                datasets: [
                    {
                        label: 'Max Weight (kg)',
                        data: data.map(d => parseFloat(d.max_weight)),
                        borderColor: '#1D9E75',
                        backgroundColor: 'rgba(29, 158, 117, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            });
        } catch (error) {
            console.error('Failed to fetch progress:', error);
        }
    };

    const handleExerciseChange = (e) => {
        const val = e.target.value;
        setSelectedExerciseId(val);
        fetchProgress(val);
    };

    const handleAddEntry = () => {
        setEntries([...entries, { exercise_id: '', reps: '', weight_kg: '' }]);
    };

    const handleEntryChange = (index, field, value) => {
        const newEntries = [...entries];
        newEntries[index][field] = value;
        setEntries(newEntries);
    };

    const handleRemoveEntry = (index) => {
        const newEntries = entries.filter((_, i) => i !== index);
        setEntries(newEntries);
    };

    const submitLog = async (e) => {
        e.preventDefault();
        try {
            // 1. Create Log
            const logRes = await axios.post(`${API}/workout-logs`, {
                member_id: memberId,
                log_date: newLogDate,
                title: newLogTitle || 'Workout',
                notes: newLogNotes
            });
            const logId = logRes.data.id;

            // 2. Create Entries
            const validEntries = entries.filter(ent => ent.exercise_id && ent.reps && ent.weight_kg);
            for (let i = 0; i < validEntries.length; i++) {
                const ent = validEntries[i];
                await axios.post(`${API}/workout-logs/${logId}/entries`, {
                    exercise_id: ent.exercise_id,
                    set_no: i + 1,
                    reps: parseInt(ent.reps),
                    weight_kg: parseFloat(ent.weight_kg)
                });
            }

            // 3. Reset and Refresh
            setShowNewLog(false);
            setNewLogTitle('');
            setNewLogNotes('');
            setEntries([{ exercise_id: '', reps: '', weight_kg: '' }]);
            fetchData();
        } catch (error) {
            console.error('Error saving log:', error);
            alert('Failed to save workout log');
        }
    };

    const toggleExpand = (id) => {
        if (expandedLogId === id) setExpandedLogId(null);
        else setExpandedLogId(id);
    };

    if (loading) return <div>Loading workout data...</div>;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: false } }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={24} color="var(--electric-blue)" />
                    Workout Tracker
                </h3>
                <button 
                    onClick={() => setShowNewLog(!showNewLog)}
                    style={{
                        background: 'var(--electric-blue)', color: '#000', border: 'none',
                        padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer',
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}
                >
                    <Plus size={18} />
                    Log Workout
                </button>
            </div>

            {/* New Log Form */}
            {showNewLog && (
                <GlowCard className="neon-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--electric-blue)' }} customSize={true}>
                    <h4 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>New Workout Log</h4>
                    <form onSubmit={submitLog}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <input 
                                type="date" 
                                value={newLogDate} 
                                onChange={e => setNewLogDate(e.target.value)} 
                                required
                                style={{ padding: '0.8rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}
                            />
                            <input 
                                type="text" 
                                placeholder="Workout Title (e.g. Back & Biceps)" 
                                value={newLogTitle} 
                                onChange={e => setNewLogTitle(e.target.value)} 
                                style={{ padding: '0.8rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}
                            />
                        </div>
                        <textarea 
                            placeholder="Notes (optional)" 
                            value={newLogNotes} 
                            onChange={e => setNewLogNotes(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', marginBottom: '1.5rem', minHeight: '80px', boxSizing: 'border-box' }}
                        />

                        <h5 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Exercises</h5>
                        {entries.map((entry, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                                <select 
                                    value={entry.exercise_id} 
                                    onChange={e => handleEntryChange(idx, 'exercise_id', e.target.value)}
                                    required
                                    style={{ padding: '0.8rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}
                                >
                                    <option value="">Select Exercise...</option>
                                    {exercises.map(ex => (
                                        <option key={ex.exercise_id} value={ex.exercise_id}>{ex.name} ({ex.muscle_group})</option>
                                    ))}
                                </select>
                                <input 
                                    type="number" 
                                    placeholder="Reps" 
                                    value={entry.reps} 
                                    onChange={e => handleEntryChange(idx, 'reps', e.target.value)}
                                    required
                                    style={{ padding: '0.8rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}
                                />
                                <input 
                                    type="number" 
                                    placeholder="Weight (kg)" 
                                    step="0.5"
                                    value={entry.weight_kg} 
                                    onChange={e => handleEntryChange(idx, 'weight_kg', e.target.value)}
                                    required
                                    style={{ padding: '0.8rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px' }}
                                />
                                {entries.length > 1 && (
                                    <button 
                                        type="button" 
                                        onClick={() => handleRemoveEntry(idx)}
                                        style={{ background: 'none', border: 'none', color: 'var(--danger-red)', cursor: 'pointer', padding: '0.5rem' }}
                                    >
                                        Drop
                                    </button>
                                )}
                            </div>
                        ))}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                            <button 
                                type="button" 
                                onClick={handleAddEntry}
                                style={{ background: 'transparent', border: '1px dashed var(--text-muted)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                + Add Set
                            </button>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowNewLog(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ background: '#1D9E75', border: 'none', color: '#fff', padding: '0.6rem 2rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Save Log</button>
                            </div>
                        </div>
                    </form>
                </GlowCard>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
                {/* Left Col: History */}
                <div>
                    <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Recent Logs</h4>
                    {logs.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No workouts logged yet. Start crushing it!</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {logs.map(log => {
                                const isExpanded = expandedLogId === log.log_id;
                                return (
                                    <GlowCard key={log.log_id} className="neon-card" style={{ padding: '0', overflow: 'hidden' }} customSize={true}>
                                        <div 
                                            onClick={() => toggleExpand(log.log_id)}
                                            style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent' }}
                                        >
                                            <div>
                                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>{log.log_date}</div>
                                                <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem' }}>{log.title || 'Workout'}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)' }}>
                                                <span style={{ fontSize: '0.9rem' }}>{log.entries?.length || 0} sets</span>
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </div>
                                        {isExpanded && (
                                            <div style={{ padding: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                                {log.notes && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem', fontStyle: 'italic' }}>"{log.notes}"</p>}
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                    <thead>
                                                        <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <th style={{ paddingBottom: '0.5rem' }}>Exercise</th>
                                                            <th style={{ paddingBottom: '0.5rem', textAlign: 'center' }}>Reps</th>
                                                            <th style={{ paddingBottom: '0.5rem', textAlign: 'right' }}>Weight</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {log.entries?.map(ent => (
                                                            <tr key={ent.entry_id}>
                                                                <td style={{ paddingTop: '0.8rem', color: 'var(--text-primary)' }}>{ent.exercise_name}</td>
                                                                <td style={{ paddingTop: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>{ent.reps}</td>
                                                                <td style={{ paddingTop: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>{ent.weight_kg} kg</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </GlowCard>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Col: Personal Bests & Progress Map */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    
                    <GlowCard className="neon-card" style={{ padding: '1.5rem' }} customSize={true}>
                        <h4 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={20} color="#1D9E75" />
                            Progressive Overload
                        </h4>
                        <select 
                            value={selectedExerciseId || ''} 
                            onChange={handleExerciseChange}
                            style={{ width: '100%', padding: '0.6rem', backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', marginBottom: '1.5rem' }}
                        >
                            {exercises.map(ex => (
                                <option key={ex.exercise_id} value={ex.exercise_id}>{ex.name}</option>
                            ))}
                        </select>
                        <div style={{ height: '200px' }}>
                            {progressData && progressData.labels.length > 0 ? (
                                <Line data={progressData} options={chartOptions} />
                            ) : (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    No data for this exercise yet.
                                </div>
                            )}
                        </div>
                    </GlowCard>

                    <GlowCard className="neon-card" style={{ padding: '1.5rem' }} customSize={true}>
                        <h4 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '1rem' }}>Personal Bests</h4>
                        {personalBests.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No personal bests recorded.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {personalBests.map(pb => (
                                    <li key={pb.exercise_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{pb.exercise_name}</span>
                                        <span style={{ color: 'var(--electric-blue)', fontWeight: 600 }}>{pb.max_weight} kg</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </GlowCard>
                </div>
            </div>
        </div>
    );
};

export default WorkoutLog;
