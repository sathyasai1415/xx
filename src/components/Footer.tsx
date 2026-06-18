import React from 'react';
import {
  Pizza, Instagram, Facebook, Linkedin, Heart,
} from 'lucide-react';

const FOOTER_LINKS = {
  Customers: [
    { label: 'How It Works', href: '#' },
    { label: 'Rewards', href: '#' },
    { label: 'Deals & Alerts', href: '#' },
  ],
  Company: [
    { label: 'About', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'For Store Owners', href: '#' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
  ],
};

const SOCIALS = [
  { icon: Instagram, label: 'Instagram' },
  { icon: Facebook, label: 'Facebook' },
  { icon: Linkedin, label: 'LinkedIn' },
];

export function Footer() {
  return (
    <footer className="relative w-full mt-16">
      <div className="max-w-6xl mx-auto px-5">
        <div className="clay bg-white rounded-3xl px-6 sm:px-10 py-10">

          {/* Top: brand + link columns */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">

            {/* Brand */}
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Pizza className="w-5 h-5 text-white" />
                </div>
                <span className="text-stone-800 font-black text-xl tracking-tight">MiSlice</span>
              </div>
              <p className="text-sm text-stone-400 leading-relaxed">
                Compare pizza prices and deals across Michigan.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-3 gap-8">
              {Object.entries(FOOTER_LINKS).map(([section, links]) => (
                <div key={section}>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-3">{section}</h4>
                  <ul className="space-y-2">
                    {links.map(link => (
                      <li key={link.label}>
                        <a href={link.href} className="text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-stone-100 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-stone-400 font-bold flex items-center gap-1">
              © {new Date().getFullYear()} MiSlice · Made with <Heart className="w-3 h-3 inline text-red-500" /> in Michigan
            </p>
            <div className="flex items-center gap-2">
              {SOCIALS.map(s => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="clay-btn w-8 h-8 rounded-full bg-white flex items-center justify-center text-stone-400 hover:text-amber-500"
                >
                  <s.icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
