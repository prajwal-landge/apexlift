import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Zap, ArrowUpRight, Flame, CheckCircle, X } from 'lucide-react';

export default function RewardModal({ rewardData, onClose }) {
  if (!rewardData) return null;

  const {
    xp_earned = 0,
    raw_xp = 0,
    breakdown = [],
    multipliers = {},
    level_up = false,
    new_level = 1,
    new_class = "",
    prs_achieved = [],
    is_capped = false,
    streak_weeks = 0
  } = rewardData;

  useEffect(() => {
    // Subtle, fast confetti burst under 1.5 seconds
    try {
      confetti({
        particleCount: level_up ? 80 : 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#F5B53C', '#E02A1F', '#FF5A4D', '#34D27B', '#FFFFFF'],
        ticks: 120,
        disableForReducedMotion: true
      });
    } catch (_) {}
  }, [level_up]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-carbon border border-steel rounded-card max-w-md w-full p-6 relative overflow-hidden shadow-2xl text-center transform transition-all animate-xp-pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reward-title"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 bg-gold/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted hover:text-chalk rounded-lg hover:bg-steel/30 transition-colors"
          aria-label="Close reward popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Level Up Banner */}
        {level_up ? (
          <div className="inline-flex items-center gap-2 bg-gold/15 border border-gold/40 text-gold px-3.5 py-1.5 rounded-full font-headline tracking-wider text-sm font-bold uppercase mb-3">
            <Zap className="w-4 h-4 fill-gold" />
            <span>LEVEL UP ACHIEVED! LEVEL {new_level}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 bg-streak/10 border border-streak/30 text-streak px-3 py-1 rounded-full font-headline tracking-wider text-xs font-bold uppercase mb-3">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>SESSION RECORDED</span>
          </div>
        )}

        <h2 id="reward-title" className="font-headline text-3xl font-black text-chalk uppercase tracking-wide">
          {level_up ? `Welcome to Level ${new_level}` : "You Showed Up. That's The Win."}
        </h2>
        <p className="text-muted text-xs font-sans mt-0.5 mb-5">
          XP rewards showing up, never weight lifted. Momentum secured.
        </p>

        {/* Big XP Earned Display */}
        <div className="bg-void/70 border border-steel rounded-xl p-4 mb-5 relative">
          <div className="flex items-center justify-center gap-2">
            <span className="font-headline text-5xl font-black text-gold tracking-tight drop-shadow-sm">
              +{xp_earned}
            </span>
            <span className="font-headline text-2xl font-bold text-gold/80 uppercase">
              XP
            </span>
          </div>

          {is_capped && (
            <p className="text-[11px] text-muted mt-1 font-mono">
              (Daily cap of 300 XP reached. Rest and recover!)
            </p>
          )}
        </div>

        {/* XP Breakdown List */}
        <div className="space-y-2 mb-6 text-left">
          <span className="text-[11px] uppercase tracking-wider text-muted font-mono block px-1">
            XP Breakdown
          </span>
          <div className="bg-void/50 border border-steel/60 rounded-xl p-3 divide-y divide-steel/40 text-xs">
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-1.5 first:pt-0 last:pb-0">
                <span className="text-chalk font-medium flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                  {item.label}
                </span>
                <span className="font-headline text-sm font-bold text-gold">
                  {item.amount ? `+${item.amount} XP` : `${item.multiplier}x`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PR Highlights if any */}
        {prs_achieved && prs_achieved.length > 0 && (
          <div className="mb-6 text-left bg-gold/10 border border-gold/30 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-gold font-headline text-sm font-bold uppercase mb-1.5">
              <Award className="w-4 h-4" />
              <span>Personal Record Unlocked!</span>
            </div>
            <div className="space-y-1">
              {prs_achieved.map((pr, i) => (
                <div key={i} className="text-xs text-chalk flex justify-between items-center">
                  <span>{pr.exercise}</span>
                  <span className="font-headline font-bold text-gold text-sm">
                    {pr.weight} kg <span className="text-muted font-normal text-[10px]">(+50 bonus XP)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Action Button (Min 48px tall) */}
        <button
          onClick={onClose}
          className="w-full min-h-[48px] bg-ember hover:bg-ember-hot text-white font-headline text-lg font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-ember/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <span>Continue The Ascent</span>
          <ArrowUpRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
