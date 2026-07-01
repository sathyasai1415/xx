import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Volume2, VolumeX } from 'lucide-react';

interface Props {
  onDismiss: () => void;
}

export function VideoIntro({ onDismiss }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  const dismiss = () => setVisible(false);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted(videoRef.current.muted);
  };

  return (
    <AnimatePresence onExitComplete={onDismiss}>
      {visible && (
        <motion.div
          key="video-intro"
          initial={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
          onClick={dismiss}
        >
          {/* Video */}
          <video
            ref={videoRef}
            src="/hero-bg.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Dark overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/60 pointer-events-none" />

          {/* Brand mark */}
          <motion.div
            className="relative z-10 text-center pointer-events-none select-none"
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
          >
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              <span className="text-4xl">🍕</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight drop-shadow-[0_2px_16px_rgba(0,0,0,0.8)]">
              MiSlice
            </h1>
            <p className="text-white/60 text-base font-medium mt-2 tracking-wide drop-shadow-lg">
              Michigan's Pizza Marketplace
            </p>
          </motion.div>

          {/* Mute / Unmute button */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            onClick={toggleMute}
            className="absolute bottom-10 left-6 flex items-center gap-2 px-4 py-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 hover:border-white/40 text-white/80 hover:text-white text-sm font-bold rounded-full transition-all duration-200 shadow-lg z-20"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {muted ? 'Unmute' : 'Mute'}
          </motion.button>

          {/* Skip / Cancel button */}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            onClick={e => { e.stopPropagation(); dismiss(); }}
            className="absolute bottom-10 right-6 flex items-center gap-2 px-4 py-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 hover:border-white/40 text-white/80 hover:text-white text-sm font-bold rounded-full transition-all duration-200 shadow-lg z-20"
          >
            <X className="w-3.5 h-3.5" />
            Skip
          </motion.button>

          {/* Tap anywhere hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 text-xs font-medium tracking-wider pointer-events-none z-20"
          >
            Tap anywhere to continue
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
