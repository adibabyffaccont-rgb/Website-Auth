import { useCallback, useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  moveSpeed: number;
  direction: number;
}

export default function AdvancedParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isActive: false });
  const lastTimeRef = useRef<number>(0);

  const createStar = useCallback((x?: number, y?: number): Star => {
    return {
      x: x ?? Math.random() * window.innerWidth,
      y: y ?? Math.random() * window.innerHeight,
      size: Math.random() * 2 + 0.5, // Very small stars
      opacity: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.01,
      twinklePhase: Math.random() * Math.PI * 2,
      moveSpeed: Math.random() * 0.3 + 0.1, // Very slow movement
      direction: Math.random() * Math.PI * 2
    };
  }, []);

  const initializeStars = useCallback(() => {
    starsRef.current = [];
    for (let i = 0; i < 80; i++) { // More stars, but lighter
      starsRef.current.push(createStar());
    }
  }, [createStar]);

  const drawStar = useCallback((ctx: CanvasRenderingContext2D, star: Star) => {
    const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;
    const currentOpacity = star.opacity * twinkle;
    
    ctx.save();
    ctx.globalAlpha = currentOpacity;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = star.size * 2;
    ctx.shadowColor = '#FFFFFF';
    
    // Draw simple star shape
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add subtle cross for star effect
    if (star.size > 1) {
      ctx.globalAlpha = currentOpacity * 0.5;
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = '#FFFFFF';
      
      ctx.beginPath();
      ctx.moveTo(star.x - star.size * 2, star.y);
      ctx.lineTo(star.x + star.size * 2, star.y);
      ctx.moveTo(star.x, star.y - star.size * 2);
      ctx.lineTo(star.x, star.y + star.size * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }, []);

  const animate = useCallback((currentTime: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = currentTime - lastTimeRef.current;
    if (deltaTime < 16.67) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    lastTimeRef.current = currentTime;

    // Clear canvas with dark background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw stars
    for (let i = 0; i < starsRef.current.length; i++) {
      const star = starsRef.current[i];
      
      // Update twinkling
      star.twinklePhase += star.twinkleSpeed;
      
      // Very subtle movement
      star.x += Math.cos(star.direction) * star.moveSpeed;
      star.y += Math.sin(star.direction) * star.moveSpeed;
      
      // Wrap around screen edges
      if (star.x < -10) star.x = canvas.width + 10;
      if (star.x > canvas.width + 10) star.x = -10;
      if (star.y < -10) star.y = canvas.height + 10;
      if (star.y > canvas.height + 10) star.y = -10;
      
      // Mouse interaction - very subtle
      if (mouseRef.current.isActive) {
        const dx = mouseRef.current.x - star.x;
        const dy = mouseRef.current.y - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 100) {
          const force = (100 - distance) / 100 * 0.02;
          star.x += (dx / distance) * force;
          star.y += (dy / distance) * force;
        }
      }
      
      drawStar(ctx, star);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [drawStar]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
    mouseRef.current.isActive = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.isActive = false;
  }, []);

  const handleMouseEnter = useCallback(() => {
    mouseRef.current.isActive = true;
  }, []);

  useEffect(() => {
    resizeCanvas();
    initializeStars();
    animationRef.current = requestAnimationFrame(animate);

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [resizeCanvas, initializeStars, animate, handleMouseMove, handleMouseLeave, handleMouseEnter]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'transparent'
      }}
    />
  );
}