import React from 'react';
import { ReportMetrics } from '../services/api';
import { Activity, TrendingUp, BarChart3, HelpCircle, Plus } from 'lucide-react';

interface KPICardsProps {
  metrics: ReportMetrics | null;
  periodLabel: string;
  onOpenAddModal: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  metrics,
  periodLabel,
  onOpenAddModal
}) => {
  const avg = metrics?.average ?? null;
  const highest = metrics?.highest ?? null;
  const lowest = metrics?.lowest ?? null;
  const count = metrics?.count ?? 0;
  const variation = (highest !== null && lowest !== null) ? (highest - lowest) : null;

  // Standard clinical formula for estimated HbA1c: (avg + 46.7) / 28.7
  const estimatedA1c = avg ? ((avg + 46.7) / 28.7).toFixed(1) : null;

  const timeInRange = metrics?.timeInRange || {
    lowPercent: 0,
    inRangePercent: count > 0 ? 100 : 0,
    highPercent: 0
  };

  return (
    <div className="kpi-dashboard-wrapper">
      <div className="kpi-section-header">
        <div>
          <h2 className="kpi-section-title">Health Overview</h2>
          <p className="kpi-section-subtitle">Showing glucose health metrics for {periodLabel}</p>
        </div>
      </div>

      <div className="kpi-grid">
        {/* Card 1: Average Glucose (Image 4) */}
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-title">Average Glucose</span>
            <span className="kpi-info-icon" title="Average of all readings in the selected period (rounded to 1 decimal)">
              <HelpCircle size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-primary-val text-indigo">
              {avg !== null ? avg : '—'}
            </span>
            <span className="kpi-unit"> mg/dl</span>
          </div>
          <p className="kpi-footer-text">
            {avg ? (avg <= 140 ? '✓ Within target range' : '⚠ Above optimal target') : 'No data recorded'}
          </p>
        </div>

        {/* Card 2: Glucose Variation (Image 4) */}
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-title">Glucose Variation</span>
            <span className="kpi-info-icon" title="Difference between Highest and Lowest reading">
              <HelpCircle size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-primary-val text-amber">
              {variation !== null ? variation : '—'}
            </span>
            <span className="kpi-unit"> mg/dl</span>
          </div>
          <p className="kpi-footer-text">
            {lowest !== null && highest !== null ? `Lowest: ${lowest} | Highest: ${highest}` : 'Requires readings'}
          </p>
        </div>

        {/* Card 3: Time in Range (Image 4) */}
        <div className="kpi-card kpi-card-wide">
          <div className="kpi-card-top">
            <span className="kpi-card-title">Time in range</span>
            <span className="kpi-info-icon" title="Percentage breakdown: Low (<70 mg/dl), In Range (70-140 mg/dl), High (>140 mg/dl)">
              <HelpCircle size={16} />
            </span>
          </div>

          <div className="time-in-range-bar-container">
            <div className="time-in-range-bar">
              {timeInRange.lowPercent > 0 && (
                <div
                  className="bar-segment bar-low"
                  style={{ width: `${timeInRange.lowPercent}%` }}
                  title={`Low (<70 mg/dl): ${timeInRange.lowPercent}%`}
                >
                  {timeInRange.lowPercent >= 8 && `${timeInRange.lowPercent}%`}
                </div>
              )}
              {timeInRange.inRangePercent > 0 && (
                <div
                  className="bar-segment bar-normal"
                  style={{ width: `${timeInRange.inRangePercent}%` }}
                  title={`In Range (70-140 mg/dl): ${timeInRange.inRangePercent}%`}
                >
                  {timeInRange.inRangePercent >= 8 && `${timeInRange.inRangePercent}%`}
                </div>
              )}
              {timeInRange.highPercent > 0 && (
                <div
                  className="bar-segment bar-high"
                  style={{ width: `${timeInRange.highPercent}%` }}
                  title={`High (>140 mg/dl): ${timeInRange.highPercent}%`}
                >
                  {timeInRange.highPercent >= 8 && `${timeInRange.highPercent}%`}
                </div>
              )}
              {count === 0 && (
                <div className="bar-segment bar-empty" style={{ width: '100%' }}>
                  No Readings Recorded
                </div>
              )}
            </div>
          </div>

          <div className="bar-legend-row">
            <span className="legend-item"><span className="legend-dot dot-low"></span> Low (&lt;70)</span>
            <span className="legend-item"><span className="legend-dot dot-normal"></span> In Range (70-140)</span>
            <span className="legend-item"><span className="legend-dot dot-high"></span> High (&gt;140)</span>
          </div>
        </div>

        {/* Card 4: Estimated HbA1c (Image 4) */}
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-title">eHbA1c</span>
            <span className="kpi-info-icon" title="Estimated HbA1c calculated from average glucose: (Avg + 46.7) / 28.7">
              <HelpCircle size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-primary-val text-indigo">
              {estimatedA1c !== null ? estimatedA1c : '—'}
            </span>
            <span className="kpi-unit"> %</span>
          </div>
          <p className="kpi-footer-text">
            {estimatedA1c ? (Number(estimatedA1c) < 7.0 ? '✓ Optimal diabetic target' : '⚠ Elevated target') : 'Based on average'}
          </p>
        </div>

        {/* Card 5: Total Readings */}
        <div className="kpi-card">
          <div className="kpi-card-top">
            <span className="kpi-card-title">Total Readings</span>
            <span className="kpi-info-icon" title="Total number of readings logged in this period">
              <HelpCircle size={16} />
            </span>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-primary-val text-slate">
              {count}
            </span>
            <span className="kpi-unit"> entries</span>
          </div>
          <p className="kpi-footer-text">
            Max 4 readings / day
          </p>
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
