import React, { useState } from 'react';
import { ReportsResponse, ReportSection, Reading } from '../services/api';
import { Calendar, FileText, ChevronRight, BarChart2, Info, AlertCircle } from 'lucide-react';

interface ReportsViewProps {
  reportsData: ReportsResponse | null;
  selectedDate: string;
  onDateChange: (date: string) => void;
  loading: boolean;
  onOpenAddModal: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reportsData,
  selectedDate,
  onDateChange,
  loading,
  onOpenAddModal
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'daily' | 'monthToDate' | 'monthly'>('daily');

  const currentReport: ReportSection | undefined = reportsData?.reports[activeReportTab];

  const renderMetricsSummary = (report: ReportSection | undefined) => {
    if (!report) return null;
    const { count, highest, lowest, average } = report.metrics;

    if (count === 0) {
      return (
        <div className="report-empty-state">
          <div className="empty-icon-box">
            <FileText size={36} />
          </div>
          <h4 className="empty-title">No readings for this date range</h4>
          <p className="empty-desc">
            There are no glucose entries recorded for <strong>{report.dateRange}</strong>.
            Log your blood glucose levels to generate automated clinical analytics.
          </p>
          <button
            type="button"
            className="empty-action-btn"
            onClick={onOpenAddModal}
          >
            Log a Reading Now
          </button>
        </div>
      );
    }

    return (
      <div className="report-metrics-grid">
        <div className="report-metric-tile">
          <span className="metric-label">Average Glucose</span>
          <span className="metric-value text-indigo">
            {average !== null ? average : '—'} <span className="metric-unit">mg/dl</span>
          </span>
          <span className="metric-sub">Rounded to 1 decimal</span>
        </div>

        <div className="report-metric-tile">
          <span className="metric-label">Highest Reading</span>
          <span className="metric-value text-red">
            {highest !== null ? highest : '—'} <span className="metric-unit">mg/dl</span>
          </span>
          <span className="metric-sub">Peak value</span>
        </div>

        <div className="report-metric-tile">
          <span className="metric-label">Lowest Reading</span>
          <span className="metric-value text-blue">
            {lowest !== null ? lowest : '—'} <span className="metric-unit">mg/dl</span>
          </span>
          <span className="metric-sub">Nadir value</span>
        </div>

        <div className="report-metric-tile">
          <span className="metric-label">Number of Readings</span>
          <span className="metric-value text-slate">
            {count}
          </span>
          <span className="metric-sub">Entries in period</span>
        </div>
      </div>
    );
  };

  return (
    <div className="reports-container">
      {/* Date selector toolbar */}
      <div className="reports-toolbar">
        <div className="reports-title-area">
          <h2 className="reports-heading">Clinical Reports</h2>
          <p className="reports-subheading">
            Daily, Month-to-date, and Previous Month statistical breakdowns
          </p>
        </div>

        <div className="reports-date-picker-box">
          <label htmlFor="reportDateSelector" className="date-picker-label">
            <Calendar size={16} />
            <span>Reference Date:</span>
          </label>
          <input
            id="reportDateSelector"
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="report-date-input"
          />
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="report-tabs-bar">
        <button
          type="button"
          className={`report-tab-btn ${activeReportTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('daily')}
        >
          <span className="tab-pill-title">Daily</span>
          <span className="tab-pill-range">{reportsData?.reports.daily.dateRange}</span>
        </button>

        <button
          type="button"
          className={`report-tab-btn ${activeReportTab === 'monthToDate' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('monthToDate')}
        >
          <span className="tab-pill-title">Month-to-Date</span>
          <span className="tab-pill-range">{reportsData?.reports.monthToDate.dateRange}</span>
        </button>

        <button
          type="button"
          className={`report-tab-btn ${activeReportTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('monthly')}
        >
          <span className="tab-pill-title">Monthly (Previous Month)</span>
          <span className="tab-pill-range">{reportsData?.reports.monthly.dateRange}</span>
        </button>
      </div>

      {/* Active Report Card */}
      {loading ? (
        <div className="report-card-loading">
          <div className="spinner"></div>
          <p>Calculating reports...</p>
        </div>
      ) : currentReport ? (
        <div className="report-detail-card">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">{currentReport.title}</h3>
              <p className="report-card-daterange">
                Period: <strong>{currentReport.dateRange}</strong>
              </p>
            </div>
            <div className="report-badge">
              {currentReport.metrics.count} {currentReport.metrics.count === 1 ? 'Reading' : 'Readings'}
            </div>
          </div>

          {/* Metric KPI Tiles */}
          {renderMetricsSummary(currentReport)}

          {/* Daily Report Slot Breakdown (Kenpath: "The daily report also lists each reading with its slot.") */}
          {activeReportTab === 'daily' && currentReport.readings.length > 0 && (
            <div className="daily-readings-list-section">
              <h4 className="section-sub-title">Daily Readings by Slot</h4>
              <div className="slot-cards-grid">
                {currentReport.readings.map((r: Reading) => (
                  <div key={r.id} className="slot-reading-card">
                    <div className="slot-reading-top">
                      <span className="slot-pill-large">{r.slot}</span>
                      <span className="slot-val-badge font-bold">
                        {r.value} <span className="unit-small">mg/dL</span>
                      </span>
                    </div>
                    {r.notes && (
                      <p className="slot-reading-notes">{r.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
