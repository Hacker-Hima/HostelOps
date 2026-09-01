import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSoundEnabled } from '../redux/ticketSlice';
import { audioFx } from '../utils/audioFx';

export default function SoundToggle() {
  const dispatch = useDispatch();
  const { soundEnabled } = useSelector((s) => s.ticketStore);

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    dispatch(setSoundEnabled(nextVal));
    audioFx.setEnabled(nextVal);
    if (nextVal) {
      audioFx.playSuccess();
    }
  };

  return (
    <button
      className={`btn-icon sound-toggle-btn ${soundEnabled ? 'sound-active' : 'sound-muted'}`}
      onClick={toggleSound}
      title={soundEnabled ? 'Sound FX Enabled (Click to Mute)' : 'Sound FX Muted (Click to Enable)'}
      aria-label="Sound Toggle"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      <span style={{ fontSize: 13 }}>{soundEnabled ? '🔊' : '🔇'}</span>
      {soundEnabled && (
        <span className="sound-visualizer-wave">
          <span className="sound-bar" style={{ animationDelay: '0ms' }} />
          <span className="sound-bar" style={{ animationDelay: '150ms' }} />
          <span className="sound-bar" style={{ animationDelay: '300ms' }} />
        </span>
      )}
    </button>
  );
}
