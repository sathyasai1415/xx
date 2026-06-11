import { PizzaConfig } from '../types';

export function getPizzaImage(config: PizzaConfig | undefined): string {
  if (!config) return '/images/pizzas/cheese.jpg';
  const hasBuffalo = config.sauce === 'Buffalo Sauce';
  const hasBBQ = config.sauce === 'BBQ Sauce';
  const hasChicken = config.meats.includes('Grilled Chicken');
  const hasPepperoni = config.meats.includes('Pepperoni');
  const hasPineapple = config.veggies.includes('Pineapple');
  const hasLotOfMeat = config.meats.length >= 3;
  const hasLotOfVeggies = config.veggies.length >= 3;

  if (hasBuffalo && hasChicken) return '/images/pizzas/buffalo-chicken.jpg';
  if (hasBBQ && hasChicken) return '/images/pizzas/bbq-chicken.jpg';
  if (hasLotOfMeat) return '/images/pizzas/meat-lovers.jpg';
  if (hasPineapple && config.meats.some(m => m.includes('Ham') || m.includes('Bacon'))) return '/images/pizzas/hawaiian.jpg';
  if (hasPepperoni) return '/images/pizzas/pepperoni.jpg';
  if (hasLotOfVeggies && config.meats.length === 0) return '/images/pizzas/veggie.jpg';
  return '/images/pizzas/cheese.jpg';
}
