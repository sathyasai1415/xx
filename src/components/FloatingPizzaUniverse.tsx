import React, { useEffect, useRef, useState } from 'react';

const FLOATING_ELEMENTS = [
  // Comparison Elements (10%)
  { type: 'text', content: 'SAVE $5', class: 'font-black text-green-500 bg-green-950/40 border border-green-500/30 px-3 py-1 rounded-full whitespace-nowrap' },
  { type: 'text', content: 'BEST DEAL', class: 'font-black text-yellow-500 bg-yellow-950/40 border border-yellow-500/30 px-3 py-1 rounded-full whitespace-nowrap' },
  { type: 'text', content: 'FASTEST', class: 'font-black text-blue-500 bg-blue-950/40 border border-blue-500/30 px-3 py-1 rounded-full whitespace-nowrap' },
  { type: 'text', content: '$14.99', class: 'font-black text-white bg-white/10 px-3 py-1 rounded-full whitespace-nowrap shadow-[0_0_15px_rgba(255,255,255,0.2)]' },
  { type: 'text', content: '30 MIN', class: 'font-black text-purple-400 bg-purple-950/40 border border-purple-500/30 px-3 py-1 rounded-full whitespace-nowrap' },
  // Pizza Ingredients (20% - using emojis because we lack separate realistic PNGs)
  { type: 'emoji', content: '🍅' },
  { type: 'emoji', content: '🍄' },
  { type: 'emoji', content: '🧅' },
  { type: 'emoji', content: '🫑' },
  { type: 'emoji', content: '🧀' },
  { type: 'emoji', content: '🌿' },
  // The remaining 70% will be handled dynamically as pure particles
];

interface FloatingObject {
  id: number;
  type: string;
  content: string;
  cssClass: string;
  x: number;
  y: number;
  z: number; // depth: 0 to 1
  size: number;
  speedX: number;
  speedY: number;
  speedRot: number;
  rot: number;
  baseOpacity: number;
  blur: number;
}

export function FloatingPizzaUniverse() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const objectsRef = useRef<FloatingObject[]>([]);
  const requestRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef({ y: 0, targetY: 0 });

  useEffect(() => {
    // Initialization
    const isMobile = window.innerWidth < 768;
    // Lowered numObjects slightly for performance, most elements are glowing particles
    const numObjects = isMobile ? 12 : 30;

    const objects: FloatingObject[] = Array.from({ length: numObjects }).map((_, i) => {
      const z = Math.random(); // 0 (far) to 1 (near)
      const isForeground = z > 0.8;
      const isBackground = z < 0.3;
      
      let size, blur, baseOpacity;
      
      if (isForeground) {
        size = 60 + Math.random() * 60; // 60 - 120px
        blur = 3 + Math.random() * 5;
        baseOpacity = 0.5 + Math.random() * 0.3;
      } else if (isBackground) {
        size = 15 + Math.random() * 20; // 15 - 35px
        blur = 4 + Math.random() * 4;
        baseOpacity = 0.2 + Math.random() * 0.2;
      } else {
        size = 30 + Math.random() * 40; // 30 - 70px
        blur = Math.random() * 2;
        baseOpacity = 0.6 + Math.random() * 0.3;
      }

      const elType = FLOATING_ELEMENTS[Math.floor(Math.random() * FLOATING_ELEMENTS.length)];
      if (elType.type === 'text') {
        size = size * 0.5; // Text labels should be slightly smaller
      }

      return {
        id: i,
        type: elType.type,
        content: elType.content,
        cssClass: elType.class || '',
        x: Math.random() * 100, // vw
        y: Math.random() * 100, // vh
        z,
        size,
        speedX: (Math.random() - 0.5) * 0.03,
        speedY: (Math.random() - 0.5) * 0.03,
        speedRot: elType.type === 'text' ? 0 : (Math.random() - 0.5) * 0.4, // Don't spin text
        rot: elType.type === 'text' ? (Math.random() - 0.5) * 20 : Math.random() * 360,
        baseOpacity,
        blur
      };
    });

    objectsRef.current = objects;

    // Build DOM elements for objects
    if (canvasRef.current) {
      canvasRef.current.innerHTML = '';
      objects.forEach(obj => {
        const el = document.createElement('div');
        el.className = 'floating-ingredient absolute will-change-transform drop-shadow-xl';
        el.id = `float-obj-${obj.id}`;
        
        if (obj.type === 'text') {
           el.innerHTML = `<span class="${obj.cssClass}" style="font-size: ${Math.max(12, obj.size * 0.4)}px">${obj.content}</span>`;
        } else {
           el.innerText = obj.content;
           el.style.fontSize = `${obj.size}px`;
        }
        
        el.style.opacity = `${obj.baseOpacity}`;
        el.style.filter = `blur(${obj.blur}px)`;
        canvasRef.current?.appendChild(el);
      });
      
      // Add glowing particles (70% of elements)
      const numParticles = isMobile ? 30 : 80;
      for (let i=0; i<numParticles; i++) {
        const p = document.createElement('div');
        p.className = 'glowing-particle absolute rounded-full will-change-transform';
        const size = 1 + Math.random() * 4;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}vw`;
        p.style.top = `${Math.random() * 100}vh`;
        p.style.opacity = `${0.3 + Math.random() * 0.7}`;
        
        // Colors: orange, red, yellow, white
        const colors = [
          'rgba(255, 96, 32, 0.8)', 
          'rgba(255, 200, 50, 0.8)', 
          'rgba(220, 38, 38, 0.8)',
          'rgba(255, 255, 255, 0.6)'
        ];
        p.style.boxShadow = `0 0 ${5 + Math.random()*15}px ${2 + Math.random()*5}px ${colors[Math.floor(Math.random() * colors.length)]}`;
        p.style.backgroundColor = 'white';
        
        p.setAttribute('data-speed-x', ((Math.random() - 0.5) * 0.04).toString());
        p.setAttribute('data-speed-y', ((Math.random() - 0.5) * 0.04).toString());
        canvasRef.current?.appendChild(p);
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseRef.current.targetX = (e.clientX / innerWidth - 0.5) * 2; // -1 to 1
      mouseRef.current.targetY = (e.clientY / innerHeight - 0.5) * 2; // -1 to 1
    };
    
    const handleScroll = () => {
      scrollRef.current.targetY = window.scrollY;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll, { passive: true });

    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Smooth mouse & scroll
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      scrollRef.current.y += (scrollRef.current.targetY - scrollRef.current.y) * 0.1;

      objectsRef.current.forEach(obj => {
        obj.x += obj.speedX * (delta / 16);
        obj.y += obj.speedY * (delta / 16);
        obj.rot += obj.speedRot * (delta / 16);

        // Wrap around
        if (obj.x > 110) obj.x = -10;
        if (obj.x < -10) obj.x = 110;
        if (obj.y > 110) obj.y = -10;
        if (obj.y < -10) obj.y = 110;

        const el = document.getElementById(`float-obj-${obj.id}`);
        if (el) {
          // Parallax effect
          const px = obj.x + (mouseRef.current.x * 3 * obj.z);
          const py = obj.y + (mouseRef.current.y * 3 * obj.z) - (scrollRef.current.y * 0.03 * obj.z);
          
          el.style.transform = `translate3d(${px}vw, ${py}vh, 0) rotate(${obj.rot}deg)`;
        }
      });
      
      // Animate particles
      if (canvasRef.current) {
        const particles = canvasRef.current.getElementsByClassName('glowing-particle');
        for (let i=0; i<particles.length; i++) {
          const p = particles[i] as HTMLElement;
          let left = parseFloat(p.style.left || '0');
          let top = parseFloat(p.style.top || '0');
          const speedX = parseFloat(p.getAttribute('data-speed-x') || '0');
          const speedY = parseFloat(p.getAttribute('data-speed-y') || '0');
          
          left += speedX * (delta / 16);
          top += speedY * (delta / 16);
          
          if (left > 110) left = -10;
          if (left < -10) left = 110;
          if (top > 110) top = -10;
          if (top < -10) top = 110;
          
          // Slight parallax for particles (background)
          const px = left + (mouseRef.current.x * 1.5);
          const py = top + (mouseRef.current.y * 1.5) - (scrollRef.current.y * 0.015);
          
          p.style.transform = `translate3d(${px}vw, ${py}vh, 0)`;
          // Actual stored pos
          p.style.left = `${left}vw`;
          p.style.top = `${top}vh`;
        }
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="pizza-universe fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020202]">
      {/* Layer 1: Deep Dark Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#0b1020_0%,_#050b18_50%,_#020202_100%)] opacity-100" />
      
      {/* Layer 2: Cinematic Radial Lighting */}
      <div className="absolute top-[10%] left-[20%] w-[1000px] h-[1000px] bg-[radial-gradient(circle,rgba(255,50,0,0.15)_0%,transparent_60%)] -translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
      <div className="absolute top-[50%] left-[80%] w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(255,150,0,0.1)_0%,transparent_60%)] -translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
      <div className="absolute top-[80%] left-[30%] w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(150,0,255,0.08)_0%,transparent_60%)] -translate-x-1/2 -translate-y-1/2 mix-blend-screen" />
      <div className="absolute top-[30%] left-[60%] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(255,0,100,0.08)_0%,transparent_60%)] -translate-x-1/2 -translate-y-1/2 mix-blend-screen" />

      {/* Layer 3: Large realistic hero pizza */}
      <div className="absolute top-[15%] lg:top-[30%] left-1/2 lg:left-[70%] -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] lg:w-[600px] lg:h-[600px] flex items-center justify-center pointer-events-none z-10">
        
        {/* Glows behind pizza */}
        <div className="absolute w-[90%] h-[90%] rounded-full bg-orange-600/40 blur-[80px]" />
        <div className="absolute w-[60%] h-[60%] rounded-full bg-yellow-500/30 blur-[120px]" />
        
        {/* Realistic Pizza Image wrapper (simulated floating and mouse parallax) */}
        <div 
           className="relative w-full h-full rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.7),inset_0_4px_20px_rgba(255,255,255,0.2)] animate-[float_8s_ease-in-out_infinite] transition-transform duration-100 ease-out"
           style={{ 
             backgroundImage: 'url(/images/pizzas/pepperoni.jpg)',
             backgroundSize: '110%',
             backgroundPosition: 'center',
             border: '2px solid rgba(255,255,255,0.1)',
             transform: `rotate(5deg)`
           }}
        >
           {/* Glossy overlay for realism */}
           <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/40 via-transparent to-white/20 mix-blend-overlay" />
        </div>
      </div>

      <div ref={canvasRef} className="absolute inset-0 z-20 pointer-events-none opacity-80" />
    </div>
  );
}
