import React from 'react';
import { Reading } from '../services/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

interface GlucoseChartProps {
  readings: Reading[];
}

export const GlucoseChart: React.FC<GlucoseChartProps> = ({ readings }) => {
  // Sort readings chronologically for charting
  const sorted = [...readings].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.id - b.id;
  });

  const chartData = sorted.map((r) => ({
    id: r.id,
    date: r.date.slice(5), // MM-DD
    fullDate: r.date,
    slot: r.slot,
    value: r.value,
    notes: r.notes
  }));

  if (chartData.length < 2) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <div className="chart-title-group">
            <TrendingUp size={20} className="text-indigo" />
            <h3 className="chart-title">Glucose Trend Line</h3>
          </div>
        </div>
        <div className="chart-empty">
          <Activity size={32} className="text-muted" />
          <p>Add at least 2 readings to visualize glucose fluctuation trends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title-group">
          <TrendingUp size={20} className="text-indigo" />
          <h3 className="chart-title">Blood Glucose Fluctuations & Target Range</h3>
        </div>
        <div className="chart-legend-badge">
          <span className="target-band-swatch"></span>
          <span>Target Range (70–140 mg/dL)</span>
        </div>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            
            {/* Shaded Normal Target Zone: 70 to 140 mg/dL */}
            <ReferenceArea
              y1={70}
              y2={140}
              fill="#ecfdf5"
              fillOpacity={0.7}
              stroke="#10b981"
              strokeDasharray="2 2"
            />
            
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="3 3" />
            <ReferenceLine y={140} stroke="#10b981" strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[40, 'auto']}
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              unit=" mg"
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const isHigh = d.value > 140;
                  const isLow = d.value < 70;
                  return (
                    <div className="custom-chart-tooltip">
                      <p className="tooltip-date font-bold">{d.fullDate}</p>
                      <p className="tooltip-slot">{d.slot}</p>
                      <p className="tooltip-value">
                        Glucose: <strong style={{ color: isHigh ? '#ef4444' : isLow ? '#3b82f6' : '#10b981' }}>{d.value} mg/dL</strong>
                      </p>
                      {d.notes && <p className="tooltip-notes">{d.notes}</p>}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Line
              type="monotone"
              dataKey="value"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4, fill: '#6366f1' }}
              activeDot={{ r: 7, stroke: '#4f46e5', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

