import React, { useRef } from 'react';
import { PizzaConfig } from '../types';
import {
  motion, AnimatePresence,
  useMotionValue, useSpring, useTransform,
} from 'motion/react';
import { usePizzaBuilder, PositionedTopping } from './usePizzaBuilder';

// ── Sauce / crust lookup ──────────────────────────────────────────────────────
function getSauceColors(sauce: string) {
  const s = (sauce || '').toLowerCase();
  if (s.includes('tomato'))   return { a: '#C0392B', b: '#7B241C' };
  if (s.includes('marinara')) return { a: '#A93226', b: '#641E16' };
  if (s.includes('bbq'))      return { a: '#7E3200', b: '#4A1A00' };
  if (s.includes('buffalo'))  return { a: '#D35400', b: '#A04000' };
  if (s.includes('alfredo') || s.includes('white') || s.includes('garlic parmesan'))
    return { a: '#F0DEB8', b: '#C8B07A' };
  if (s.includes('ranch'))    return { a: '#EDE9D0', b: '#C8C2A0' };
  if (s.includes('no sauce')) return null;
  return { a: '#C0392B', b: '#7B241C' };
}

function getCrustStyle(crust: string) {
  const c = (crust || '').toLowerCase();
  if (c.includes('thin'))
    return { outerR: 136, crustW: 10, edge: '#5C2A08', mid: '#9A5515', inner: '#C47820' };
  if (c.includes('pan') || c.includes('stuffed'))
    return { outerR: 138, crustW: 24, edge: '#3D1A05', mid: '#6B2F08', inner: '#A85520' };
  if (c.includes('brooklyn') || c.includes('new york'))
    return { outerR: 138, crustW: 14, edge: '#5E2A08', mid: '#9C5018', inner: '#C87820' };
  return { outerR: 136, crustW: 16, edge: '#5A2808', mid: '#9A5018', inner: '#C47820' };
}

// ── Topping shapes (SVG) ──────────────────────────────────────────────────────
function ToppingShape({ name, s }: { name: string; s: number }) {
  const n = name.toLowerCase();

  if (n.includes('pepperoni') || n.includes('salami')) {
    const isSalami = n.includes('salami');
    return (
      <g>
        <circle r={s * 1.05} fill={isSalami ? '#7A2E38' : '#8B0000'} />
        <circle r={s * 0.88} fill={isSalami ? '#9B3A42' : '#B22222'} />
        {[[-0.38,-0.32],[0.38,0.28],[0.1,-0.46],[-0.32,0.38],[0.42,-0.18]].map(([fx,fy],i)=>(
          <circle key={i} cx={fx!*s*1.6} cy={fy!*s*1.6} r={s*0.19} fill={isSalami?'#C04A55':'#D4585F'} opacity={0.75}/>
        ))}
        <circle r={s*0.28} fill={isSalami?'#C04A55':'#D4585F'} opacity={0.55}/>
      </g>
    );
  }
  if (n.includes('sausage') || n.includes('beef')) return (
    <g>
      <ellipse rx={s*1.35} ry={s*0.82} fill="#5A2E10"/>
      <ellipse rx={s*1.05} ry={s*0.62} fill="#8B4513"/>
      <ellipse rx={s*0.55} ry={s*0.35} cx={-s*0.2} cy={-s*0.1} fill="#A0522D" opacity={0.6}/>
    </g>
  );
  if (n.includes('bacon')) return (
    <g>
      <rect x={-s*1.6} y={-s*0.35} width={s*3.2} height={s*0.7} rx={s*0.22} fill="#7B0000"/>
      <rect x={-s*1.5} y={-s*0.18} width={s*3.0} height={s*0.28} rx={s*0.1} fill="#FFB6C1" opacity={0.7}/>
    </g>
  );
  if (n.includes('ham')) return (
    <g>
      <circle r={s*1.05} fill="#C06080"/>
      <circle r={s*0.8} fill="#E89AB0"/>
      <circle r={s*0.32} fill="#C06080" opacity={0.5}/>
    </g>
  );
  if (n.includes('chicken') || n.includes('philly')) return (
    <g>
      <ellipse rx={s*1.25} ry={s*0.9} fill="#E8D5A8"/>
      <ellipse rx={s*0.95} ry={s*0.68} fill="#F5E8C0"/>
      <ellipse rx={s*0.4} ry={s*0.3} cx={s*0.2} cy={-s*0.1} fill="#D4B870" opacity={0.5}/>
    </g>
  );
  if (n.includes('anchovi')) return (
    <g>
      <ellipse rx={s*1.5} ry={s*0.38} fill="#5A7878"/>
      <ellipse rx={s*1.25} ry={s*0.25} fill="#7AACAC"/>
    </g>
  );
  if (n.includes('mushroom')) return (
    <g>
      <ellipse rx={s*1.15} ry={s*0.6} cy={-s*0.12} fill="#BC8F6A"/>
      <ellipse rx={s*0.95} ry={s*0.48} cy={-s*0.14} fill="#D4AB88"/>
      <rect x={-s*0.28} y={-s*0.05} width={s*0.56} height={s*0.75} rx={s*0.16} fill="#A87850"/>
    </g>
  );
  if (n.includes('onion')) return (
    <g>
      <circle r={s*1.05} fill="rgba(221,160,221,0.12)"/>
      <circle r={s*1.05} fill="none" stroke="#CC88CC" strokeWidth={s*0.38} opacity={0.72}/>
      <circle r={s*0.6}  fill="none" stroke="#EE99EE" strokeWidth={s*0.28} opacity={0.55}/>
    </g>
  );
  if (n.includes('green pepper') || n.includes('green chile')) return (
    <g transform="rotate(-30)">
      <rect x={-s*1.4} y={-s*0.32} width={s*2.8} height={s*0.64} rx={s*0.32} fill="#1A7A1A"/>
      <rect x={-s*1.2} y={-s*0.18} width={s*2.4} height={s*0.28} rx={s*0.12} fill="#3CB34C" opacity={0.55}/>
    </g>
  );
  if (n.includes('olive') || n.includes('kalamata')) return (
    <g>
      <ellipse rx={s*0.75} ry={s*1.12} fill="#222222"/>
      <ellipse rx={s*0.42} ry={s*0.78} fill="#111111"/>
      <ellipse rx={s*0.22} ry={s*0.28} cy={-s*0.22} fill="#888888" opacity={0.6}/>
    </g>
  );
  if (n.includes('spinach')) return (
    <g>
      <ellipse rx={s*1.25} ry={s*0.72} fill="#1F6B40"/>
      <ellipse rx={s*1.05} ry={s*0.58} fill="#2E8B57"/>
      <line x1={-s*0.95} y1={0} x2={s*0.95} y2={0} stroke="#164A2A" strokeWidth={s*0.14}/>
    </g>
  );
  if (n.includes('tomato') && !n.includes('sun')) {
    // Cross-section slice: skin ring + 6 flesh chambers + seeds
    const chambers = [0, 60, 120, 180, 240, 300];
    return (
      <g>
        {/* Outer skin */}
        <circle r={s * 1.08} fill="#9B1020" />
        {/* Flesh */}
        <circle r={s * 0.96} fill="#E8253A" />
        {/* Seed chambers — pie wedges in lighter red */}
        {chambers.map((deg, i) => {
          const a1 = (deg - 28) * Math.PI / 180;
          const a2 = (deg + 28) * Math.PI / 180;
          const r0 = s * 0.2; const r1 = s * 0.88;
          return (
            <path key={i}
              d={`M${Math.cos(a1)*r0},${Math.sin(a1)*r0} L${Math.cos(a1)*r1},${Math.sin(a1)*r1} A${r1},${r1} 0 0,1 ${Math.cos(a2)*r1},${Math.sin(a2)*r1} L${Math.cos(a2)*r0},${Math.sin(a2)*r0} Z`}
              fill="#F23347" opacity={0.55}
            />
          );
        })}
        {/* Chamber dividers */}
        {chambers.map((deg, i) => {
          const rad = deg * Math.PI / 180;
          return (
            <line key={i} x1={Math.cos(rad)*s*0.2} y1={Math.sin(rad)*s*0.2}
              x2={Math.cos(rad)*s*0.94} y2={Math.sin(rad)*s*0.94}
              stroke="#9B1020" strokeWidth={s * 0.08} opacity={0.7} />
          );
        })}
        {/* Seeds — one per chamber */}
        {chambers.map((deg, i) => {
          const rad = deg * Math.PI / 180;
          return (
            <ellipse key={i}
              cx={Math.cos(rad) * s * 0.58} cy={Math.sin(rad) * s * 0.58}
              rx={s * 0.13} ry={s * 0.09}
              transform={`rotate(${deg}, ${Math.cos(rad)*s*0.58}, ${Math.sin(rad)*s*0.58})`}
              fill="#FFE066" opacity={0.88}
            />
          );
        })}
        {/* Centre core */}
        <circle r={s * 0.2} fill="#C0182C" />
        <circle r={s * 0.08} fill="#FFE066" opacity={0.6} />
        {/* Skin highlight */}
        <circle r={s * 1.08} fill="none" stroke="#FF6677" strokeWidth={s * 0.08} opacity={0.4} />
      </g>
    );
  }
  if (n.includes('sun-dried')) return (
    <g>
      <ellipse rx={s*1.05} ry={s*0.72} fill="#8B2200"/>
      <ellipse rx={s*0.82} ry={s*0.52} fill="#A8380A"/>
    </g>
  );
  if (n.includes('jalapeno') || n.includes('banana pepper')) return (
    <g transform="rotate(-20)">
      <ellipse rx={s*1.45} ry={s*0.38} fill="#5A8A1A"/>
      <ellipse rx={s*1.25} ry={s*0.25} fill="#88CC30" opacity={0.72}/>
    </g>
  );
  if (n.includes('pineapple')) return (
    <g>
      <ellipse rx={s*1.15} ry={s*0.82} fill="#FFD700"/>
      <ellipse rx={s*0.88} ry={s*0.62} fill="#FFC000"/>
      {[[-0.3,-0.22],[0.3,-0.22],[0,-0.32],[-0.3,0.22],[0.3,0.22]].map(([px,py],i)=>(
        <ellipse key={i} cx={px!*s*1.4} cy={py!*s*1.4} rx={s*0.22} ry={s*0.16} fill="#E8AA00" opacity={0.6}/>
      ))}
    </g>
  );
  if (n.includes('garlic')) return (
    <g>
      <ellipse rx={s*0.72} ry={s*0.95} fill="#FFFFEE"/>
      <ellipse rx={s*0.52} ry={s*0.72} fill="#F8F8E0"/>
      <line x1={0} y1={-s*0.85} x2={0} y2={s*0.85} stroke="#DDD8B0" strokeWidth={s*0.14}/>
    </g>
  );
  if (n.includes('roasted red pepper')) return (
    <g transform="rotate(-25)">
      <rect x={-s*1.35} y={-s*0.38} width={s*2.7} height={s*0.76} rx={s*0.38} fill="#CC2200"/>
      <rect x={-s*1.15} y={-s*0.22} width={s*2.3} height={s*0.32} rx={s*0.12} fill="#FF4422" opacity={0.6}/>
    </g>
  );
  if (n.includes('feta')) return (
    <g>
      <rect x={-s*0.85} y={-s*0.55} width={s*1.7} height={s*1.1} rx={s*0.22} fill="#F8F8F8"/>
      <rect x={-s*0.65} y={-s*0.35} width={s*1.3} height={s*0.65} rx={s*0.15} fill="white" opacity={0.85}/>
    </g>
  );
  // cheese / default
  return (
    <g>
      <ellipse rx={s*1.05} ry={s*0.72} fill="#F0A820" opacity={0.85}/>
      <ellipse rx={s*0.78} ry={s*0.52} fill="#FFB832" opacity={0.65}/>
    </g>
  );
}

// ── Cheese blobs ──────────────────────────────────────────────────────────────
function CheeseBlobs({ r, amount }: { r: number; amount: string }) {
  if (amount === 'None') return null;
  const opacity = amount === 'Light' ? 0.62 : amount === 'Extra' ? 1 : 0.9;
  const c1 = amount === 'Extra' ? '#F0B820' : '#E8A830';
  const blobs = [
    { x:-0.08,y:-0.18,rx:0.52,ry:0.48 }, { x:0.22,y:0.08,rx:0.44,ry:0.46 },
    { x:-0.28,y:0.18,rx:0.40,ry:0.42 }, { x:0.06,y:-0.08,rx:0.48,ry:0.5  },
    { x:-0.18,y:-0.28,rx:0.34,ry:0.36}, { x:0.28,y:0.30,rx:0.36,ry:0.34 },
    { x:0.42,y:-0.12,rx:0.28,ry:0.30 }, { x:-0.42,y:-0.05,rx:0.30,ry:0.28},
  ];
  return (
    <g opacity={opacity}>
      {blobs.map((b,i) => (
        <ellipse key={i} cx={b.x*r} cy={b.y*r} rx={b.rx*r} ry={b.ry*r}
          fill={i%3===0?'#EEC840':i%3===1?c1:'#F5C038'}/>
      ))}
      {amount !== 'Light' && [[-0.12,-0.14],[0.22,0.18],[-0.28,0.08],[0.12,-0.32],[0.38,0.24]].map(([bx,by],i)=>(
        <ellipse key={i} cx={bx!*r} cy={by!*r} rx={r*0.065} ry={r*0.05} fill="#C08000" opacity={0.38}/>
      ))}
    </g>
  );
}

// ── Drizzle paths ─────────────────────────────────────────────────────────────
const DRIZZLE_COLORS: Record<string,string> = {
  'Garlic Parmesan Drizzle':'#F5E08A','BBQ Drizzle':'#6B2200','Buffalo Drizzle':'#CC4400',
  'Ranch Drizzle':'#F0EDD0','Italian Herb Drizzle':'#4A8A20','Mango Habanero Drizzle':'#FF8C00',
  'Balsamic Glaze':'#5A0090','Hot Honey':'#D4A000',
};

function DrizzleLines({ drizzles, r }: { drizzles: string[]; r: number }) {
  const paths = [
    `M${-r*.7},${-r*.1} Q${-r*.2},${-r*.5} ${r*.3},${-r*.15} Q${r*.7},${r*.15} ${r*.4},${r*.5}`,
    `M${-r*.5},${r*.3}  Q${r*.1},${-r*.1}  ${r*.6},${r*.2}`,
    `M${r*.2},${-r*.6}  Q${-r*.2},${-r*.2} ${-r*.5},${r*.4}`,
  ];
  return (
    <g opacity={0.88}>
      {drizzles.slice(0,3).map((d,i) => (
        <path key={d} d={paths[i%paths.length]}
          stroke={DRIZZLE_COLORS[d]||'#F5E08A'} strokeWidth={r*0.04}
          fill="none" strokeLinecap="round"/>
      ))}
    </g>
  );
}

// ── Shared SVG defs (rendered once in a hidden svg) ───────────────────────────
function SharedDefs({ uid, crust, sauce }: { uid: string; crust: ReturnType<typeof getCrustStyle>; sauce: ReturnType<typeof getSauceColors> }) {
  return (
    <svg width="0" height="0" style={{ position:'absolute' }}>
      <defs>
        <radialGradient id={`${uid}-crust`} cx="42%" cy="38%" r="65%">
          <stop offset="0%"   stopColor={crust.inner}/>
          <stop offset="55%"  stopColor={crust.mid}/>
          <stop offset="100%" stopColor={crust.edge}/>
        </radialGradient>
        <radialGradient id={`${uid}-crust-edge`} cx="50%" cy="50%" r="50%">
          <stop offset="72%" stopColor="transparent"/>
          <stop offset="88%" stopColor={crust.edge} stopOpacity="0.6"/>
          <stop offset="100%" stopColor={crust.edge} stopOpacity="0.9"/>
        </radialGradient>
        {sauce && (
          <radialGradient id={`${uid}-sauce`} cx="40%" cy="38%" r="65%">
            <stop offset="0%"   stopColor={sauce.a}/>
            <stop offset="100%" stopColor={sauce.b}/>
          </radialGradient>
        )}
        <radialGradient id={`${uid}-shine`} cx="30%" cy="25%" r="55%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        {/* Top specular flare */}
        <radialGradient id={`${uid}-flare`} cx="38%" cy="28%" r="38%">
          <stop offset="0%"   stopColor="white" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <filter id={`${uid}-cheese-blur`}>
          <feGaussianBlur stdDeviation="3.5"/>
        </filter>
        <filter id={`${uid}-topping-shadow`}>
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="rgba(0,0,0,0.6)"/>
        </filter>
        <filter id={`${uid}-ground-shadow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="20" stdDeviation="22" floodColor="rgba(0,0,0,0.7)"/>
        </filter>
      </defs>
    </svg>
  );
}

// ── Per-layer parallax hook ───────────────────────────────────────────────────
function useParallaxLayer(mouseX: any, mouseY: any, depth: number) {
  const maxX = depth * 22;
  const maxY = depth * 15;
  const x = useSpring(useTransform(mouseX, [-1, 1], [-maxX, maxX]), { stiffness: 180 - depth * 30, damping: 28 });
  const y = useSpring(useTransform(mouseY, [-1, 1], [-maxY, maxY]), { stiffness: 180 - depth * 30, damping: 28 });
  return { x, y };
}

// ── Main Component ────────────────────────────────────────────────────────────
export function Pizza3DBuilder({ config }: { config: PizzaConfig }) {
  const ref = useRef<HTMLDivElement>(null);
  const { toppings } = usePizzaBuilder(config);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Overall container tilt
  const rotateX = useSpring(useTransform(mouseY, [-1,1], [58, 40]), { stiffness: 110, damping: 24 });
  const rotateY = useSpring(useTransform(mouseX, [-1,1], [-18, 12]), { stiffness: 110, damping: 24 });
  const scaleAll = useSpring(1, { stiffness: 280, damping: 16 });

  // Independent parallax per depth layer (0=base … 1=top)
  const shadow  = useParallaxLayer(mouseX, mouseY, 0.0);
  const lCrust  = useParallaxLayer(mouseX, mouseY, 0.1);
  const lSauce  = useParallaxLayer(mouseX, mouseY, 0.28);
  const lCheese = useParallaxLayer(mouseX, mouseY, 0.50);
  const lTop    = useParallaxLayer(mouseX, mouseY, 0.78);
  const lDriz   = useParallaxLayer(mouseX, mouseY, 0.85);
  const lShine  = useParallaxLayer(mouseX, mouseY, 1.00);

  React.useEffect(() => {
    scaleAll.set(1.045);
    const t = setTimeout(() => scaleAll.set(1), 200);
    return () => clearTimeout(t);
  }, [toppings.length]);

  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width  * 2 - 1);
    mouseY.set((e.clientY - r.top)  / r.height * 2 - 1);
  };
  const onMouseLeave  = () => { mouseX.set(0); mouseY.set(0); };
  const onTouchMove   = (e: React.TouchEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const t = e.touches[0];
    mouseX.set(Math.max(-1, Math.min(1, (t.clientX - r.left) / r.width  * 2 - 1)));
    mouseY.set(Math.max(-1, Math.min(1, (t.clientY - r.top)  / r.height * 2 - 1)));
  };
  const onTouchEnd = () => { mouseX.set(0); mouseY.set(0); };

  // Pizza geometry
  const uid = 'pz';
  const vb = 300; const cx = 150; const cy = 150;
  const crustStyle = getCrustStyle(config.crust || 'Hand Tossed');
  const sauceColors = getSauceColors(config.sauce || '');
  const cheeseAmt = config.cheeseAmount || 'Normal';
  const drizzles = config.drizzles || [];
  const { outerR, crustW } = crustStyle;
  const sauceR = outerR - crustW;
  const cheeseR = sauceR - 4;
  const topR = cheeseR * 0.8;

  const svgProps = {
    viewBox: `0 0 ${vb} ${vb}`,
    xmlns: 'http://www.w3.org/2000/svg',
    style: { width: '100%', height: '100%', overflow: 'visible' } as React.CSSProperties,
  };

  return (
    <div
      ref={ref}
      className="relative w-full aspect-square touch-none select-none"
      style={{ perspective: '950px' }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {/* Shared gradient / filter defs */}
      <SharedDefs uid={uid} crust={crustStyle} sauce={sauceColors}/>

      {/* Ambient ground glow (not part of 3D stack) */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 30% at 50% 82%, rgba(255,110,20,0.3) 0%, transparent 70%)',
        filter: 'blur(18px)',
      }}/>

      {/* ── 3D TILT CONTAINER ───────────────────────────────────────────────── */}
      <motion.div
        style={{
          rotateX, rotateY, rotateZ: -10, scale: scaleAll,
          transformStyle: 'preserve-3d',
          width: '100%', height: '100%',
        }}
      >

        {/* ── LAYER 0: Ground shadow (deepest, least parallax) ── */}
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ x: shadow.x, y: shadow.y }}>
          <svg {...svgProps}>
            <ellipse cx={cx+6} cy={cy+14} rx={outerR-6} ry={outerR*0.32}
              fill="rgba(0,0,0,0.55)" filter={`url(#${uid}-ground-shadow)`}/>
          </svg>
        </motion.div>

        {/* ── LAYER 1: Crust ── */}
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ x: lCrust.x, y: lCrust.y }}>
          <svg {...svgProps}>
            <circle cx={cx} cy={cy} r={outerR} fill={`url(#${uid}-crust)`}/>
            <circle cx={cx} cy={cy} r={outerR} fill={`url(#${uid}-crust-edge)`}/>
            {/* Bake spots on crust edge */}
            {[[-0.72,-0.5],[0.65,-0.55],[0.76,0.48],[-0.6,0.6],[0.0,-0.82],[0.82,0.0]].map(([bx,by],i)=>(
              <circle key={i} cx={cx+bx!*outerR} cy={cy+by!*outerR}
                r={outerR*0.068} fill={crustStyle.edge} opacity={0.3}/>
            ))}
          </svg>
        </motion.div>

        {/* ── LAYER 2: Sauce ── */}
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ x: lSauce.x, y: lSauce.y }}>
          <svg {...svgProps}>
            <defs>
              <clipPath id={`${uid}-sauce-clip`}>
                <circle cx={cx} cy={cy} r={sauceR}/>
              </clipPath>
            </defs>
            {sauceColors ? (
              <circle cx={cx} cy={cy} r={sauceR}
                fill={`url(#${uid}-sauce)`} clipPath={`url(#${uid}-sauce-clip)`}/>
            ) : (
              <circle cx={cx} cy={cy} r={sauceR} fill="#1A0E06"/>
            )}
          </svg>
        </motion.div>

        {/* ── LAYER 3: Cheese (blurred base + crisp top) ── */}
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ x: lCheese.x, y: lCheese.y }}>
          <svg {...svgProps}>
            <defs>
              <clipPath id={`${uid}-cheese-clip`}>
                <circle cx={cx} cy={cy} r={cheeseR}/>
              </clipPath>
            </defs>
            {/* blurred layer (gives melted look) */}
            <g clipPath={`url(#${uid}-cheese-clip)`}
               filter={`url(#${uid}-cheese-blur)`} transform={`translate(${cx},${cy})`}>
              <CheeseBlobs r={cheeseR - 2} amount={cheeseAmt}/>
            </g>
            {/* crisp layer on top */}
            <g clipPath={`url(#${uid}-cheese-clip)`}
               transform={`translate(${cx},${cy})`} opacity={0.5}>
              <CheeseBlobs r={cheeseR - 6} amount={cheeseAmt}/>
            </g>
          </svg>
        </motion.div>

        {/* ── LAYER 4: Toppings ── */}
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ x: lTop.x, y: lTop.y }}>
          <svg {...svgProps}>
            <defs>
              <clipPath id={`${uid}-top-clip`}>
                <circle cx={cx} cy={cy} r={cheeseR}/>
              </clipPath>
            </defs>
            <g clipPath={`url(#${uid}-top-clip)`}
               filter={`url(#${uid}-topping-shadow)`}>
              <AnimatePresence>
                {toppings.map(t => {
                  const tx = cx + (t.x - 50) / 50 * topR;
                  const ty = cy + (t.y - 50) / 50 * topR;
                  const isTomato = t.name.toLowerCase().includes('tomato') && !t.name.toLowerCase().includes('sun');

                  if (isTomato) {
                    // Smooth keyframe animation: fall + spin + squish landing
                    return (
                      <motion.g key={t.id}
                        transform={`translate(${tx},${ty})`}
                        initial={{ opacity: 0, y: -130, scale: 0.08, rotate: t.rotation - 200 }}
                        animate={{
                          opacity: [0,   0.9,         1,            1,           1          ],
                          y:       [-130, -18,          6,           -2,           0          ],
                          scale:   [0.08, t.scale*1.18, t.scale*0.88, t.scale*1.04, t.scale   ],
                          rotate:  [t.rotation-200, t.rotation+18, t.rotation-6, t.rotation+2, t.rotation],
                        }}
                        exit={{ opacity: 0, scale: 0, y: 20, transition: { duration: 0.25, ease: 'easeIn' } }}
                        transition={{
                          duration: 0.78,
                          times:    [0,    0.52,  0.68,  0.84,  1   ],
                          ease:     'easeOut',
                          delay:    t.delay,
                        }}
                      >
                        <ToppingShape name={t.name} s={cheeseR * 0.09} />
                      </motion.g>
                    );
                  }

                  // Default spring drop for all other toppings
                  return (
                    <motion.g key={t.id}
                      transform={`translate(${tx},${ty}) rotate(${t.rotation})`}
                      initial={{ opacity: 0, scale: 0, y: -55 }}
                      animate={{ opacity: 1, scale: t.scale, y: 0 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 22, delay: t.delay }}
                    >
                      <ToppingShape name={t.name} s={cheeseR * 0.09} />
                    </motion.g>
                  );
                })}
              </AnimatePresence>
            </g>
          </svg>
        </motion.div>

        {/* ── LAYER 5: Drizzle ── */}
        {drizzles.length > 0 && (
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ x: lDriz.x, y: lDriz.y }}>
            <svg {...svgProps}>
              <defs>
                <clipPath id={`${uid}-driz-clip`}><circle cx={cx} cy={cy} r={cheeseR}/></clipPath>
              </defs>
              <g clipPath={`url(#${uid}-driz-clip)`} transform={`translate(${cx},${cy})`}>
                <DrizzleLines drizzles={drizzles} r={cheeseR * 0.78}/>
              </g>
            </svg>
          </motion.div>
        )}

        {/* ── LAYER 6: Specular shine (topmost, most parallax) ── */}
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ x: lShine.x, y: lShine.y }}>
          <svg {...svgProps}>
            <defs>
              <clipPath id={`${uid}-shine-clip`}><circle cx={cx} cy={cy} r={outerR}/></clipPath>
            </defs>
            <g clipPath={`url(#${uid}-shine-clip)`}>
              {/* Broad ambient shine */}
              <circle cx={cx} cy={cy} r={outerR} fill={`url(#${uid}-shine)`}/>
              {/* Tight specular flare */}
              <ellipse cx={cx-18} cy={cy-28} rx={outerR*0.38} ry={outerR*0.24}
                fill={`url(#${uid}-flare)`} transform="rotate(-18, 132, 122)"/>
            </g>
          </svg>
        </motion.div>

      </motion.div>
      {/* ── End 3D tilt container ─────────────────────────────────────────── */}

      {/* Steam wisps — outside 3D container so they float above */}
      {toppings.length > 0 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none">
          {[-12, 0, 12].map((offset, i) => (
            <motion.div key={i}
              className="absolute rounded-full bg-white/15 blur-sm"
              style={{ left: offset, bottom: '92%', width: 4, height: 14 + i * 5 }}
              animate={{ y: [-4, -20, -4], opacity: [0, 0.45, 0], scaleX: [1, 1.4, 1] }}
              transition={{ repeat: Infinity, duration: 2 + i * 0.55, delay: i * 0.38, ease: 'easeInOut' }}
            />
          ))}
        </div>
      )}

      {/* Empty state hint */}
      {!config.crust && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-stone-600 text-xs font-bold tracking-widest uppercase">Select a size</p>
        </div>
      )}
    </div>
  );
}
