import React from 'react';
import { Reading } from '../services/api';
import { ALLOWED_SLOTS } from './ReadingModal';
import { CheckCircle2, Clock, Plus, Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';

interface DailySlotsTrackerProps {
  selectedDate: string;
  readings: Reading[];
  onOpenAddModalWithSlot: (slot: string, date: string) => void;
  onEdit: (reading: Reading) => void;
  onDelete: (id: number) => void;
}

export const DailySlotsTracker: React.FC<DailySlotsTrackerProps> = ({
  selectedDate,
  readings,
  onOpenAddModalWithSlot,
  onEdit,
  onDelete
}) => {
  // Filter readings for the selected date
  const dayReadings = readings.filter((r) => r.date === selectedDate);

  const getGlucoseStatus = (val: number) => {
    if (val < 70) return { label: 'Low', className: 'badge-low', color: '#2563eb' };
    if (val <= 140) return { label: 'In Range', className: 'badge-optimal', color: '#059669' };
    if (val <= 180) return { label: 'Elevated', className: 'badge-elevated', color: '#b45309' };
    return { label: 'High', className: 'badge-high', color: '#dc2626' };
  };

  const completedCount = dayReadings.length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  return (
    <div className="daily-tracker-card">
      <div className="daily-tracker-header">
        <div className="tracker-title-group">
          <div className="tracker-icon-box">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="tracker-title">Daily 4-Slot Protocol ({selectedDate})</h3>
            <p className="tracker-subtitle">
              Kenpath standard requirement: Track up to 4 daily intervals (Fasting, Post-Breakfast, Post-Lunch, Post-Dinner)
            </p>
          </div>
        </div>

        <div className="tracker-progress-badge">
          <span className="progress-text">{completedCount} of 4 Completed</span>
          <div className="progress-mini-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {completedCount === 0 && (
        <div className="daily-empty-alert">
          <AlertCircle size={18} className="text-amber" />
          <span>No readings recorded yet for <strong>{selectedDate}</strong>. Click any slot below to record your first measurement.</span>
        </div>
      )}

      <div className="slots-grid-4">
        {ALLOWED_SLOTS.map((slotName) => {
          const reading = dayReadings.find((r) => r.slot === slotName);

          if (reading) {
            const status = getGlucoseStatus(reading.value);
            return (
              <div key={slotName} className="slot-box slot-box-completed">
                <div className="slot-box-top">
                  <span className="slot-status-pill completed-pill">
                    <CheckCircle2 size={13} />
                    <span>Completed</span>
                  </span>
                  <div className="slot-actions">
                    <button
                      type="button"
                      className="slot-action-btn"
                      onClick={() => onEdit(reading)}
                      title={`Edit ${slotName}`}
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="slot-action-btn delete"
                      onClick={() => {
                        if (window.confirm(`Delete reading for ${slotName}?`)) {
                          onDelete(reading.id);
                        }
                      }}
                      title={`Delete ${slotName}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h4 className="slot-name">{slotName}</h4>

                <div className="slot-value-row">
                  <span className="slot-val-num" style={{ color: status.color }}>
                    {reading.value}
                  </span>
                  <span className="slot-val-unit">mg/dL</span>
                </div>

                <div className="slot-footer">
                  <span className={`status-badge ${status.className}`}>
                    {status.label}
                  </span>
                  {reading.notes && (
                    <span className="slot-note-preview" title={reading.notes}>
                      {reading.notes}
                    </span>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={slotName} className="slot-box slot-box-pending">
              <div className="slot-box-top">
                <span className="slot-status-pill pending-pill">
                  <Clock size={13} />
                  <span>Pending</span>
                </span>
              </div>

              <h4 className="slot-name">{slotName}</h4>

              <div className="slot-value-row pending-val">
                <span className="slot-empty-dash">— —</span>
              </div>

              <button
                type="button"
                className="slot-log-btn"
                onClick={() => onOpenAddModalWithSlot(slotName, selectedDate)}
              >
                <Plus size={14} />
                <span>Log {slotName.split(' ')[0]}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

