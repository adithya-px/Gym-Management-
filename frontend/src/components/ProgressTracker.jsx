import API_BASE from '../config';
import { GlowCard } from './GlowCard';
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingDown, TrendingUp, Plus, X, Scale, Activity } from 'lucide-react';
import axios from 'axios';
import '../chartSetup';

const API = API_BASE;

const ProgressTracker = ({ memberId }) => {
    const [metrics, setMetrics] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        recorded_date: new Date().toISOString().split('T')[0],
        weight_kg: '',
        body_fat_pct: '',
        notes: ''
    });
    const [saving, setSaving] = useState(false);

    const fetchMetrics = async () => {
        try {
            const res = await axios.get(`${API}/member/${memberId}/body-metrics`);
            setMetrics(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (memberId) fetchMetrics();
    }, [memberId]);

    const handleAdd = async () => {
        if (!formData.weight_kg) return;
        setSaving(true);
        try {
            await axios.post(`${API}/member/${memberId}/body-metrics`, formData);
            setFormData({ recorded_date: new Date().toISOString().split('T')[0], weight_kg: '', body_fat_pct: '', notes: '' });
            setShowAddForm(false);
            fetchMetrics();
        } catch (err) { alert('Failed to save'); }
        finally { setSaving(false); }
    };

    if (metrics.length === 0 && !showAddForm) {
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Scale size={20} color="var(--electric-blue)" /> Progress Tracker
                    </h3>
                    <button onClick={() => setShowAddForm(true)} style={{
                        background: 'transparent', border: '1px solid var(--electric-blue)',
                        color: 'var(--electric-blue)', padding: '0.35rem 0.75rem', borderRadius: '0.4rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                        fontWeight: 700, fontSize: '0.82rem'
                    }}><Plus size={14} /> Log Metric</button>
                </div>
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <Scale size={40} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0 }}>Start tracking your weight & body fat to see your progress chart here.</p>
                </div>
            </div>
        );
    }

    // Chart data
    const labels = metrics.map(m => {
        const d = new Date(m.recorded_date + 'T00:00:00');
        return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`;
    });
    const weights = metrics.map(m => m.weight_kg);
    const bodyFats = metrics.map(m => m.body_fat_pct);

    // Stats
    const latestWeight = weights[weights.length - 1];
    const firstWeight = weights[0];
    const weightDelta = latestWeight ? (latestWeight - firstWeight).toFixed(1) : 0;
    const latestBF = bodyFats[bodyFats.length - 1];
    const firstBF = bodyFats[0];
    const bfDelta = latestBF ? (latestBF - firstBF).toFixed(1) : 0;

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Weight (kg)',
                data: weights,
                borderColor: '#66FCF1',
                backgroundColor: 'rgba(102, 252, 241, 0.08)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#0B0C10',
                pointBorderColor: '#66FCF1',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                yAxisID: 'y'
            },
            ...(bodyFats.some(v => v) ? [{
                label: 'Body Fat %',
                data: bodyFats,
                borderColor: '#B829EA',
                backgroundColor: 'rgba(184, 41, 234, 0.06)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#0B0C10',
                pointBorderColor: '#B829EA',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                yAxisID: 'y1'
            }] : [])
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                labels: { color: 'var(--text-muted)', font: { size: 12 }, usePointStyle: true, pointStyle: 'circle' }
            },
            tooltip: {
                backgroundColor: 'rgba(11, 12, 16, 0.95)',
                borderColor: 'rgba(102, 252, 241, 0.3)',
                borderWidth: 1,
                titleColor: '#66FCF1',
                bodyColor: '#E0E0E0'
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: 'var(--text-muted)', maxRotation: 45 } },
            y: {
                type: 'linear', display: true, position: 'left',
                title: { display: true, text: 'Weight (kg)', color: '#66FCF1' },
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: 'var(--text-muted)' }
            },
            ...(bodyFats.some(v => v) ? {
                y1: {
                    type: 'linear', display: true, position: 'right',
                    title: { display: true, text: 'Body Fat %', color: '#B829EA' },
                    grid: { drawOnChartArea: false },
                    ticks: { color: 'var(--text-muted)' }
                }
            } : {})
        }
    };

    const inputStyle = {
        width: '100%', padding: '0.6rem 0.75rem', backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)', borderRadius: '0.4rem',
        color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', fontSize: '0.9rem'
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--text-primary)', fontFamily: 'Outfit', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Scale size={20} color="var(--electric-blue)" /> Progress Tracker
                </h3>
                <button onClick={() => setShowAddForm(!showAddForm)} style={{
                    background: 'transparent', border: `1px solid ${showAddForm ? 'var(--danger-red)' : 'var(--electric-blue)'}`,
                    color: showAddForm ? 'var(--danger-red)' : 'var(--electric-blue)',
                    padding: '0.35rem 0.75rem', borderRadius: '0.4rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, fontSize: '0.82rem'
                }}>
                    {showAddForm ? <><X size={14} /> Close</> : <><Plus size={14} /> Log Metric</>}
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div style={{
                    padding: '1rem', marginBottom: '1.25rem', backgroundColor: 'rgba(102, 252, 241, 0.03)',
                    border: '1px solid rgba(102, 252, 241, 0.15)', borderRadius: '0.75rem'
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', alignItems: 'end' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Date</label>
                            <input type="date" value={formData.recorded_date} onChange={e => setFormData({...formData, recorded_date: e.target.value})} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Weight (kg) *</label>
                            <input type="number" step="0.1" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})} style={inputStyle} placeholder="e.g. 78.5" />
                        </div>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Body Fat %</label>
                            <input type="number" step="0.1" value={formData.body_fat_pct} onChange={e => setFormData({...formData, body_fat_pct: e.target.value})} style={inputStyle} placeholder="e.g. 16.5" />
                        </div>
                        <button onClick={handleAdd} disabled={saving || !formData.weight_kg} style={{
                            padding: '0.6rem 1rem', border: '1px solid var(--neon-green)',
                            background: 'rgba(29, 158, 117, 0.08)', color: 'var(--neon-green)',
                            borderRadius: '0.4rem', cursor: saving ? 'not-allowed' : 'pointer',
                            fontWeight: 800, fontSize: '0.85rem', height: 'fit-content'
                        }}>{saving ? 'Saving...' : 'Save'}</button>
                    </div>
                </div>
            )}

            {/* Stat Cards */}
            {metrics.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', borderLeft: '3px solid #66FCF1' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>Current</div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 900, fontSize: '1.4rem', fontFamily: 'Outfit' }}>{latestWeight} kg</div>
                    </div>
                    <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', borderLeft: `3px solid ${parseFloat(weightDelta) <= 0 ? '#1D9E75' : 'var(--amber-orange)'}` }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>Change</div>
                        <div style={{ color: parseFloat(weightDelta) <= 0 ? '#1D9E75' : 'var(--amber-orange)', fontWeight: 900, fontSize: '1.4rem', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            {parseFloat(weightDelta) <= 0 ? <TrendingDown size={18} /> : <TrendingUp size={18} />}
                            {weightDelta > 0 ? '+' : ''}{weightDelta} kg
                        </div>
                    </div>
                    {latestBF && (
                        <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', borderLeft: '3px solid #B829EA' }}>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>Body Fat</div>
                            <div style={{ color: '#B829EA', fontWeight: 900, fontSize: '1.4rem', fontFamily: 'Outfit' }}>{latestBF}%</div>
                        </div>
                    )}
                    <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem', borderLeft: '3px solid var(--neon-green)' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' }}>Entries</div>
                        <div style={{ color: 'var(--neon-green)', fontWeight: 900, fontSize: '1.4rem', fontFamily: 'Outfit' }}>{metrics.length}</div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div style={{ height: '260px' }}>
                <Line data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default ProgressTracker;
