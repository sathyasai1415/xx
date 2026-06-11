import React, { useState } from 'react';

interface StoreLogoProps {
  storeName: string;
  logoUrl?: string;     
  brandColor?: string;  
  className?: string;   
}

export function StoreLogo({ storeName, logoUrl, brandColor, className = "w-10 h-10" }: StoreLogoProps) {
  const [imgError, setImgError] = useState(false);

  // Fallback letters (up to 2 capital letters)
  const getInitials = (name: string) => {
    if (!name) return 'S';
    const parts = name.split(/[\s'-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getBackgroundColor = () => {
    if (!brandColor) return 'bg-stone-500';
    if (brandColor.startsWith('bg-') || brandColor.startsWith('#')) return brandColor;
    
    // Map of common names to tailwind colors
    const colorMap: Record<string, string> = {
      red: 'bg-red-600',
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      orange: 'bg-orange-500',
      purple: 'bg-purple-600',
    };
    return colorMap[brandColor.toLowerCase()] || brandColor;
  };

  const bgColorClass = getBackgroundColor();
  const isHex = bgColorClass.startsWith('#');
  const style = isHex ? { backgroundColor: bgColorClass } : {};
  const bgClasses = isHex ? '' : bgColorClass;

  const showPlaceholder = !logoUrl || imgError;

  return (
    <div 
      className={`relative rounded-full flex items-center justify-center overflow-hidden shadow border border-white/20 backdrop-blur-md flex-shrink-0 ${className} ${showPlaceholder ? bgClasses : 'bg-white'}`} 
      style={showPlaceholder ? style : {}}
      title={storeName}
    >
      {!showPlaceholder ? (
        <img 
          src={logoUrl} 
          alt={`${storeName} logo`} 
          className="w-full h-full object-contain bg-white"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-extrabold text-white tracking-widest drop-shadow-sm leading-none" style={{ fontSize: '40%' }}>
          {getInitials(storeName)}
        </span>
      )}
    </div>
  );
}
