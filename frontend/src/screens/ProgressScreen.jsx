import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart 
} from 'recharts';
import { TrendingUp, Award, Calendar, Dumbbell, Zap, Filter } from 'lucide-react';
import { api } from '../api';

export default function ProgressScreen({ userUnits = 'kg' }) {
  const [rangeType, setRangeType] = useState('4w'); // '7d', '4w', '3m'
  const [exercises, setExercises] = useState([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState('ex_dl');
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExercisesList();
  }, []);

  useEffect(() => {
    loadProgress();
  }, [rangeType, selectedExerciseId]);

  const loadExercisesList = async () => {
    try {
      const data = await api.getExercises();
      setExercises(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProgress = async () => {
    setLoading(true);
    try {
      const data = await api.getProgressSummary(rangeType, selectedExerciseId);
      setProgressData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { volume_chart = [], consistency_chart = [], exercise_progress = {}, prs = [] } = progressData || {};

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Title & Timeframe Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-steel pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-gold font-bold">
            Ascent Metrics
          </span>
          <h2 className="font-headline text-3xl font-extrabold text-chalk uppercase tracking-wide">
            Progress & Volume
          </h2>
        </div>

        {/* 7d / 4w / 3m Toggle */}
        <div className="inline-flex p-1 bg-carbon border border-steel rounded-xl self-start sm:self-auto">
          {[
            { id: '7d', label: '7 Days' },
            { id: '4w', label: '4 Weeks' },
            { id: '3m', label: '3 Months' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRangeType(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg font-headline text-xs font-bold uppercase tracking-wider transition-all ${
                rangeType === tab.id
                  ? 'bg-ember text-white shadow-md'
                  : 'text-muted hover:text-chalk'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Volume Trend (Tonnage) Chart */}
      <div className="bg-carbon border border-steel rounded-card p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-headline text-xl font-bold text-chalk uppercase tracking-wide">
              Mechanical Volume (Tonnage)
            </h3>
            <p className="text-xs text-muted">
              Total kg moved (sets × reps × weight) across the selected interval.
            </p>
          </div>
          <Dumbbell className="w-5 h-5 text-gold" />
        </div>

        <div className="w-full h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volume_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#9A9AA3" 
                fontSize={11} 
                tickLine={false}
                fontFamily="Barlow Condensed"
              />
              <YAxis 
                stroke="#9A9AA3" 
                fontSize={11} 
                tickLine={false} 
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#141416', borderColor: '#2A2A30', borderRadius: '12px' }}
                itemStyle={{ color: '#F5B53C', fontWeight: 'bold', fontFamily: 'Barlow Condensed' }}
                labelStyle={{ color: '#F4F4F5', fontWeight: 'bold' }}
                formatter={(val) => [`${val.toLocaleString()} ${userUnits}`, 'Volume']}
              />
              <Bar 
                dataKey="volume" 
                fill="#F5B53C" 
                radius={[6, 6, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Consistency % (Sessions vs Weekly Target) */}
      <div className="bg-carbon border border-steel rounded-card p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-headline text-xl font-bold text-chalk uppercase tracking-wide">
              Consistency Output (Sessions Cleared)
            </h3>
            <p className="text-xs text-muted">
              Showing up builds character stats and protects streak multipliers.
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-streak" />
        </div>

        <div className="w-full h-52 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={consistency_chart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="streakGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D27B" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#34D27B" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#9A9AA3" 
                fontSize={11} 
                tickLine={false}
                fontFamily="Barlow Condensed"
              />
              <YAxis 
                stroke="#9A9AA3" 
                fontSize={11} 
                tickLine={false} 
                domain={[0, 7]}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#141416', borderColor: '#2A2A30', borderRadius: '12px' }}
                itemStyle={{ color: '#34D27B', fontWeight: 'bold' }}
                labelStyle={{ color: '#F4F4F5', fontWeight: 'bold' }}
                formatter={(val) => [`${val} workouts`, 'Sessions']}
              />
              <Area 
                type="monotone" 
                dataKey="sessions" 
                stroke="#34D27B" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#streakGrad)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Lifted Weight Progress per Exercise */}
      <div className="bg-carbon border border-steel rounded-card p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-headline text-xl font-bold text-chalk uppercase tracking-wide">
              Top Working Weight Trend
            </h3>
            <p className="text-xs text-muted">
              Select an exercise to inspect overload progression over time.
            </p>
          </div>

          {/* Exercise Selector Dropdown */}
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="bg-void border border-steel rounded-xl px-3 py-2 text-xs text-chalk font-headline font-bold uppercase tracking-wider focus:outline-none focus:border-ember"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full h-56 sm:h-60">
          {exercise_progress.data && exercise_progress.data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exercise_progress.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#9A9AA3" 
                  fontSize={10} 
                  tickLine={false} 
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis stroke="#9A9AA3" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141416', borderColor: '#2A2A30', borderRadius: '12px' }}
                  itemStyle={{ color: '#FF5A4D', fontWeight: 'bold' }}
                  labelStyle={{ color: '#F4F4F5', fontWeight: 'bold' }}
                  formatter={(val) => [`${val} ${userUnits}`, 'Max Set']}
                />
                <Line 
                  type="monotone" 
                  dataKey="max_weight" 
                  stroke="#FF5A4D" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#FF5A4D' }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted text-xs">
              No sessions recorded for {exercise_progress.exercise_name} in this timeframe.
            </div>
          )}
        </div>
      </div>

      {/* 4. Complete Personal Records Wall */}
      <div className="bg-carbon border border-steel rounded-card p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-gold" />
            <h3 className="font-headline text-xl font-bold text-chalk uppercase tracking-wide">
              Personal Record Hall of Fame
            </h3>
          </div>
          <span className="text-xs text-gold font-mono uppercase font-bold">
            +50 XP per new PR
          </span>
        </div>

        {prs.length === 0 ? (
          <div className="text-center py-6 text-muted text-xs">
            No PRs recorded yet. Complete workout sessions to establish your benchmarks.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {prs.map((pr, idx) => (
              <div 
                key={idx}
                className="bg-void border border-steel rounded-xl p-3.5 flex flex-col justify-between hover:border-gold/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-1">
                  <h5 className="font-headline text-base font-bold text-chalk uppercase leading-tight truncate">
                    {pr.exercise}
                  </h5>
                  <span className="text-[10px] text-streak font-mono font-bold">PR</span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="font-headline text-3xl font-extrabold text-gold tracking-tight">
                    {pr.weight} <span className="text-xs text-muted font-normal uppercase">{userUnits}</span>
                  </span>
                  <span className="text-xs text-muted font-mono">{pr.reps} reps</span>
                </div>

                <span className="text-[10px] text-muted font-mono mt-1">
                  Achieved: {pr.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
