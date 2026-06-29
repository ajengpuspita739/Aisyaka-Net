import React from 'react';
import { motion } from 'motion/react';

interface NeonBoxProps {
  children: React.ReactNode;
  id?: string;
  title?: string;
  subtitle?: string;
  variant?: 'cyan' | 'emerald' | 'red' | 'amber' | 'fuchsia';
  className?: string;
  onClick?: () => void;
  withGlitch?: boolean;
  key?: React.Key;
}

export default function NeonBox({
  children,
  id,
  title,
  subtitle,
  variant = 'cyan',
  className = '',
  onClick,
  withGlitch = false,
}: NeonBoxProps) {
  // Map variant to styling classes defined in index.css
  const getBoxClass = () => {
    switch (variant) {
      case 'emerald':
        return 'neon-box-emerald';
      case 'red':
        return 'neon-box-red';
      case 'amber':
        return 'neon-box-amber';
      case 'fuchsia':
        return 'neon-box-fuchsia';
      case 'cyan':
      default:
        return 'neon-box-cyan';
    }
  };

  const getGlowTextClass = () => {
    switch (variant) {
      case 'emerald':
        return 'text-emerald-400 neon-glow-emerald';
      case 'red':
        return 'text-red-400 neon-glow-red';
      case 'amber':
        return 'text-amber-400 neon-glow-amber';
      case 'fuchsia':
        return 'text-fuchsia-400';
      case 'cyan':
      default:
        return 'text-cyan-400 neon-glow-cyan';
    }
  };

  const getAccentBgClass = () => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'red':
        return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'amber':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'fuchsia':
        return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/40';
      case 'cyan':
      default:
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    }
  };

  const getCornerClass = () => {
    switch (variant) {
      case 'emerald':
        return 'border-emerald-400';
      case 'red':
        return 'border-red-400';
      case 'amber':
        return 'border-amber-400';
      case 'fuchsia':
        return 'border-fuchsia-400';
      case 'cyan':
      default:
        return 'border-cyan-400';
    }
  };

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative rounded-none p-5 overflow-hidden transition-all duration-300 ${getBoxClass()} ${
        onClick ? 'cursor-pointer select-none' : ''
      } ${className}`}
      onClick={onClick}
    >
      {/* Visual cyber decoration - corner brackets */}
      <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${getCornerClass()}`} />
      <div className={`absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 ${getCornerClass()}`} />
      <div className={`absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 ${getCornerClass()}`} />
      <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${getCornerClass()}`} />

      {/* Grid Pattern BG */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

      {/* Cybernetic scanner sweep for fuchsia or critical boxes */}
      {withGlitch && (
        <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-${variant}-500 to-transparent opacity-40 animate-pulse`} />
      )}

      {/* Header Info */}
      {(title || subtitle) && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4 pb-2 border-b border-white/5">
          <div>
            {title && (
              <h3 className={`font-orbitron font-bold tracking-widest text-sm md:text-base uppercase ${getGlowTextClass()}`}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="font-mono text-[10px] text-slate-400 tracking-wider">
                // {subtitle}
              </p>
            )}
          </div>
          
          {/* Cyber status badge */}
          <span className={`text-[9px] font-mono border px-1.5 py-0.5 tracking-tight uppercase ${getAccentBgClass()}`}>
            SYS::{variant}_OK
          </span>
        </div>
      )}

      {/* Inner Content */}
      <div className="relative z-10 w-full text-slate-100">
        {children}
      </div>
    </motion.div>
  );
}
