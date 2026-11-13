import React, { useState } from 'react';
import { Reading } from '../services/api';
import { Edit2, Trash2, Calendar, Plus, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface LogsTableProps {
  readings: Reading[];
  onEdit: (reading: Reading) => void;
  onDelete: (id: number) => void;
  onAddNew: () => void;
  loading: boolean;
}

export const LogsTable: React.FC<LogsTableProps> = ({
  readings,
  onEdit,
  onDelete,
  onAddNew,
  loading
}) => {
  const [filterSlot, setFilterSlot] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'7' | '14' | '30' | 'all'>('7');
  const [searchDate, setSearchDate] = useState<string>('');

  // Filter readings based on active range tab
  const getFilteredReadings = () => {
    let list = [...readings];

    if (searchDate) {
      list = list.filter((r) => r.date === searchDate);
    }

    if (filterSlot !== 'all') {
      list = list.filter((r) => r.slot === filterSlot);
    }

    if (activeTab !== 'all') {
      const days = parseInt(activeTab, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      list = list.filter((r) => r.date >= cutoffStr);
    }

    return list;
  };

  const filtered = getFilteredReadings();

  // Helper for status badge styling
  const getGlucoseStatus = (val: number) => {
    if (val < 70) return { label: 'Low', className: 'badge-low', color: '#3b82f6' };
    if (val <= 140) return { label: 'In Range', className: 'badge-optimal', color: '#10b981' };
    if (val <= 180) return { label: 'Elevated', className: 'badge-elevated', color: '#f59e0b' };
    return { label: 'High', className: 'badge-high', color: '#ef4444' };
  };

  return (
    <div className="logs-card">
      <div className="logs-header-bar">
        <div className="logs-title-group">
          <h2 className="logs-heading">Glucose Logs</h2>
          <span className="logs-badge-count">{filtered.length} entries</span>
        </div>

        <div className="logs-header-actions">
          {/* Quick Date Search */}
          <div className="date-filter-box">
            <Calendar size={16} className="date-filter-icon" />
            <input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="date-filter-input"
              title="Filter by specific date"
            />
            {searchDate && (
              <button
                type="button"
                className="clear-filter-btn"
                onClick={() => setSearchDate('')}
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            className="add-reading-btn"
            onClick={onAddNew}
          >
            <Plus size={18} />
            <span>Add Reading</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar (Image 3 Reference: 7 Days / 14 Days / 30 Days / All Time) */}
      <div className="logs-tabs-row">
        <div className="tabs-group">
          <button
            type="button"
            className={`tab-btn ${activeTab === '7' ? 'active' : ''}`}
            onClick={() => setActiveTab('7')}
          >
            7 Days
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === '14' ? 'active' : ''}`}
            onClick={() => setActiveTab('14')}
          >
            14 Days
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === '30' ? 'active' : ''}`}
            onClick={() => setActiveTab('30')}
          >
            30 Days
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Time
          </button>
        </div>

        {/* Slot Dropdown filter */}
        <div className="slot-filter-select-wrapper">
          <Filter size={15} />
          <select
            value={filterSlot}
            onChange={(e) => setFilterSlot(e.target.value)}
            className="slot-filter-select"
          >
            <option value="all">All Slots</option>
            <option value="Morning (fasting)">Morning (fasting)</option>
            <option value="After breakfast">After breakfast</option>
            <option value="After lunch">After lunch</option>
            <option value="After dinner">After dinner</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="logs-loading-state">
          <div className="spinner"></div>
          <p>Loading your readings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="logs-empty-state">
          <div className="empty-icon-circle">
            <Calendar size={32} />
          </div>
          <h3>No readings recorded for this period</h3>
          <p>Start tracking up to 4 readings a day to generate meaningful clinical reports.</p>
          <button
            type="button"
            className="empty-action-btn"
            onClick={onAddNew}
          >
            <Plus size={16} />
            <span>Record First Reading</span>
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="glucose-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Blood Sugar</th>
                <th>Status</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const status = getGlucoseStatus(item.value);
                return (
                  <tr key={item.id} className="glucose-row">
                    <td className="row-date font-medium">{item.date}</td>
                    <td className="row-slot">
                      <span className="slot-pill">{item.slot}</span>
                    </td>
                    <td className="row-value">
                      <span className="glucose-number" style={{ color: status.color }}>
                        {item.value}
                      </span>
                      <span className="glucose-unit"> mg/dL</span>
                    </td>
                    <td>
                      <span className={`status-badge ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="row-notes" title={item.notes || ''}>
                      {item.notes || '—'}
                    </td>
                    <td className="row-actions" style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="action-icon-btn edit-btn"
                        onClick={() => onEdit(item)}
                        title="Edit Reading"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        className="action-icon-btn delete-btn"
                        onClick={() => {
                          if (window.confirm(`Delete reading for ${item.date} (${item.slot})?`)) {
                            onDelete(item.id);
                          }
                        }}
                        title="Delete Reading"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

