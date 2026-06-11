import { useState, useEffect, useRef } from 'react';
import { PizzaConfig } from '../types';

export type PositionedTopping = {
  id: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
};

export function usePizzaBuilder(config: PizzaConfig) {
  const [toppings, setToppings] = useState<PositionedTopping[]>([]);
  const prevConfigRef = useRef<PizzaConfig>(config);

  useEffect(() => {
    const allCurrentConfigToppings = [...config.meats, ...config.veggies, ...config.extras];
    const prevToppingsCount = toppings.length;
    
    // Check if new toppings were added
    const newToppings: PositionedTopping[] = [...toppings];
    
    // First, remove any toppings that are no longer in config
    for (let i = newToppings.length - 1; i >= 0; i--) {
      if (!allCurrentConfigToppings.includes(newToppings[i].name)) {
        newToppings.splice(i, 1);
      }
    }

    // Now, add new toppings that are in config but not fully represented
    allCurrentConfigToppings.forEach((toppingName) => {
      // Find how many instances of this topping we already have (we generally add ~8 pieces per topping)
      const existingCount = newToppings.filter(t => t.name === toppingName).length;
      const targetCount = 10; // Number of pieces per topping selected
      
      if (existingCount === 0) {
        // Add completely new topping
        for (let i = 0; i < targetCount; i++) {
          // Keep them inside a circle of radius ~ 40% (centered at 50%, 50%)
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * 38; // Up to 38% from center
          const px = 50 + r * Math.cos(angle);
          const py = 50 + r * Math.sin(angle);
          
          newToppings.push({
            id: `${toppingName}-${Date.now()}-${i}`,
            name: toppingName,
            x: px,
            y: py,
            rotation: Math.random() * 360,
            scale: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
            delay: i * 0.05 // Staggered drop effect
          });
        }
      }
    });

    setToppings(newToppings);
    prevConfigRef.current = config;
    
  }, [config.meats, config.veggies, config.extras]);

  return { toppings };
}
