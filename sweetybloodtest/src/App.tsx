import React, { useState, useEffect, useCallback } from 'react';
import { User, Reading, ReportsResponse, api, authStorage } from './services/api';
import { AuthCard } from './components/AuthCard';
import { ReadingModal } from './components/ReadingModal';
import { LogsTable } from './components/LogsTable';
import { KPICards } from './components/KPICards';
import { ReportsView } from './components/ReportsView';
import { GlucoseChart } from './components/GlucoseChart';
import { AIInsights } from './components/AIInsights';
import { Activity, LogOut, LayoutDashboard, FileText, User as UserIcon } from 'lucide-react';
import './App.css';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authStorage.getUser());
  const [activeNav, setActiveNav] = useState<'dashboard' | 'reports'>('dashboard');

  const [readings, setReadings] = useState<Reading[]>([]);
  const [readingsLoading, setReadingsLoading] = useState(false);

  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedReportDate, setSelectedReportDate] = useState<string>(getTodayStr());
  const [reportsData, setReportsData] = useState<ReportsResponse | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);

  // Load all user readings
  const loadReadings = useCallback(async () => {
    if (!currentUser) return;
    setReadingsLoading(true);
    try {
      const data = await api.readings.getAll();
      setReadings(data.readings);
    } catch (err) {
      console.error('Failed to load readings:', err);
    } finally {
      setReadingsLoading(false);
    }
  }, [currentUser]);

  // Load reports for selected date
  const loadReports = useCallback(async (date: string) => {
    if (!currentUser) return;
    setReportsLoading(true);
    try {
      const data = await api.reports.get(date);
      setReportsData(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setReportsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadReadings();
      loadReports(selectedReportDate);
    }
  }, [currentUser, loadReadings, loadReports, selectedReportDate]);

  const handleLogout = () => {
    authStorage.clearToken();
    authStorage.clearUser();
    setCurrentUser(null);
    setReadings([]);
    setReportsData(null);
  };

  const handleOpenAddModal = () => {
    setEditingReading(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reading: Reading) => {
    setEditingReading(reading);
    setIsModalOpen(true);
  };

  const handleDeleteReading = async (id: number) => {
    try {
      await api.readings.delete(id);
      loadReadings();
      loadReports(selectedReportDate);
    } catch (err: any) {
      alert(err.message || 'Failed to delete reading.');
    }
  };

  const handleModalSuccess = () => {
    loadReadings();
    loadReports(selectedReportDate);
  };

  // If not logged in, render Auth screen (Image 1 style)
  if (!currentUser) {
    return <AuthCard onAuthSuccess={(user) => setCurrentUser(user)} />;
  }

  // Active metrics for top KPI cards (uses Month-to-date or daily summary)
  const currentMetrics = reportsData?.reports.monthToDate.metrics || null;
  const currentPeriodLabel = reportsData?.reports.monthToDate.dateRange || 'Current Month';

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <header className="app-topbar">
        <div className="topbar-inner">
          <div className="brand-group">
            <div className="brand-icon-box">
              <Activity size={22} className="brand-icon" />
            </div>
            <div className="brand-text-box">
              <h1 className="brand-name">Sweety</h1>
              <span className="brand-badge">Blood Glucose Tracker</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="topbar-nav">
            <button
              type="button"
              className={`nav-tab-btn ${activeNav === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveNav('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard & Logs</span>
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeNav === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveNav('reports')}
            >
              <FileText size={18} />
              <span>Reports</span>
            </button>
          </nav>

          {/* User profile & Logout */}
          <div className="user-controls">
            <div className="user-avatar-badge" title={currentUser.email}>
              <UserIcon size={16} />
              <span className="user-display-name">{currentUser.name}</span>
            </div>
            <button
              type="button"
              className="logout-btn"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main-content">
        {activeNav === 'dashboard' ? (
          <div className="dashboard-layout">
            {/* KPI Summary Cards (Reference Image 4) */}
            <KPICards
              metrics={currentMetrics}
              periodLabel={currentPeriodLabel}
              onOpenAddModal={handleOpenAddModal}
            />

            {/* AI Pattern Recognition & Insights */}
            <AIInsights readings={readings} />

            {/* Interactive Trend Chart */}
            <GlucoseChart readings={readings} />

            {/* Glucose Logs Table (Reference Image 3) */}
            <LogsTable
              readings={readings}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteReading}
              onAddNew={handleOpenAddModal}
              loading={readingsLoading}
            />
          </div>
        ) : (
          <div className="reports-layout">
            {/* Reports Section (Kenpath Daily, Month-to-date, Monthly) */}
            <ReportsView
              reportsData={reportsData}
              selectedDate={selectedReportDate}
              onDateChange={(newDate) => setSelectedReportDate(newDate)}
              loading={reportsLoading}
              onOpenAddModal={handleOpenAddModal}
            />
          </div>
        )}
      </main>

      {/* Reading Entry / Edit Modal (Reference Image 2) */}
      <ReadingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        initialReading={editingReading}
        defaultDate={selectedReportDate}
      />
    </div>
  );
};

export default App;
