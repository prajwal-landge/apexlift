import React from 'react';
import { Shield, Flame } from 'lucide-react';

export default function LevelRing({
  level = 1,
  currentXp = 0,
  neededXp = 50,
  classTitle = "Novice",
  streakWeeks = 0,
  streakFreezes = 0,
  streakMult = 1.0,
  avatarUrl = ""
}) {
  const percentage = neededXp > 0 ? Math.min(100, Math.round((currentXp / neededXp) * 100)) : 100;
  
  // Circumference calculation for SVG ring
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-carbon border border-steel rounded-card p-4 sm:p-5 relative overflow-hidden shadow-xl">
      {/* Subtle background ambient glow for XP gold */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 relative z-10">
        {/* Avatar with Circular Gold Level Ring */}
        <div className="relative flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-steel"
              strokeWidth="6"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Progress Arc in XP Gold */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="text-gold transition-all duration-1000 ease-out"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          {/* User Avatar Image or Fallback */}
          <div className="absolute inset-2.5 rounded-full overflow-hidden border-2 border-steel bg-void flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="font-headline text-2xl text-gold font-bold">{level}</span>
            )}
          </div>

          {/* Level Badge at bottom of circle */}
          <div className="absolute -bottom-1 bg-void border border-gold text-gold font-headline text-xs px-2 py-0.5 rounded-full shadow-md font-bold flex items-center gap-1">
            <span>LVL</span>
            <span className="text-sm">{level}</span>
          </div>
        </div>

        {/* Character Info & XP Bar */}
        <div className="flex-1 w-full text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-2">
            <div>
              <span className="text-xs uppercase tracking-widest text-muted font-mono font-medium block">Class Specialization</span>
              <h2 className="font-headline text-3xl font-extrabold tracking-wide text-chalk uppercase flex items-center justify-center sm:justify-start gap-2">
                {classTitle}
              </h2>
            </div>

            {/* XP Counter: Gold */}
            <div className="font-headline text-lg sm:text-xl font-bold text-gold tracking-wide">
              {currentXp.toLocaleString()} <span className="text-muted font-normal text-sm">/ {neededXp.toLocaleString()} XP</span>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full h-2.5 bg-void border border-steel rounded-full overflow-hidden p-0.5 mb-3">
            <div 
              className="h-full bg-gold rounded-full transition-all duration-700 ease-out shadow-sm shadow-gold/40"
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Consistency Badges: Streak & Freezes */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 text-xs">
            {/* Streak Green Badge */}
            <div className="flex items-center gap-1.5 bg-void/80 border border-steel px-2.5 py-1.5 rounded-lg text-streak font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-streak animate-pulse" />
              <span className="font-headline text-sm tracking-wider uppercase font-bold text-chalk">
                {streakWeeks} Week Streak
              </span>
              <span className="text-[11px] text-streak ml-1 font-mono font-semibold">
                (x{streakMult} XP)
              </span>
            </div>

            {/* Streak Freezes Shield */}
            <div className="flex items-center gap-1.5 bg-void/80 border border-steel px-2.5 py-1.5 rounded-lg text-muted font-medium">
              <Shield className="w-3.5 h-3.5 text-ember-hot" />
              <span className="font-sans text-xs text-chalk">
                <strong className="text-ember-hot">{streakFreezes}</strong> {streakFreezes === 1 ? 'Freeze' : 'Freezes'} Available
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
