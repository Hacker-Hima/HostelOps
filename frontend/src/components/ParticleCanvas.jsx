import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

const THEME_COLORS = {
  purple: { r: 124, g: 58,  b: 237 },
  cyan:   { r: 6,   g: 182, b: 212 },
  green:  { r: 16,  g: 185, b: 129 },
  orange: { r: 249, g: 115, b: 22  },
  red:    { r: 239, g: 68,  b: 68  },
  pink:   { r: 236, g: 72,  b: 153 },
  cyber:  { r: 0,   g: 255, b: 200 },
  gold:   { r: 245, g: 158, b: 11  },
  frost:  { r: 59,  g: 130, b: 246 },
};

export default function ParticleCanvas() {
  const canvasRef = useRef(null);
  const { colorTheme, backgroundEffect, themeMode } = useSelector((s) => s.ticketStore);

  useEffect(() => {
    if (backgroundEffect === 'minimal') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: null, y: null, radius: 120 };
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const color = THEME_COLORS[colorTheme] || THEME_COLORS.purple;
    const isLight = themeMode === 'light';
    const particleCount = Math.min(Math.floor((width * height) / 16000), 75);

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.size = Math.random() * 2 + 1;
        this.baseSize = this.size;
        this.pulse = Math.random() * Math.PI;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.pulse += 0.02;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        if (mouse.x != null && mouse.y != null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 3;
            this.y -= (dy / dist) * force * 3;
            this.size = this.baseSize + force * 2;
          } else {
            this.size = this.baseSize + Math.sin(this.pulse) * 0.5;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
        const alpha = isLight ? 0.35 : 0.65;
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.shadowBlur = isLight ? 0 : 8;
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
        ctx.fill();
      }
    }

    const particles = Array.from({ length: particleCount }, () => new Particle());

    const connectParticles = () => {
      const maxDistance = 110;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const opacity = (1 - dist / maxDistance) * (isLight ? 0.12 : 0.22);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Background styling variations
      if (backgroundEffect === 'grid') {
        const gridSize = 40;
        ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.025)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      if (backgroundEffect === 'particles' || backgroundEffect === 'grid') {
        connectParticles();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [colorTheme, backgroundEffect, themeMode]);

  if (backgroundEffect === 'minimal') return null;

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity: backgroundEffect === 'aura' ? 0.35 : 0.85,
        transition: 'opacity 0.5s ease',
      }}
    />
  );
}
