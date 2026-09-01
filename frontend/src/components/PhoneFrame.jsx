import React from 'react';

export default function PhoneFrame({ children, bottomNav, showBottomNav = true }) {
  return (
    <div className="phone-wrapper">
      <div className="phone-outer">

        {/* Side Buttons — Left (volume) */}
        <div className="phone-side-left">
          <div className="phone-btn" style={{ height: 20, marginTop: 10 }} />
          <div className="phone-btn phone-btn-long" />
          <div className="phone-btn phone-btn-long" />
        </div>

        {/* Side Buttons — Right (power) */}
        <div className="phone-side-right">
          <div className="phone-btn" style={{ height: 52 }} />
        </div>

        {/* Phone Body */}
        <div className="phone-body">

          {/* Dynamic Island */}
          <div className="dynamic-island">
            <div className="dynamic-island-camera" />
            <div className="dynamic-island-speaker" />
          </div>

          {/* Screen content */}
          <div className="phone-screen">
            {children}
          </div>

          {/* Bottom Navigation */}
          {showBottomNav && bottomNav && (
            <nav className="phone-bottom-nav">
              {bottomNav}
            </nav>
          )}

          {/* Home Indicator */}
          <div className="home-indicator" />
        </div>
      </div>
    </div>
  );
}
