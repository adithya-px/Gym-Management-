import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Global defaults for "Neon Iron" Theme
ChartJS.defaults.color = '#848a93';
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';
ChartJS.defaults.plugins.tooltip.backgroundColor = 'rgba(11, 12, 16, 0.9)';
ChartJS.defaults.plugins.tooltip.titleColor = '#fff';
ChartJS.defaults.plugins.tooltip.bodyColor = '#C5C6C7';
ChartJS.defaults.plugins.tooltip.borderColor = 'rgba(102, 252, 241, 0.3)';
ChartJS.defaults.plugins.tooltip.borderWidth = 1;
