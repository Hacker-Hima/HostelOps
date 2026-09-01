import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setLayoutMode, addToast } from '../redux/ticketSlice';
import { audioFx } from '../utils/audioFx';
import { useTranslation } from '../utils/translations';

const LAYOUTS = [
  { id: 'bento',  label: 'Bento Grid',   icon: '🍱', desc: 'Apple Vision Bento workspace with floating dock' },
  { id: 'cyber',  label: 'Cyber HUD',    icon: '⚡', desc: 'Futuristic sci-fi holographic telemetry layout' },
  { id: 'studio', label: 'Exec Studio',  icon: '🏛️', desc: 'High-density multi-column command room' },
  { id: 'dual',   label: 'Dual Split',   icon: '📱', desc: 'Live side-by-side Mobile Simulator + Desktop' },
];

export default function LayoutSwitcher({ compact = false }) {
  const dispatch = useDispatch();
  const { layoutMode } = useSelector((s) => s.ticketStore);
  const { t } = useTranslation();

  const handleSelect = (id, label) => {
    dispatch(setLayoutMode(id));
    audioFx.playPop(520);
    dispatch(addToast({
      id: `layout-toast-${Date.now()}`,
      message: `Layout switched to ${label} Mode 🚀`,
      type: 'info',
    }));
  };

  return (
    <div className={`layout-switcher-bar ${compact ? 'compact' : ''}`}>
      <span className="layout-switcher-label">
        <span className="layout-dot-pulse" />
        Layout
      </span>
      <div className="layout-pills">
        {LAYOUTS.map((lay) => {
          const isActive = layoutMode === lay.id;
          return (
            <button
              key={lay.id}
              className={`layout-pill-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleSelect(lay.id, lay.label)}
              title={`${lay.label}: ${lay.desc}`}
            >
              <span className="layout-pill-icon">{lay.icon}</span>
              <span className="layout-pill-text">{lay.label}</span>
              {isActive && <span className="layout-active-spark" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
