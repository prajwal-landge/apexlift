import React, { useState, useEffect } from 'react';
import { 
  Target, Shield, Award, CheckCircle2, Clock, 
  Flame, Skull, Zap, ArrowRight 
} from 'lucide-react';
import { api } from '../api';

export default function QuestsScreen({ onRewardClaimed }) {
  const [quests, setQuests] = useState({ daily: [], weekly: null, boss: null, comeback: null });
  const [loading, setLoading] = useState(true);
  const [claimStatus, setClaimStatus] = useState('');

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    setLoading(true);
    try {
      const data = await api.getQuests();
      setQuests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (questId) => {
    try {
      const res = await api.claimQuest(questId);
      setClaimStatus(res.message);
      await loadQuests();
      if (onRewardClaimed) onRewardClaimed(res);
      setTimeout(() => setClaimStatus(''), 3500);
    } catch (err) {
      setClaimStatus(err.message);
    }
  };

  const { daily = [], weekly, boss, comeback } = quests;

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-steel pb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-gold font-bold">
          Ascent Contracts
        </span>
        <h2 className="font-headline text-3xl font-extrabold text-chalk uppercase tracking-wide">
          Bounties & Quests
        </h2>
        <p className="text-muted text-xs font-sans mt-0.5">
          Complete daily habits, weekly targets, and monthly boss raids to earn bonus XP and streak freezes.
        </p>
      </div>

      {claimStatus && (
        <div className="bg-streak/15 border border-streak text-chalk p-3.5 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-streak flex-shrink-0" />
          <span>{claimStatus}</span>
        </div>
      )}

      {/* Comeback Quest Callout if inactive > 5 days */}
      {comeback && (
        <div className="bg-gradient-to-r from-ember/20 to-carbon border-2 border-ember-hot rounded-card p-5 relative overflow-hidden shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="bg-ember-hot text-white text-[10px] font-headline uppercase font-bold px-2 py-0.5 rounded-md inline-block">
                Momentum Resurgence: 2.0x Multiplier
              </span>
              <h3 className="font-headline text-2xl font-black text-chalk uppercase">
                {comeback.title}
              </h3>
              <p className="text-xs text-muted max-w-lg">
                {comeback.description}
              </p>
            </div>

            <div className="text-right">
              <span className="font-headline text-2xl font-bold text-gold block">
                +{comeback.reward_xp} XP & +{comeback.reward_freeze} Freeze
              </span>
              <span className="text-xs text-muted font-mono">
                Progress: {comeback.current_value} / {comeback.target_value} Sessions
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Monthly Boss Challenge */}
      {boss && (
        <div className="bg-carbon border border-steel rounded-card p-5 space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-ember/10 to-transparent pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-void border border-ember/60 flex items-center justify-center text-ember-hot">
                <Skull className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-ember-hot font-bold">
                  Monthly Season Raid Boss
                </span>
                <h3 className="font-headline text-2xl font-black text-chalk uppercase">
                  {boss.boss_name || "Titan of Inertia"}
                </h3>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="font-headline text-xl font-bold text-gold">
                +{boss.reward_xp} XP & +{boss.reward_freeze} Freezes
              </span>
              <p className="text-[11px] text-muted">
                Requires 20 completed sessions in 30 days
              </p>
            </div>
          </div>

          {/* Boss Health Bar */}
          <div className="space-y-1.5 relative z-10">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-muted">Boss HP: <strong className="text-ember-hot">{boss.boss_current_hp} / {boss.boss_max_hp || 20}</strong></span>
              <span className="text-gold font-bold">{boss.progress_pct}% Defeated</span>
            </div>

            <div className="w-full h-4 bg-void border border-steel rounded-full overflow-hidden p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-ember to-ember-hot rounded-full transition-all duration-700 shadow-md"
                style={{ width: `${Math.max(5, 100 - (boss.boss_current_hp / (boss.boss_max_hp || 20)) * 100)}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-muted font-sans relative z-10">
            Every workout you log strikes down 1 HP of Inertia. Strike down all 20 before the season resets to claim the Season Trophy.
          </p>
        </div>
      )}

      {/* 2. Weekly Target Quest */}
      {weekly && (
        <div className="bg-carbon border border-steel rounded-card p-5 space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-streak font-bold">
                Weekly Target Contract
              </span>
              <h3 className="font-headline text-2xl font-bold text-chalk uppercase">
                {weekly.title}
              </h3>
              <p className="text-xs text-muted font-sans mt-0.5">
                {weekly.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-headline text-lg font-bold text-gold">
                +{weekly.reward_xp} XP & +{weekly.reward_freeze} Freeze
              </span>

              {weekly.is_completed && !weekly.is_claimed && (
                <button
                  onClick={() => handleClaim(weekly.id)}
                  className="min-h-[44px] px-4 bg-streak hover:bg-streak/90 text-void font-headline text-sm font-bold uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
                >
                  Claim Reward
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-void border border-steel rounded-full overflow-hidden p-0.5">
            <div 
              className="h-full bg-streak rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, weekly.progress_pct || 0)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-muted">
            <span>{weekly.current_value} of {weekly.target_value} Sessions Completed</span>
            <span className="text-streak font-bold">{weekly.progress_pct}%</span>
          </div>
        </div>
      )}

      {/* 3. Daily Quests List */}
      <div className="bg-carbon border border-steel rounded-card p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold text-chalk uppercase tracking-wide">
            Daily Habits & Micro-Quests
          </h3>
          <span className="text-xs text-muted font-mono">Resets Every Midnight</span>
        </div>

        <div className="space-y-3">
          {daily.map((q) => (
            <div 
              key={q.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                q.is_completed 
                  ? 'bg-void/40 border-steel/50 opacity-80' 
                  : 'bg-void border-steel hover:border-steel/80'
              }`}
            >
              <div className="flex items-start gap-3">
                {q.is_completed ? (
                  <CheckCircle2 className="w-5 h-5 text-streak flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-steel flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-headline text-base font-bold text-chalk uppercase leading-tight">
                    {q.title}
                  </h4>
                  <p className="text-xs text-muted mt-0.5">{q.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-steel/40">
                <span className="font-headline text-base font-bold text-gold">
                  +{q.reward_xp} XP
                </span>

                {q.is_completed && !q.is_claimed && (
                  <button
                    onClick={() => handleClaim(q.id)}
                    className="min-h-[40px] px-3.5 bg-streak hover:bg-streak/90 text-void font-headline text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
                  >
                    Claim
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
