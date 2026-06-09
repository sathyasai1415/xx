import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

const ingredients = [
  { id: 1, type: 'pepperoni', left: '5%', top: '15%', w: 48, h: 48, color: 'bg-red-600/20 border border-red-900/10', r: 12 },
  { id: 2, type: 'pepperoni', left: '12%', top: '65%', w: 40, h: 40, color: 'bg-red-600/15 border border-red-900/10', r: -12 },
  { id: 3, type: 'basil', left: '85%', top: '25%', w: 56, h: 24, color: 'bg-green-700/10', r: 35 },
  { id: 4, type: 'basil', left: '20%', top: '85%', w: 48, h: 20, color: 'bg-green-700/15', r: -15 },
];

export function ParallaxBackground() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse pos between -1 and 1
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none -z-10">
      {/* Immersive Theme bg and decor */}
      <div className="absolute inset-0 bg-[#F9F7F2]" />
      <div className="absolute top-10 left-10 w-24 h-24 bg-red-500/10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl"></div>

      {ingredients.map((item, i) => {
        const depth = (i % 2) + 1; 
        const xOffset = mousePos.x * 20 * depth;
        const yOffset = mousePos.y * 20 * depth;

        return (
          <motion.div
            key={item.id}
            className={`absolute rounded-full ${item.color}`}
            animate={{
              x: xOffset,
              y: yOffset,
              rotate: item.r + mousePos.x * 10
            }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            style={{
              left: item.left,
              top: item.top,
              width: item.w,
              height: item.h,
            }}
          />
        );
      })}
      
      {/* Flour Dusting */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]"></div>
    </div>
  );
}
