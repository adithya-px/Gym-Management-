import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const MainLayout = () => {
    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                <TopNavbar />
                <main className="page-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
