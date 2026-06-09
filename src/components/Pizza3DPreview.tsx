import React, { useRef, useMemo, useEffect } from 'react';
import { PizzaConfig } from '../types';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

const TOPPING_POSITIONS = [
  { x: 100, y: 100 },
  { x: 100, y: 60 },
  { x: 100, y: 140 },
  { x: 60, y: 100 },
  { x: 140, y: 100 },
  { x: 70, y: 70 },
  { x: 130, y: 130 },
  { x: 70, y: 130 },
  { x: 130, y: 70 },
  { x: 100, y: 35 },
  { x: 100, y: 165 },
  { x: 35, y: 100 },
  { x: 165, y: 100 },
  { x: 80, y: 45 },
  { x: 120, y: 155 },
  { x: 45, y: 80 },
  { x: 155, y: 120 },
  { x: 120, y: 45 },
  { x: 80, y: 155 },
  { x: 45, y: 120 },
  { x: 155, y: 80 },
];

function getCrustStyles(crust: string) {
  const c = crust.toLowerCase();
  if (c.includes('thin')) return { r: 92, fill: '#f0c289', stroke: '#d49a5b', strokeWidth: 3 };
  if (c.includes('pan')) return { r: 85, fill: '#d99b55', stroke: '#a36e31', strokeWidth: 14 };
  if (c.includes('stuffed')) return { r: 88, fill: '#e6a861', stroke: '#c0803c', strokeWidth: 18 };
  if (c.includes('gluten')) return { r: 90, fill: '#e2b988', stroke: '#c29158', strokeWidth: 6 };
  return { r: 88, fill: '#e6a861', stroke: '#c0803c', strokeWidth: 10 }; // Default hand tossed
}

function getSauceColor(sauce: string) {
  const s = sauce.toLowerCase();
  if (s.includes('bbq')) return '#5c2c16';
  if (s.includes('buffalo')) return '#d9531e';
  if (s.includes('alfredo') || s.includes('garlic') || s.includes('ranch')) return '#fcf4d9';
  if (s.includes('tomato') || s.includes('marinara') || s.includes('pizza')) return '#c1272d';
  return 'transparent';
}

function getToppingIcon(topping: string, x: number, y: number, key: string) {
  const t = topping.toLowerCase();
  
  if (t.includes('pepperoni')) return <circle key={key} cx={x} cy={y} r="8" fill="#c1272d" stroke="#8a1a1f" strokeWidth="1" filter="drop-shadow(1px 2px 1px rgba(0,0,0,0.4))" />;
  
  if (t.includes('mushroom')) {
    return (
      <g key={key} transform={`translate(${x-6}, ${y-6}) scale(0.6)`} filter="drop-shadow(1px 2px 1px rgba(0,0,0,0.3))">
        <path d="M10 4 C4 4 4 12 10 12 C16 12 16 4 10 4 Z" fill="#d6d3d1" />
        <rect x="8" y="12" width="4" height="6" rx="1" fill="#d6d3d1" />
      </g>
    );
  }
  
  if (t.includes('onion')) {
    return <circle key={key} cx={x} cy={y} r="5" stroke="#a855f7" strokeWidth="1.5" fill="none" filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.2))" />;
  }

  if (t.includes('pineapple')) {
    return <path key={key} d={`M${x-4} ${y} Q ${x} ${y-4} ${x+4} ${y} Q ${x} ${y+4} ${x-4} ${y} Z`} fill="#facc15" filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.2))" />;
  }

  if (t.includes('chicken')) {
    return <path key={key} d={`M${x-4} ${y-2} Q ${x} ${y-6} ${x+4} ${y-2} L ${x+6} ${y+2} Q ${x} ${y+6} ${x-6} ${y+2} Z`} fill="#fdba74" filter="drop-shadow(1px 2px 1px rgba(0,0,0,0.3))" />;
  }

  if (t.includes('sausage') || t.includes('beef') || t.includes('philly')) {
    return (
      <g key={key} filter="drop-shadow(1px 2px 1px rgba(0,0,0,0.4))">
         <circle cx={x} cy={y} r="6" fill="#78350f" />
         <circle cx={x-1} cy={y-1} r="1" fill="#451a03" />
         <circle cx={x+2} cy={y} r="1" fill="#451a03" />
      </g>
    );
  }

  if (t.includes('pepper') || t.includes('spinach') || t.includes('olive') || t.includes('tomato')) {
    return <path key={key} d={`M${x-3} ${y-3} A 3 3 0 1 0 ${x+3} ${y+3} C ${x+5} ${y} ${x} ${y-5} ${x-3} ${y-3}`} fill={t.includes('tomato') ? '#ef4444' : (t.includes('olive') ? '#1c1917' : '#22c55e')} filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.2))" />;
  }

  if (t.includes('bacon') || t.includes('ham')) {
    return <path key={key} d={`M${x-4} ${y-2} Q ${x-1} ${y-5} ${x} ${y-2} T ${x+6} ${y-2} L ${x+6} ${y+1} Q ${x+3} ${y-2} ${x} ${y+1} T ${x-4} ${y+1} Z`} fill="#991b1b" filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.2))" />;
  }

  // fallback generic topping
  return <circle key={key} cx={x} cy={y} r="4" fill="#6b7280" filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.2))" />;
}

export function Pizza3DPreview({ config }: { config: PizzaConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [15, -15]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-15, 15]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 2 - 1;
    const y = (e.clientY - rect.top) / rect.height * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) / rect.width * 2 - 1;
    const y = (touch.clientY - rect.top) / rect.height * 2 - 1;
    mouseX.set(Math.max(-1, Math.min(1, x)));
    mouseY.set(Math.max(-1, Math.min(1, y)));
  };

  const handleTouchEnd = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        // gamma is left-to-right tilt in degrees (-90 to 90)
        // beta is front-to-back tilt in degrees (-180 to 180)
        const x = Math.max(-1, Math.min(1, e.gamma / 45));
        const y = Math.max(-1, Math.min(1, (e.beta - 45) / 45));
        mouseX.set(x);
        mouseY.set(y);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    }

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
      }
    };
  }, [mouseX, mouseY]);

  const hasCrust = !!config.crust;
  const hasSauce = !!config.sauce;
  const hasCheese = config.cheese && config.cheese.length > 0;
  const allToppings = [...(config.meats || []), ...(config.veggies || [])];
  
  // Distribute toppings
  const toppingElements = useMemo(() => {
    if (!hasCrust || !hasSauce || allToppings.length === 0) return [];
    
    const els: React.JSX.Element[] = [];
    const spotsPerTopping = Math.ceil(TOPPING_POSITIONS.length / allToppings.length);
    
    // We shuffle positions deterministically to scatter naturally
    const shuffledPositions = [...TOPPING_POSITIONS].sort((a,b) => (a.x * 13 + a.y * 37) % 10 - (b.x * 13 + b.y * 37) % 10);
    
    let posIndex = 0;
    allToppings.forEach((t) => {
       for(let i=0; i<spotsPerTopping; i++) {
         if (posIndex >= shuffledPositions.length) break;
         const pos = shuffledPositions[posIndex];
         
         // Add tiny random jitter purely based on pos to keep it deterministic but natural
         const jx = (pos.x * 7 % 10) - 5;
         const jy = (pos.y * 11 % 10) - 5;
         
         els.push(getToppingIcon(t, pos.x + jx, pos.y + jy, `${t}-${posIndex}`));
         posIndex++;
       }
    });
    
    return els;
  }, [allToppings, hasCrust, hasSauce]);

  const crustStyles = getCrustStyles(config.crust);
  const sauceColor = getSauceColor(config.sauce);

  return (
    <div 
      className="w-full h-full flex items-center justify-center perspective-[800px] touch-none" 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      ref={ref}
    >
      <motion.div 
         style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
         className="relative w-full h-full flex items-center justify-center drop-shadow-2xl"
      >
         {!hasCrust ? (
            // Empty Plate
            <svg viewBox="0 0 200 200" className="w-[80%] h-[80%]">
               <circle cx="100" cy="100" r="95" fill="#f5f5f4" stroke="#e7e5e4" strokeWidth="2" filter="drop-shadow(2px 10px 10px rgba(0,0,0,0.5))" />
               <circle cx="100" cy="100" r="70" fill="none" stroke="#e7e5e4" strokeWidth="1" opacity="0.5" />
               <text x="100" y="105" textAnchor="middle" fill="#d6d3d1" fontSize="12" fontWeight="bold">SELECT CRUST</text>
            </svg>
         ) : (
            <svg viewBox="0 0 200 200" className="w-[90%] h-[90%] drop-shadow-2xl overflow-visible">
               {/* Plate reflection/shadow */}
               <ellipse cx="100" cy="115" rx="90" ry="80" fill="rgba(0,0,0,0.5)" filter="blur(8px)" />
               
               {/* Crust */}
               <motion.circle 
                 initial={{ scale: 0.5, opacity: 0 }} 
                 animate={{ scale: 1, opacity: 1 }} 
                 cx="100" cy="100" r={crustStyles.r} fill={crustStyles.fill} stroke={crustStyles.stroke} strokeWidth={crustStyles.strokeWidth}
                 filter="drop-shadow(0px 8px 6px rgba(0,0,0,0.4))"
               />

               {/* Inner Crust Texture matching base */}
               <circle cx="100" cy="100" r={crustStyles.r - crustStyles.strokeWidth/2} fill={crustStyles.fill} />
               
               {/* Sauce */}
               {hasSauce && (
                 <motion.circle 
                   initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                   cx="100" cy="100" r={crustStyles.r - crustStyles.strokeWidth/2 - 2} fill={sauceColor} opacity="0.9"
                 />
               )}

               {/* Cheese */}
               {hasSauce && hasCheese && (
                 <motion.circle 
                   initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                   cx="100" cy="100" r={crustStyles.r - crustStyles.strokeWidth/2 - 5} fill="#facc15" opacity={config.cheese.includes('Extra Cheese') ? 1 : 0.8}
                   filter="url(#cheese-tex)"
                 />
               )}

               {/* Toppings array */}
               {toppingElements}
               
               <defs>
                 <filter id="cheese-tex">
                   <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
                   <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0" in="noise" result="coloredNoise" />
                   <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply" />
                 </filter>
               </defs>
            </svg>
         )}
      </motion.div>
    </div>
  );
}
