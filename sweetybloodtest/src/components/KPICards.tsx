import React from 'react';
import { ReportsResponse, ReportSection } from '../services/api';
import { Calendar, HelpCircle, Plus, Activity, ArrowRight, BarChart2 } from 'lucide-react';

interface KPICardsProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  activeReportType: 'daily' | 'monthToDate' | 'monthly';
  onReportTypeChange: (type: 'daily' | 'monthToDate' | 'monthly') => void;
  reportsData: ReportsResponse | null;
  onOpenAddModal: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  selectedDate,
  onDateChange,
  activeReportType,
  onReportTypeChange,
  reportsData,
  onOpenAddModal
}) => {
  const currentReport: ReportSection | undefined = reportsData?.reports[activeReportType];
  const metrics = currentReport?.metrics;

  const avg = metrics?.average ?? null;
  const highest = metrics?.highest ?? null;
  const lowest = metrics?.lowest ?? null;
  const count = metrics?.count ?? 0;
  const variation = (highest !== null && lowest !== null) ? (highest - lowest) : null;

  const timeInRange = metrics?.timeInRange || {
    lowPercent: 0,
    inRangePercent: count > 0 ? 100 : 0,
    highPercent: 0
  };

  return (
    <div className="kpi-dashboard-wrapper">
      {/* Top Header with Date Picker & 3 Quick Report Tabs */}
      <div className="report-quick-switch-bar">
        <div className="report-title-meta">
          <div className="report-pill-badge">
            <Activity size={16} />
            <span>Kenpath Assessment Protocol</span>
          </div>
          <h2 className="report-main-title">
            {currentReport?.title || 'Clinical Health Overview'}
          </h2>
          <p className="report-period-text">
            Active Period: <strong>{currentReport?.dateRange || selectedDate}</strong>
          </p>
        </div>

        <div className="report-controls-group">
          {/* Reference Date Picker */}
          <div className="reference-date-box">
            <Calendar size={16} className="date-icon" />
            <span className="date-picker-text">Reference Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="quick-date-input"
              title="Select reference date"
            />
          </div>

          {/* Quick 3-Report Tabs (Kenpath Required Reports) */}
          <div className="quick-report-tabs">
            <button
              type="button"
              className={`quick-tab ${activeReportType === 'daily' ? 'active' : ''}`}
              onClick={() => onReportTypeChange('daily')}
            >
              <span>Daily</span>
            </button>
            <button
              type="button"
              className={`quick-tab ${activeReportType === 'monthToDate' ? 'active' : ''}`}
              onClick={() => onReportTypeChange('monthToDate')}
            >
              <span>Month-to-Date</span>
            </button>
            <button
              type="button"
              className={`quick-tab ${activeReportType === 'monthly' ? 'active' : ''}`}
              onClick={() => onReportTypeChange('monthly')}
            >
              <span>Monthly</span>
            </button>
          </div>
        </div>
      </div>

      {/* Symmetrical 4-Card Grid (Row 1: Exactly 4 Cards with Zero Empty Space) */}
      <div className="kpi-grid-4">
        {/* Card 1: Average Glucose */}
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-title">Average Glucose</span>
            <span className="kpi-info-icon" title="Average of readings in selected range (rounded to 1 decimal place)">
              <HelpCircle size={15} />
            </span>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-primary-val text-indigo">
              {avg !== null ? avg : '—'}
            </span>
            <span className="kpi-unit"> mg/dl</span>
          </div>
          <p className="kpi-footer-text">
            {avg !== null
              ? (avg <= 140 ? '✓ Optimal target range' : '⚠ Above optimal target')
              : 'No entries recorded'}
          </p>
        </div>

        {/* Card 2: Range & Variation */}
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-title">Glucose Range & Spread</span>
            <span className="kpi-info-icon" title="Peak, Nadir, and absolute spread variation">
              <HelpCircle size={15} />
            </span>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-primary-val text-amber">
              {variation !== null ? `±${variation}` : '—'}
            </span>
            <span className="kpi-unit"> mg/dl</span>
          </div>
          <p className="kpi-footer-text">
            {highest !== null && lowest !== null
              ? `Highest: ${highest} | Lowest: ${lowest}`
              : 'Requires measurements'}
          </p>
        </div>

        {/* Card 3: Total Readings */}
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-title">Total Readings</span>
            <span className="kpi-info-icon" title="Number of recorded readings in this period (Max 4/day allowed)">
              <HelpCircle size={15} />
            </span>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-primary-val text-slate">
              {count}
            </span>
            <span className="kpi-unit"> entries</span>
          </div>
          <p className="kpi-footer-text">
            {activeReportType === 'daily'
              ? `${count} of 4 slots recorded today`
              : 'Aggregated clinical count'}
          </p>
        </div>

        {/* Card 4: Time In Range (TIR) */}
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-title">Time in Range (70–140)</span>
            <span className="kpi-info-icon" title="Percentage of readings within the 70-140 mg/dL target window">
              <HelpCircle size={15} />
            </span>
          </div>

          <div className="time-in-range-bar-container compact">
            <div className="time-in-range-bar">
              {timeInRange.lowPercent > 0 && (
                <div
                  className="bar-segment bar-low"
                  style={{ width: `${timeInRange.lowPercent}%` }}
                  title={`Low (<70): ${timeInRange.lowPercent}%`}
                >
                  {timeInRange.lowPercent >= 12 && `${timeInRange.lowPercent}%`}
                </div>
              )}
              {timeInRange.inRangePercent > 0 && (
                <div
                  className="bar-segment bar-normal"
                  style={{ width: `${timeInRange.inRangePercent}%` }}
                  title={`In Range (70-140): ${timeInRange.inRangePercent}%`}
                >
                  {timeInRange.inRangePercent >= 12 && `${timeInRange.inRangePercent}%`}
                </div>
              )}
              {timeInRange.highPercent > 0 && (
                <div
                  className="bar-segment bar-high"
                  style={{ width: `${timeInRange.highPercent}%` }}
                  title={`High (>140): ${timeInRange.highPercent}%`}
                >
                  {timeInRange.highPercent >= 12 && `${timeInRange.highPercent}%`}
                </div>
              )}
              {count === 0 && (
                <div className="bar-segment bar-empty" style={{ width: '100%' }}>
                  No Readings
                </div>
              )}
            </div>
          </div>

          <div className="bar-legend-row compact-legend">
            <span className="legend-item"><span className="legend-dot dot-low"></span> Low (&lt;70)</span>
            <span className="legend-item"><span className="legend-dot dot-normal"></span> In Range ({timeInRange.inRangePercent}%)</span>
            <span className="legend-item"><span className="legend-dot dot-high"></span> High (&gt;140)</span>
          </div>
        </div>
      </div>

      {/* Floating Action Button '+' (Reference Image 4) */}
      <button
        type="button"
        className="floating-add-btn"
        onClick={onOpenAddModal}
        aria-label="Add new blood glucose reading"
        title="Add new blood glucose reading"
      >
        <Plus size={26} />
      </button>
    </div>
  );
};
