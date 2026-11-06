import React, { useState } from 'react';
import LevelRing from '../components/LevelRing';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { 
  Zap, Flame, Shield, ArrowRight, CheckCircle2, Circle, 
  TrendingUp, Dumbbell, Award, Clock, AlertCircle, Sparkles, Smile, Meh, Frown
} from 'lucide-react';

export default function DashboardScreen({
  dashboardData,
  onNavigate,
  onCheckin,
  isLoading,
  error
}) {
  const [checkinLoading, setCheckinLoading] = useState(false);

  if (isLoading && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-2 border-ember border-t-transparent rounded-full animate-spin" />
        <p className="text-muted text-sm font-headline tracking-wide uppercase">Summoning Apex Character...</p>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="bg-carbon border border-ember/40 rounded-card p-6 text-center max-w-md mx-auto my-8">
        <AlertCircle className="w-10 h-10 text-ember mx-auto mb-3" />
        <h3 className="font-headline text-xl text-chalk">Failed to load dashboard</h3>
        <p className="text-xs text-muted mt-1 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="min-h-[48px] px-6 bg-ember text-white font-headline uppercase font-bold rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  const {
    user,
    next_action,
    today_checkin,
    daily_quests = [],
    weekly_quest,
    boss_quest,
    radar_data = [],
    weakest_stat,
    weakest_hint,
    current_goal,
    weekly_stats,
    recent_workouts = [],
    personal_records = [],
    milestones = []
  } = dashboardData || {};

  const handleQuickCheckin = async (state) => {
    setCheckinLoading(true);
    try {
      await onCheckin(state);
    } finally {
      setCheckinLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Character Hero & Level Ring */}
      <LevelRing
        level={user?.level || 1}
        currentXp={user?.current_level_xp || 0}
        neededXp={user?.xp_needed_next_level || 50}
        classTitle={user?.class_title || "Novice"}
        streakWeeks={user?.weekly_streak || 0}
        streakFreezes={user?.streak_freezes || 0}
        streakMult={user?.streak_mult || 1.0}
        avatarUrl={user?.avatar_url}
      />

      {/* 2. Next Best Action Card */}
      <div className="bg-carbon border border-steel rounded-card p-5 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-ember/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-ember-hot font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Next Best Action
            </span>
            <h3 className="font-headline text-2xl font-black text-chalk tracking-wide uppercase">
              {next_action?.title || "Claim The Bar"}
            </h3>
            <p className="text-muted text-xs sm:text-sm font-sans max-w-lg">
              {next_action?.subtitle || "Show up today to safeguard your streak and accumulate XP."}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('workout')}
              className="flex-1 sm:flex-initial min-h-[48px] px-6 bg-ember hover:bg-ember-hot text-white font-headline text-lg font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-ember/25 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>{next_action?.cta_label || "Start Workout"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => onNavigate('workout', { isMini: true })}
              className="min-h-[48px] px-4 bg-void border border-steel hover:border-chalk/40 text-chalk font-headline text-sm font-bold uppercase tracking-wide rounded-xl transition-all flex items-center justify-center active:scale-95 whitespace-nowrap"
              title="Only 1 set needed. Save momentum."
            >
              Mini Session
            </button>
          </div>
        </div>
      </div>

      {/* 3. Daily Energy Check-in */}
      <div className="bg-carbon border border-steel rounded-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-headline text-lg font-bold text-chalk uppercase tracking-wide">
              Daily Ready Check (+10 XP)
            </h4>
            <p className="text-xs text-muted">
              Low energy days earn a 1.5x Grit Multiplier on workouts!
            </p>
          </div>
          {today_checkin?.completed && (
            <span className="inline-flex items-center gap-1 text-xs font-headline font-bold text-streak uppercase bg-streak/10 border border-streak/30 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Checked In ({today_checkin.energy_state})
            </span>
          )}
        </div>

        {!today_checkin?.completed ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              disabled={checkinLoading}
              onClick={() => handleQuickCheckin("Energized")}
              className="min-h-[48px] p-3 rounded-xl bg-void border border-steel hover:border-streak/60 text-chalk hover:text-streak flex flex-col sm:flex-row items-center justify-center gap-2 transition-all active:scale-95 group"
            >
              <Smile className="w-5 h-5 text-streak group-hover:scale-110 transition-transform" />
              <div className="text-center sm:text-left">
                <span className="font-headline text-sm font-bold uppercase block leading-tight">Energized</span>
                <span className="text-[10px] text-muted block sm:inline">100% Ready</span>
              </div>
            </button>

            <button
              disabled={checkinLoading}
              onClick={() => handleQuickCheckin("Okay")}
              className="min-h-[48px] p-3 rounded-xl bg-void border border-steel hover:border-gold/60 text-chalk hover:text-gold flex flex-col sm:flex-row items-center justify-center gap-2 transition-all active:scale-95 group"
            >
              <Meh className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
              <div className="text-center sm:text-left">
                <span className="font-headline text-sm font-bold uppercase block leading-tight">Okay</span>
                <span className="text-[10px] text-muted block sm:inline">Steady state</span>
              </div>
            </button>

            <button
              disabled={checkinLoading}
              onClick={() => handleQuickCheckin("Low energy")}
              className="min-h-[48px] p-3 rounded-xl bg-void border border-steel hover:border-ember/60 text-chalk hover:text-ember-hot flex flex-col sm:flex-row items-center justify-center gap-2 transition-all active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute -top-1 -right-1 bg-ember text-white text-[9px] font-headline uppercase font-bold px-1.5 py-0.2 rounded-bl">
                1.5x Grit
              </div>
              <Frown className="w-5 h-5 text-ember-hot group-hover:scale-110 transition-transform" />
              <div className="text-center sm:text-left">
                <span className="font-headline text-sm font-bold uppercase block leading-tight">Low Energy</span>
                <span className="text-[10px] text-muted block sm:inline">Grind mode</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-void/60 border border-steel/60 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-chalk">
              State recorded: <strong className="text-gold uppercase font-headline text-sm tracking-wide">{today_checkin.energy_state}</strong>
            </span>
            <span className="text-muted text-[11px]">
              Ready bonus applied to today's sessions
            </span>
          </div>
        )}
      </div>

      {/* 4. Two-Column Grid: Character Radar & Quests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Character Stat Radar Chart */}
        <div className="bg-carbon border border-steel rounded-card p-5 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-headline text-xl font-bold text-chalk uppercase tracking-wide">
                Character Attributes
              </h3>
              <span className="text-xs text-muted font-mono uppercase">Scale 0 - 100</span>
            </div>
            <p className="text-xs text-muted mb-3">
              Exercises feed stats: Heavy lifts &rarr; STR, Conditioning &rarr; END, Core/Variety &rarr; AGI, Consistency &rarr; DISCIPLINE.
            </p>

            {/* Radar Chart */}
            <div className="w-full h-60 sm:h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radar_data}>
                  <PolarGrid stroke="#2A2A30" strokeDasharray="3 3" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#F4F4F5', fontSize: 12, fontFamily: 'Barlow Condensed', fontWeight: 700 }} 
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={false} 
                    axisLine={false} 
                  />
                  <Radar
                    name="Jordan"
                    dataKey="value"
                    stroke="#FF5A4D"
                    fill="#E02A1F"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weakest Stat Hint Card */}
          <div className="mt-3 bg-void border border-steel rounded-xl p-3 text-xs">
            <div className="flex items-center gap-1.5 text-ember-hot font-headline uppercase font-bold text-xs mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Weakest Attribute: {weakest_stat}</span>
            </div>
            <p className="text-muted text-xs leading-relaxed">
              {weakest_hint}
            </p>
          </div>
        </div>

        {/* Right: Today's Quests & Weekly Progress */}
        <div className="bg-carbon border border-steel rounded-card p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-headline text-xl font-bold text-chalk uppercase tracking-wide">
                Active Quests
              </h3>
              <button 
                onClick={() => onNavigate('quests')}
                className="text-xs text-ember-hot hover:underline font-headline font-bold uppercase tracking-wide"
              >
                View All
              </button>
            </div>

            {/* Daily Quests List */}
            <div className="space-y-2.5">
              {daily_quests.slice(0, 3).map((q) => (
                <div 
                  key={q.id}
                  className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                    q.is_completed 
                      ? 'bg-void/40 border-steel/40 opacity-75' 
                      : 'bg-void border-steel hover:border-steel/80'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {q.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-streak flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-steel flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h5 className="font-headline text-base font-bold text-chalk uppercase tracking-wide leading-tight">
                        {q.title}
                      </h5>
                      <p className="text-xs text-muted font-sans line-clamp-1">{q.description}</p>
                    </div>
                  </div>

                  <span className="font-headline text-sm font-bold text-gold flex-shrink-0">
                    +{q.reward_xp} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Quest Banner */}
          {weekly_quest && (
            <div className="bg-void border border-steel/80 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-headline font-bold text-chalk uppercase tracking-wider text-sm">
                  {weekly_quest.title}
                </span>
                <span className="font-headline font-bold text-gold">
                  +{weekly_quest.reward_xp} XP {weekly_quest.reward_freeze ? '+1 Freeze' : ''}
                </span>
              </div>
              <div className="w-full h-2 bg-carbon rounded-full overflow-hidden mb-1.5">
                <div 
                  className="h-full bg-streak rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, weekly_quest.progress_pct || 0)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-muted font-mono">
                <span>{weekly_quest.current_value} / {weekly_quest.target_value} Sessions Completed</span>
                <span className="text-streak font-bold">{weekly_quest.progress_pct}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Goal & Weekly Performance Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Goal Card with Progress Ring */}
        <div className="bg-carbon border border-steel rounded-card p-5 flex items-center gap-4 shadow-md">
          <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-steel"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-ember"
                strokeDasharray={`${current_goal?.progress_pct || 0}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-headline text-sm font-bold text-chalk">
              {current_goal?.progress_pct}%
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted block">Current Target</span>
            <h4 className="font-headline text-base font-bold text-chalk uppercase truncate">
              {current_goal?.title}
            </h4>
            <p className="text-xs text-muted">
              Current: <strong className="text-chalk">{current_goal?.current_weight} kg</strong> / Goal: {current_goal?.target_weight} kg
            </p>
          </div>
        </div>

        {/* Weekly Consistency % */}
        <div className="bg-carbon border border-steel rounded-card p-5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Weekly Consistency</span>
            <TrendingUp className="w-4 h-4 text-streak" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-4xl font-extrabold text-chalk">
                {weekly_stats?.consistency_pct || 0}%
              </span>
              <span className="text-xs text-streak font-headline font-bold uppercase">
                {weekly_stats?.sessions_count} of {weekly_stats?.sessions_target} target
              </span>
            </div>
            <div className="w-full h-1.5 bg-void rounded-full overflow-hidden mt-2">
              <div 
                className="h-full bg-streak rounded-full"
                style={{ width: `${Math.min(100, weekly_stats?.consistency_pct || 0)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Weekly Tonnage Volume */}
        <div className="bg-carbon border border-steel rounded-card p-5 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Weekly Volume (Tonnage)</span>
            <Dumbbell className="w-4 h-4 text-gold" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-4xl font-extrabold text-gold">
                {((weekly_stats?.volume_kg || 0) / 1000).toFixed(1)} <span className="text-sm font-normal text-muted">tons</span>
              </span>
            </div>
            <p className="text-xs text-muted mt-1">
              Total mechanical work logged across all sets
            </p>
          </div>
        </div>
      </div>

      {/* 6. Recent Workouts Feed & Personal Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workouts */}
        <div className="bg-carbon border border-steel rounded-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-headline text-xl font-bold text-chalk uppercase tracking-wide">
              Recent Sessions
            </h4>
            <button
              onClick={() => onNavigate('workout')}
              className="text-xs text-ember-hot hover:underline font-headline font-bold uppercase"
            >
              + Log New
            </button>
          </div>

          {recent_workouts.length === 0 ? (
            <div className="text-center py-8 text-muted text-xs">
              No workouts logged yet. Hit the gym and make today count.
            </div>
          ) : (
            <div className="space-y-3">
              {recent_workouts.map((w) => (
                <div key={w.id} className="bg-void border border-steel rounded-xl p-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-base font-bold text-chalk uppercase">
                        {w.is_mini_session ? "Mini Session" : "Workout Session"}
                      </span>
                      {w.is_mini_session && (
                        <span className="bg-steel/60 text-muted text-[10px] font-headline uppercase px-1.5 py-0.5 rounded">
                          1+ Set
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span>{w.date}</span>
                      <span>•</span>
                      <span>{w.duration_minutes} min</span>
                      <span>•</span>
                      <span>{w.sets?.length || 0} sets</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-headline text-lg font-bold text-gold block leading-none">
                      +{w.xp_earned} XP
                    </span>
                    {w.prs_achieved > 0 && (
                      <span className="text-[10px] text-streak font-headline font-bold uppercase">
                        ★ {w.prs_achieved} PR
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personal Records Showcase */}
        <div className="bg-carbon border border-steel rounded-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-headline text-xl font-bold text-chalk uppercase tracking-wide">
              Top Personal Records
            </h4>
            <button
              onClick={() => onNavigate('progress')}
              className="text-xs text-ember-hot hover:underline font-headline font-bold uppercase"
            >
              All Records
            </button>
          </div>

          {personal_records.length === 0 ? (
            <div className="text-center py-8 text-muted text-xs">
              Log heavier work sets as you progress to track milestones here.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {personal_records.map((pr, idx) => (
                <div key={idx} className="bg-void border border-steel rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-xs text-muted font-sans truncate">{pr.exercise}</span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="font-headline text-2xl font-bold text-gold">
                      {pr.weight} <span className="text-xs font-normal text-muted">kg</span>
                    </span>
                    <span className="text-[10px] text-muted font-mono">{pr.reps} reps</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Milestones Timeline */}
          {milestones && milestones.length > 0 && (
            <div className="mt-5 pt-4 border-t border-steel/60">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-2">
                Recent Milestones
              </span>
              <div className="space-y-2">
                {milestones.slice(0, 2).map((m) => (
                  <div key={m.id} className="flex items-center gap-2 text-xs">
                    <Award className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                    <span className="font-headline font-bold text-chalk uppercase">{m.title}</span>
                    <span className="text-muted text-[10px] truncate">— {m.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
