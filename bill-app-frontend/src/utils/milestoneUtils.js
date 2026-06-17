// utils/milestoneUtils.js

export const STATUSES = ['pending', 'partial', 'paid', 'overdue'];

export const STATUS_LABELS = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
};

export const STATUS_COLORS = {
  pending: {
    bg: '#fef3c7',
    border: '#f59e0b',
    text: '#b45309',
  },
  partial: {
    bg: '#dbeafe',
    border: '#2563eb',
    text: '#1d4ed8',
  },
  paid: {
    bg: '#dcfce7',
    border: '#16a34a',
    text: '#15803d',
  },
  overdue: {
    bg: '#fee2e2',
    border: '#dc2626',
    text: '#b91c1c',
  },
};

export const STEP_ICONS = {
  pending: 'circle-dot',
  partial: 'clock',
  paid: 'check',
  overdue: 'alert-circle',
};