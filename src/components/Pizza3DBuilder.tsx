import React, { useRef, useMemo } from 'react';
import { PizzaConfig } from '../types';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'motion/react';
import { usePizzaBuilder, PositionedTopping } from './usePizzaBuilder';
import '../pizzaBuilder.css';

// --- Subcomponents ---

function PizzaBaseLayer({ crust }: { crust: string | null }) {
  if (!crust) {
    return (
      <div className="absolute inset-0 rounded-full border-4 border-stone-200 border-dashed bg-white/10 flex items-center justify-center">
        <span className="text-stone-300 font-bold uppercase tracking-widest text-xs">Select Crust</span>
      </div>
    );
  }
  
  let crustClass = 'pizza-crust';
  if (crust.toLowerCase().includes('thin')) crustClass += ' pizza-crust-thin';
  if (crust.toLowerCase().includes('pan') || crust.toLowerCase().includes('stuffed')) crustClass += ' pizza-crust-pan';
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={crustClass}
    >
      <div className="absolute inset-0 rounded-full opacity-30 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
    </motion.div>
  );
}

function SauceLayer({ sauce }: { sauce: string | null }) {
  if (!sauce || sauce === 'No Sauce') return null;
  
  let sauceClass = 'pizza-sauce';
  const s = sauce.toLowerCase();
  if (s.includes('tomato') || s.includes('marinara')) sauceClass += ' sauce-tomato';
  else if (s.includes('white') || s.includes('alfredo') || s.includes('ranch') || s.includes('garlic')) sauceClass += ' sauce-white';
  else if (s.includes('bbq')) sauceClass += ' sauce-bbq';
  else if (s.includes('buffalo')) sauceClass += ' sauce-buffalo';
  else sauceClass += ' sauce-tomato'; // default

  return (
    <motion.div 
       initial={{ scale: 0.5, opacity: 0 }}
       animate={{ scale: 1, opacity: 0.95 }}
       exit={{ scale: 0.5, opacity: 0 }}
       className={sauceClass}
    />
  );
}

function CheeseLayer({ cheese }: { cheese: string[] }) {
  if (!cheese || cheese.length === 0 || cheese.includes('No Cheese')) return null;
  
  let cheeseClass = 'pizza-cheese';
  if (cheese.includes('Light Cheese')) cheeseClass += ' pizza-cheese-light';
  if (cheese.includes('Extra Cheese')) cheeseClass += ' pizza-cheese-extra';

  return (
    <motion.div 
       initial={{ scale: 0.8, opacity: 0 }}
       animate={{ scale: 1, opacity: cheese.includes('Light Cheese') ? 0.6 : 0.95 }}
       exit={{ scale: 0.8, opacity: 0 }}
       className={cheeseClass}
    >
       <div className="absolute inset-0 rounded-full opacity-40 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.04%22 numOctaves=%222%22 result=%22noise%22/%3E%3CfeColorMatrix type=%22matrix%22 values=%221 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.8 0%22 in=%22noise%22 result=%22coloredNoise%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }}></div>
    </motion.div>
  );
}

function getToppingImage(name: string) {
  const t = name.toLowerCase();
  if (t.includes('pepperoni')) return '/images/toppings/pepperoni.svg';
  if (t.includes('mushroom')) return '/images/toppings/mushrooms.svg';
  if (t.includes('onion')) return '/images/toppings/onions.svg';
  if (t.includes('pineapple')) return '/images/toppings/pineapple.svg';
  if (t.includes('chicken')) return '/images/toppings/chicken.svg';
  if (t.includes('sausage') || t.includes('beef') || t.includes('philly')) return '/images/toppings/sausage.svg';
  if (t.includes('pepper') || t.includes('spinach') || t.includes('olive') || t.includes('tomato')) return '/images/toppings/veggie.svg';
  if (t.includes('bacon') || t.includes('ham')) return '/images/toppings/bacon.svg';
  return null;
}

const FallingTopping: React.FC<{ topping: PositionedTopping }> = ({ topping }) => {
  const imgUrl = getToppingImage(topping.name);
  if (!imgUrl) return null;

  return (
    <motion.img 
      src={imgUrl} 
      className="topping-piece w-8 h-8 sm:w-10 sm:h-10"
      style={{ left: `${topping.x}%`, top: `${topping.y}%`, marginLeft: '-16px', marginTop: '-16px' }}
      initial={{ y: -150, opacity: 0, scale: 0.5, rotateZ: topping.rotation - 90 }}
      animate={{ y: 0, opacity: 1, scale: topping.scale, rotateZ: topping.rotation }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: topping.delay }}
    />
  );
}

function ToppingLayer({ toppings }: { toppings: PositionedTopping[] }) {
  return (
    <div className="topping-layer">
      <AnimatePresence>
        {toppings.map(t => (
          <FallingTopping key={t.id} topping={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}


// --- Main Builder component ---

export function Pizza3DBuilder({ config }: { config: PizzaConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [65, 45]), { stiffness: 100, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-25, 5]), { stiffness: 100, damping: 20 });
  const scale = useSpring(1, { stiffness: 300, damping: 15 });

  const { toppings } = usePizzaBuilder(config);
  const toppingsCount = toppings.length;

  React.useEffect(() => {
    // slight bump when a topping is added
    scale.set(1.05);
    const timeout = setTimeout(() => scale.set(1), 150);
    return () => clearTimeout(timeout);
  }, [toppingsCount, scale]);

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

  const hasCrust = !!config.crust;

  return (
    <div 
      className="pizza-3d-scene touch-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      ref={ref}
    >
      <motion.div 
        className="pizza-3d"
        style={{ rotateX, rotateY, rotateZ: -12, scale }}
      >
         <PizzaBaseLayer crust={config.crust} />
         
         {hasCrust && (
           <AnimatePresence>
             {config.sauce && <SauceLayer sauce={config.sauce} />}
           </AnimatePresence>
         )}

         {hasCrust && config.sauce && (
           <AnimatePresence>
             {config.cheese && config.cheese.length > 0 && <CheeseLayer cheese={config.cheese} />}
           </AnimatePresence>
         )}

         {hasCrust && config.sauce && (
           <ToppingLayer toppings={toppings} />
         )}

         {/* Premium Presentation Glow & Steam (Active when pizza has crust + sauce) */}
         {hasCrust && config.sauce && (
           <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 2 }}
              className="absolute inset-0 pointer-events-none"
           >
              {/* Glossy top shine */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent mix-blend-overlay rotate-45" style={{ filter: 'blur(10px)' }}></div>
              {/* Ambient warmth */}
              <div className="absolute inset-0 rounded-full shadow-[0_0_80px_rgba(255,100,20,0.2)] mix-blend-screen"></div>
              {/* Steam particles could go here if using CSS animations */}
           </motion.div>
         )}

      </motion.div>
    </div>
  );
}
