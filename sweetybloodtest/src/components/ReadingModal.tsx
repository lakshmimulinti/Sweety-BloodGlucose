import React, { useState, useEffect } from 'react';
import { Reading, api } from '../services/api';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';

interface ReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialReading?: Reading | null;
  defaultDate?: string;
  defaultSlot?: string;
}

export const ALLOWED_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner'
];

export const ReadingModal: React.FC<ReadingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialReading,
  defaultDate,
  defaultSlot
}) => {
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const getTimeStr = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const [value, setValue] = useState<string>('');
  const [date, setDate] = useState<string>(defaultDate || getTodayStr());
  const [time, setTime] = useState<string>(getTimeStr());
  const [slot, setSlot] = useState<string>(defaultSlot || ALLOWED_SLOTS[0]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialReading) {
      setValue(String(initialReading.value));
      setDate(initialReading.date);
      setSlot(initialReading.slot);
      setNotes(initialReading.notes || '');
    } else {
      setValue('');
      setDate(defaultDate || getTodayStr());
      setTime(getTimeStr());
      setSlot(defaultSlot || ALLOWED_SLOTS[0]);
      setNotes('');
    }
    setError(null);
  }, [initialReading, defaultDate, defaultSlot, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side instant validations matching exact Kenpath requirements:
    // 1. Value is required
    if (!value || value.trim() === '') {
      setError('Please enter a glucose value.');
      return;
    }

    // 2. Value must be a whole number between 40 and 600
    const numVal = Number(value);
    if (!Number.isInteger(numVal) || numVal < 40 || numVal > 600) {
      setError('Value must be between 40 and 600 mg/dl.');
      return;
    }

    // 3. Date cannot be in the future
    const today = getTodayStr();
    if (date > today) {
      setError('Date cannot be in the future.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        date,
        slot,
        value: numVal,
        notes: notes ? `${notes} (Time: ${time})` : `Time: ${time}`
      };

      if (initialReading) {
        await api.readings.update(initialReading.id, payload);
      } else {
        await api.readings.add(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save reading.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="reading-modal-card">
        {/* Close icon */}
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>

        <h2 className="modal-title">
          {initialReading ? 'Edit Blood Glucose Reading' : 'Enter your Blood Glucose Reading.'}
        </h2>

        {error && (
          <div className="modal-error-alert" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-grid">
            {/* Blood Glucose Input */}
            <div className="modal-field">
              <label htmlFor="bloodGlucoseInput" className="modal-label">Blood Glucose</label>
              <div className="input-with-suffix">
                <input
                  id="bloodGlucoseInput"
                  type="number"
                  min="40"
                  max="600"
                  step="1"
                  placeholder="e.g. 119"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="modal-input"
                  autoFocus
                />
                <span className="input-suffix">mg/dL</span>
              </div>
            </div>

            {/* Date Input */}
            <div className="modal-field">
              <label htmlFor="readingDateInput" className="modal-label">Date</label>
              <div className="input-with-icon">
                <input
                  id="readingDateInput"
                  type="date"
                  max={getTodayStr()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="modal-input"
                />
                <Calendar size={18} className="field-icon" />
              </div>
            </div>

            {/* Time Input */}
            <div className="modal-field">
              <label htmlFor="readingTimeInput" className="modal-label">Time</label>
              <div className="input-with-icon">
                <input
                  id="readingTimeInput"
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="11:34 AM"
                  className="modal-input"
                />
                <Clock size={18} className="field-icon" />
              </div>
            </div>

            {/* Context / Slot Dropdown */}
            <div className="modal-field">
              <label htmlFor="readingSlotSelect" className="modal-label">Context</label>
              <select
                id="readingSlotSelect"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="modal-select"
              >
                {ALLOWED_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes Input */}
          <div className="modal-field-full">
            <label htmlFor="readingNotesInput" className="modal-label">Notes (Optional)</label>
            <input
              id="readingNotesInput"
              type="text"
              placeholder="e.g. Sourdough bread, felt energetic, 20 min walk"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="modal-input"
            />
          </div>

          {/* Action Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="modal-done-btn"
              disabled={loading}
            >
              {loading ? 'SAVING...' : 'DONE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

