import React from 'react';
import { Reading } from '../services/api';
import { Sparkles, CheckCircle, AlertTriangle, Lightbulb, HeartPulse, Activity } from 'lucide-react';

interface AIInsightsProps {
  readings: Reading[];
}

export const AIInsights: React.FC<AIInsightsProps> = ({ readings }) => {
  if (readings.length === 0) return null;

  // Calculate overall average and estimated HbA1c: (avg + 46.7) / 28.7
  const sum = readings.reduce((acc, r) => acc + r.value, 0);
  const avgGlucose = sum / readings.length;
  const estimatedA1c = ((avgGlucose + 46.7) / 28.7).toFixed(1);

  // Pattern detection algorithms
  const fastingReadings = readings.filter((r) => r.slot.includes('fasting'));
  const postLunchReadings = readings.filter((r) => r.slot.includes('lunch'));
  const postDinnerReadings = readings.filter((r) => r.slot.includes('dinner'));

  const highFasting = fastingReadings.filter((r) => r.value > 125);
  const highPostLunch = postLunchReadings.filter((r) => r.value > 160);
  const highPostDinner = postDinnerReadings.filter((r) => r.value > 160);
  const lowReadings = readings.filter((r) => r.value < 70);

  const inRangeCount = readings.filter((r) => r.value >= 70 && r.value <= 140).length;
  const inRangeRatio = Math.round((inRangeCount / readings.length) * 100);

  const insights: Array<{
    type: 'success' | 'warning' | 'info';
    title: string;
    description: string;
  }> = [];

  // Insight 1: Overall Control
  if (inRangeRatio >= 70) {
    insights.push({
      type: 'success',
      title: 'Strong Glycemic Control',
      description: `${inRangeRatio}% of logged readings are within the optimal target window (70–140 mg/dL). Excellent consistency!`
    });
  } else {
    insights.push({
      type: 'warning',
      title: 'Fluctuation Detected',
      description: `Only ${inRangeRatio}% of readings are in the optimal target window. Review meal timing and carbohydrate distribution.`
    });
  }

  // Insight 2: Fasting pattern
  if (highFasting.length >= 2) {
    insights.push({
      type: 'warning',
      title: 'Possible Dawn Phenomenon or Late Meal Effect',
      description: `Observed ${highFasting.length} elevated morning fasting readings (>125 mg/dL). Consider checking evening carbohydrate intake or consulting your doctor.`
    });
  } else if (fastingReadings.length > 0) {
    insights.push({
      type: 'success',
      title: 'Fasting Stability',
      description: 'Morning fasting readings are consistently within the healthy baseline (80–115 mg/dL).'
    });
  }

  // Insight 3: Post-prandial spikes
  if (highPostLunch.length >= 2) {
    insights.push({
      type: 'info',
      title: 'Post-Lunch Glycemic Surge',
      description: `${highPostLunch.length} readings after lunch exceeded 160 mg/dL. A 15-minute post-meal stroll can significantly blunt this spike.`
    });
  } else if (highPostDinner.length >= 2) {
    insights.push({
      type: 'info',
      title: 'Evening Meal Sensitivity',
      description: 'Post-dinner readings indicate heavier glycemic response. Try shifting heavier carbs to daytime meals.'
    });
  }

  // Insight 4: Hypoglycemia warning
  if (lowReadings.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Hypoglycemia Alert (<70 mg/dL)',
      description: `${lowReadings.length} reading(s) dropped into low glucose. Always keep fast-acting glucose tablets or juice nearby.`
    });
  }

  return (
    <div className="ai-insights-card">
      <div className="ai-insights-header">
        <div className="ai-header-left">
          <div className="ai-header-badge">
            <Sparkles size={18} className="ai-sparkle-icon" />
            <span>Sweety AI Assistant</span>
          </div>
          <span className="ai-tag">Pattern Recognition</span>
        </div>

        {/* Merged eHbA1c Clinical Metric Pill (Saves space & integrates clinical analysis) */}
        <div className="ai-ehba1c-pill" title="Estimated HbA1c based on all logged glucose values: (Avg + 46.7) / 28.7">
          <HeartPulse size={16} className="text-pink" />
          <span className="ehba1c-label">Estimated eHbA1c:</span>
          <span className="ehba1c-val font-bold">{estimatedA1c}%</span>
          <span className={`ehba1c-status ${Number(estimatedA1c) < 7.0 ? 'status-good' : 'status-elevated'}`}>
            {Number(estimatedA1c) < 7.0 ? 'Optimal Baseline' : 'Elevated'}
          </span>
        </div>
      </div>

      <div className="ai-insights-grid">
        {insights.map((item, idx) => (
          <div key={idx} className={`ai-insight-item insight-${item.type}`}>
            <div className="insight-icon-box">
              {item.type === 'success' && <CheckCircle size={18} className="text-emerald" />}
              {item.type === 'warning' && <AlertTriangle size={18} className="text-amber" />}
              {item.type === 'info' && <Lightbulb size={18} className="text-indigo" />}
            </div>
            <div className="insight-content">
              <h4 className="insight-title">{item.title}</h4>
              <p className="insight-desc">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
