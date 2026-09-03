import React, { useEffect, useState } from 'react';

/**
 * AestheticLoader â€” Branded SVG building draw-in animation.
 * The building outline strokes in sequentially, followed by the HostelOps
 * wordmark fading in, a live progress bar, and a step list.
 *
 * Props:
 *   fullScreen  â€” renders as a fixed full-page overlay
 *   overlay     â€” renders as a modal glass overlay
 *   compact     â€” smaller variant (no step list)
 *   showSteps   â€” show/hide the step list
 *   steps       â€” array of step label strings
 *   currentStep â€” controlled current step index (optional)
 *   message     â€” short loading label shown below progress bar
 */
export default function AestheticLoader({
  fullScreen  = false,
  overlay     = false,
  compact     = false,
  showSteps   = true,
  steps       = [
    'Connecting to secure gateway',
    'Hydrating real-time ticket state',
    'Syncing room telemetry',
  ],
  currentStep = null,
  message     = 'Loading HostelOps...',
}) {
  const [progress,      setProgress]      = useState(0);
  const [internalStep,  setInternalStep]  = useState(0);
  const [stepLabel,     setStepLabel]     = useState(steps[0] || '');

  const activeStep = currentStep != null ? currentStep : internalStep;

  useEffect(() => {
    if (currentStep != null) return; // externally controlled
    const totalDuration = 2200; // ms to reach ~90%
    const tickMs = 40;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += tickMs;
      const t = elapsed / totalDuration;
      const eased = 1 - Math.pow(1 - t, 2); // ease-out quad
      setProgress(Math.min(90, Math.round(eased * 90)));

      // Advance step label at 33% intervals
      const stepIdx = Math.min(
        Math.floor(t * steps.length),
        steps.length - 1
      );
      setInternalStep(stepIdx);
      setStepLabel(steps[stepIdx] || '');

      if (elapsed >= totalDuration) clearInterval(timer);
    }, tickMs);

    return () => clearInterval(timer);
  }, [currentStep, steps]);

  // Sync step label when externally controlled
  useEffect(() => {
    if (currentStep != null && steps[currentStep]) {
      setStepLabel(steps[currentStep]);
      setProgress(Math.round((currentStep / steps.length) * 100));
    }
  }, [currentStep, steps]);

  const content = (
    <div className="loader-brand-container">

      {/* â”€â”€ SVG Building Animation â”€â”€ */}
      <svg
        className="loader-building-svg"
        viewBox="0 0 120 140"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="HostelOps building illustration"
        role="img"
      >
        {/* Building outline */}
        <g className="loader-bld-outline">
          {/* Main building body */}
          <rect x="15" y="40" width="90" height="90" rx="3" />
          {/* Left wing */}
          <rect x="5"  y="65" width="15" height="65" rx="2" />
          {/* Right wing */}
          <rect x="100" y="65" width="15" height="65" rx="2" />
        </g>

        {/* Floor lines */}
        <g className="loader-bld-floors">
          <line x1="15" y1="70"  x2="105" y2="70"  />
          <line x1="15" y1="95"  x2="105" y2="95"  />
          <line x1="15" y1="110" x2="105" y2="110" />
        </g>

        {/* Windows */}
        <g className="loader-bld-windows">
          {/* Row 1 */}
          <rect x="25" y="48" width="12" height="10" rx="1.5" />
          <rect x="44" y="48" width="12" height="10" rx="1.5" />
          <rect x="63" y="48" width="12" height="10" rx="1.5" />
          <rect x="82" y="48" width="12" height="10" rx="1.5" />
          {/* Row 2 */}
          <rect x="25" y="75" width="12" height="10" rx="1.5" />
          <rect x="44" y="75" width="12" height="10" rx="1.5" />
          <rect x="63" y="75" width="12" height="10" rx="1.5" />
          <rect x="82" y="75" width="12" height="10" rx="1.5" />
          {/* Row 3 */}
          <rect x="25" y="98" width="12" height="8" rx="1.5" />
          <rect x="63" y="98" width="12" height="8" rx="1.5" />
          <rect x="82" y="98" width="12" height="8" rx="1.5" />
        </g>

        {/* Door */}
        <g className="loader-bld-door">
          <rect x="49" y="113" width="22" height="17" rx="2" />
          <line x1="60" y1="113" x2="60" y2="130" />
        </g>

        {/* Flagpole + flag */}
        <g className="loader-bld-flag">
          <line x1="60" y1="40" x2="60" y2="18" />
          <polyline points="60,18 78,24 60,30" />
        </g>
      </svg>

      {/* â”€â”€ Wordmark â”€â”€ */}
      <div className="loader-logo-mark">HostelOps</div>

      {/* â”€â”€ Progress bar â”€â”€ */}
      {!compact && (
        <>
          <div className="loader-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="loader-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="loader-step-label">{stepLabel}</div>
        </>
      )}

      {/* â”€â”€ Step list â”€â”€ */}
      {showSteps && !compact && steps.length > 0 && (
        <div className="loader-steps-list" role="list">
          {steps.map((step, idx) => {
            const isDone    = idx < activeStep;
            const isCurrent = idx === activeStep;
            return (
              <div
                key={step}
                className={`loader-step-row ${isDone ? 'done' : isCurrent ? 'active' : 'pending'}`}
                role="listitem"
              >
                <div style={{ flexShrink: 0, width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isDone    && <span className="loader-step-check">\u2713</span>}
                  {isCurrent && <span className="loader-step-ring" />}
                  {!isDone && !isCurrent && <span className="loader-step-idle" />}
                </div>
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );

  if (fullScreen) {
    return (
      <div className="aesthetic-loader-fullscreen" role="status" aria-live="polite" aria-label={message}>
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="aesthetic-loader-overlay" role="status" aria-live="polite" aria-label={message}>
        <div className="loader-glass-modal">
          {content}
        </div>
      </div>
    );
  }

  return content;
}