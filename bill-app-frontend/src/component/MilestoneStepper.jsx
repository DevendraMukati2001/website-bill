// components/MilestoneStepper.jsx

import React from 'react';

export default function MilestoneStepper({ milestones = [] }) {
  if (!milestones.length) return null;

  const getColor = (status) => {
    if (status === 'paid') return '#16a34a';
    if (status === 'overdue') return '#dc2626';
    return '#f59e0b';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 12 }}>
      {milestones.map((m, i) => {
        const color = getColor(m.status);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {/* Connector line */}
            {i > 0 && (
              <div style={{
                position: 'absolute',
                top: 15,
                left: '-50%',
                width: '100%',
                height: 3,
                backgroundColor: color,
                zIndex: 0,
              }} />
            )}

            {/* Circle */}
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              backgroundColor: color,
              border: `1.5px solid ${color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              position: 'relative',
            }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 12 }}>
                {m.status === 'paid' ? '✓' : i + 1}
              </span>
            </div>

            {/* Label */}
            <span style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color }}>
              M-{m.milestoneNumber}
            </span>
          </div>
        );
      })}
    </div>
  );
}