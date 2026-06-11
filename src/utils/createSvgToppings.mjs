import fs from 'fs';

const toppings = {
  'pepperoni.svg': '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="#dc2626"/><circle cx="35" cy="40" r="5" fill="#991b1b"/><circle cx="65" cy="35" r="4" fill="#991b1b"/><circle cx="55" cy="70" r="6" fill="#991b1b"/><circle cx="30" cy="65" r="4" fill="#991b1b"/></svg>',
  'mushrooms.svg': '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50 20 C20 20 20 60 50 60 C80 60 80 20 50 20 Z" fill="#d6d3d1"/><rect x="40" y="60" width="20" height="30" rx="5" fill="#d6d3d1"/></svg>',
  'onions.svg': '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="#a855f7" stroke-width="6" fill="none"/><circle cx="50" cy="50" r="25" stroke="#a855f7" stroke-width="6" fill="none"/></svg>',
  'pineapple.svg': '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 50 Q 50 20 80 50 Q 50 80 20 50 Z" fill="#facc15"/></svg>',
  'chicken.svg': '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M30 40 Q 50 20 70 40 L 80 60 Q 50 80 20 60 Z" fill="#fdba74"/></svg>',
  'sausage.svg': '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="35" fill="#78350f"/><circle cx="40" cy="40" r="4" fill="#451a03"/><circle cx="60" cy="55" r="3" fill="#451a03"/></svg>',
  'veggie.svg': '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M40 20 A 20 20 0 1 0 60 80 C 80 50 60 20 40 20" fill="#22c55e"/></svg>',
  'bacon.svg': '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M20 30 Q 35 15 50 30 T 80 30 L 80 45 Q 65 30 50 45 T 20 45 Z" fill="#991b1b"/></svg>',
};

Object.keys(toppings).forEach(file => {
  fs.writeFileSync('public/images/toppings/' + file, toppings[file]);
  console.log('Created ' + file);
});
