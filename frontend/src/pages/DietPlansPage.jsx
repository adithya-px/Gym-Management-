"use client";
import API_BASE from '../config';
import { GlowCard } from '../components/GlowCard';
import React, { useState, useEffect } from 'react';
import { Apple, Loader } from 'lucide-react';
import axios from 'axios';

const API = API_BASE;

const DietPlansPage = () => {
    const [dietPlans, setDietPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API}/diet-plans`);
            setDietPlans(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sorted = [...dietPlans].sort((a, b) => {
        if (!sortField) return 0;
        const valA = (a[sortField] || '').toString().toLowerCase();
        const valB = (b[sortField] || '').toString().toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    if (loading) return (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--electric-blue)' }}>
                <Loader size={32} style={{ animation: 'spin 2s linear infinite' }} />
                <p style={{ marginTop: '1rem', fontFamily: 'Outfit' }}>Loading Diet Plans...</p>
            </div>
        </div>
    );

    const SortHeader = ({ field, label }) => (
        <th onClick={() => handleSort(field)} style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {label} {sortField === field ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
        </th>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: 'Outfit', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Apple size={24} /> Diet Plans ({dietPlans.length})
                </h2>
            </div>

            {dietPlans.length === 0 ? (
                <GlowCard className="neon-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }} customSize={true}>
                    No diet plans assigned yet. Coaches can create diet plans for their students.
                </GlowCard>
            ) : (
                <GlowCard className="neon-card" style={{ padding: 0, overflow: 'auto' }} customSize={true}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>#</th>
                                <SortHeader field="member_name" label="Member" />
                                <SortHeader field="instructor_name" label="Coach" />
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                                    Protein (g)
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                                    Carbs (g)
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>
                                    Kcal Goal
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Breakfast</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Lunch</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Dinner</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Notes</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((dp, idx) => (
                                <tr key={dp.diet_plan_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: '500' }}>{dp.member_name}</td>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--electric-blue)' }}>{dp.instructor_name}</td>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--neon-green)', fontWeight: '700', textAlign: 'center', fontSize: '1rem' }}>{dp.protein_g}g</td>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--electric-purple)', fontWeight: '700', textAlign: 'center', fontSize: '1rem' }}>{dp.carbs_g}g</td>
                                    <td style={{ padding: '0.85rem 1rem', color: '#FF6B6B', fontWeight: '700', textAlign: 'center', fontSize: '1rem' }}>{dp.kcal_goal}</td>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', minWidth: '120px' }}>{dp.breakfast || '—'}</td>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', minWidth: '120px' }}>{dp.lunch || '—'}</td>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', minWidth: '120px' }}>{dp.dinner || '—'}</td>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', minWidth: '150px' }}>{dp.notes || '—'}</td>
                                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{dp.updated_at}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </GlowCard>
            )}
        </div>
    );
};

export default DietPlansPage;
