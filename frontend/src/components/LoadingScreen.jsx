import React, { useState, useEffect } from 'react';
import { Building2, ShieldCheck, Database, Layers, CheckCircle2 } from 'lucide-react';

export const LoadingScreen = ({
  title = 'Hostel Asset Management System',
  subtitle = 'Secure Session Verification & Inventory Sync',
  minHeight = '100vh',
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  const steps = [
    { text: 'Verifying JWT authorization token...', icon: ShieldCheck },
    { text: 'Validating role permissions (RBAC)...', icon: ShieldCheck },
    { text: 'Connecting to MongoDB asset database...', icon: Database },
    { text: 'Synchronizing room assets & audit records...', icon: Layers },
    { text: 'Finalizing secure environment...', icon: CheckCircle2 },
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 600);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + Math.floor(Math.random() * 15) + 8;
      });
    }, 250);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [steps.length]);

  const CurrentIcon = steps[stepIndex].icon;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: minHeight,
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #eff6ff 100%)',
        padding: '2rem',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px -15px rgba(30, 58, 138, 0.12), 0 0 1px 1px rgba(0,0,0,0.05)',
          padding: '2.5rem 2rem',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Subtle top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)',
          }}
        />

        {/* Brand Icon with Pulsing Effect */}
        <div
          style={{
            position: 'relative',
            width: '84px',
            height: '84px',
            margin: '0 auto 1.5rem auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Animated pulse background ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.12)',
              animation: 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
            }}
          >
            <Building2 size={32} color="#ffffff" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: '#0f172a',
            marginBottom: '0.4rem',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: '0.85rem',
            color: '#64748b',
            marginBottom: '1.75rem',
          }}
        >
          {subtitle}
        </p>

        {/* Progress Bar Container */}
        <div
          style={{
            background: '#f1f5f9',
            borderRadius: '999px',
            height: '8px',
            overflow: 'hidden',
            marginBottom: '1.25rem',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, progress)}%`,
              background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
              borderRadius: '999px',
              transition: 'width 0.3s ease-in-out',
            }}
          />
        </div>

        {/* Dynamic Status Text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '26px',
            marginBottom: '1.5rem',
          }}
        >
          <CurrentIcon size={16} color="#2563eb" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            {steps[stepIndex].text}
          </span>
        </div>

        {/* System Badges */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.4rem',
            flexWrap: 'wrap',
            paddingTop: '1rem',
            borderTop: '1px solid #f1f5f9',
          }}
        >
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#475569',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
            }}
          >
            Express REST API
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#475569',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
            }}
          >
            MongoDB
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: '#475569',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '0.2rem 0.5rem',
              borderRadius: '4px',
            }}
          >
            JWT Auth
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulseRing {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.2;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
