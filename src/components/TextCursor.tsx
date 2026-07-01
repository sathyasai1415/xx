import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './TextCursor.css';

const PizzaSlice = ({ size = 28, opacity = 1 }: { size?: number; opacity?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ opacity, filter: 'drop-shadow(0 0 4px rgba(255,107,53,0.7))' }}
  >
    {/* Crust */}
    <path d="M16 2 L30 28 L2 28 Z" fill="#D97706" />
    {/* Cheese */}
    <path d="M16 6 L27 26 L5 26 Z" fill="#FCD34D" />
    {/* Sauce patches */}
    <circle cx="16" cy="14" r="2.5" fill="#DC2626" />
    <circle cx="11" cy="20" r="2" fill="#DC2626" />
    <circle cx="21" cy="20" r="2" fill="#DC2626" />
    {/* Pepperoni dots */}
    <circle cx="16" cy="14" r="1.5" fill="#991B1B" />
    <circle cx="11" cy="20" r="1.2" fill="#991B1B" />
    <circle cx="21" cy="20" r="1.2" fill="#991B1B" />
    {/* Crust highlight */}
    <path d="M16 2 L30 28 L2 28 Z" fill="none" stroke="#92400E" strokeWidth="1" strokeLinejoin="round" />
    {/* Oregano specks */}
    <circle cx="13.5" cy="17" r="0.8" fill="#15803D" opacity="0.8" />
    <circle cx="19" cy="17" r="0.8" fill="#15803D" opacity="0.8" />
    <circle cx="16" cy="22" r="0.8" fill="#15803D" opacity="0.8" />
  </svg>
);

interface TrailItem {
  id: number;
  x: number;
  y: number;
  angle: number;
  randomX?: number;
  randomY?: number;
  randomRotate?: number;
}

interface TextCursorProps {
  spacing?: number;
  followMouseDirection?: boolean;
  randomFloat?: boolean;
  exitDuration?: number;
  removalInterval?: number;
  maxPoints?: number;
}

const TextCursor = ({
  spacing = 80,
  followMouseDirection = true,
  randomFloat = true,
  exitDuration = 0.4,
  removalInterval = 25,
  maxPoints = 8,
}: TextCursorProps) => {
  const [trail, setTrail] = useState<TrailItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastMoveTimeRef = useRef(Date.now());
  const idCounter = useRef(0);

  const handleMouseMove = (e: MouseEvent) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const createRandomData = () =>
      randomFloat
        ? {
            randomX: Math.random() * 12 - 6,
            randomY: Math.random() * 12 - 6,
            randomRotate: Math.random() * 20 - 10,
          }
        : {};

    setTrail(prev => {
      const newTrail = [...prev];

      if (newTrail.length === 0) {
        newTrail.push({ id: idCounter.current++, x: mouseX, y: mouseY, angle: 0, ...createRandomData() });
      } else {
        const last = newTrail[newTrail.length - 1];
        const dx = mouseX - last.x;
        const dy = mouseY - last.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance >= spacing) {
          const rawAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
          const computedAngle = followMouseDirection ? rawAngle : 0;
          const steps = Math.floor(distance / spacing);

          for (let i = 1; i <= steps; i++) {
            const t = (spacing * i) / distance;
            newTrail.push({
              id: idCounter.current++,
              x: last.x + dx * t,
              y: last.y + dy * t,
              angle: computedAngle,
              ...createRandomData(),
            });
          }
        }
      }

      return newTrail.length > maxPoints ? newTrail.slice(newTrail.length - maxPoints) : newTrail;
    });

    lastMoveTimeRef.current = Date.now();
  };

  const handleRef = useRef(handleMouseMove);
  handleRef.current = handleMouseMove;

  useEffect(() => {
    const handler = (e: MouseEvent) => handleRef.current(e);
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - lastMoveTimeRef.current > 100) {
        setTrail(prev => (prev.length > 0 ? prev.slice(1) : prev));
      }
    }, removalInterval);
    return () => clearInterval(interval);
  }, [removalInterval]);

  return (
    <div ref={containerRef} className="text-cursor-container">
      <div className="text-cursor-inner">
        <AnimatePresence>
          {trail.map((item, idx) => {
            const scale = 0.5 + (idx / maxPoints) * 0.6;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.3, rotate: item.angle - 90 }}
                animate={{
                  opacity: 0.85,
                  scale,
                  x: randomFloat ? [0, item.randomX || 0, 0] : 0,
                  y: randomFloat ? [0, item.randomY || 0, 0] : 0,
                  rotate: randomFloat
                    ? [item.angle - 90, item.angle - 90 + (item.randomRotate || 0), item.angle - 90]
                    : item.angle - 90,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  opacity: { duration: exitDuration, ease: 'easeOut' },
                  scale: { duration: 0.2 },
                  ...(randomFloat && {
                    x: { duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' },
                    y: { duration: 2, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' },
                    rotate: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' },
                  }),
                }}
                className="text-cursor-item"
                style={{ left: item.x, top: item.y }}
              >
                <PizzaSlice size={28} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TextCursor;
