import React, { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle2, ChevronRight, Play, 
  Dumbbell, Sparkles, AlertCircle, ArrowRight 
} from 'lucide-react';
import { api } from '../api';

export default function PlansScreen({ onStartWorkout }) {
  const [programs, setPrograms] = useState([]);
  const [activeUserProgram, setActiveUserProgram] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const data = await api.getPrograms();
      setPrograms(data.programs || []);
      setActiveUserProgram(data.active_user_program);
      if (data.active_user_program) {
        setSelectedProgramId(data.active_user_program.program_id);
      } else if (data.programs.length > 0) {
        setSelectedProgramId(data.programs[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProgram = async (programId) => {
    try {
      const res = await api.selectProgram(programId);
      setActionMessage(res.message);
      await loadPrograms();
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const currentProgram = programs.find(p => p.id === selectedProgramId) || programs[0];

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-steel pb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-ember-hot font-bold">
          Disciplined Progression
        </span>
        <h2 className="font-headline text-3xl font-extrabold text-chalk uppercase tracking-wide">
          Training Programs
        </h2>
        <p className="text-muted text-xs font-sans mt-0.5">
          Follow a structured path. Completing a planned program session grants a <strong className="text-gold">+25 XP Bonus</strong> every time.
        </p>
      </div>

      {actionMessage && (
        <div className="bg-streak/15 border border-streak text-chalk p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-streak flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Program Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {programs.map((prog) => {
          const isActive = activeUserProgram?.program_id === prog.id;
          const isSelected = selectedProgramId === prog.id;

          return (
            <div
              key={prog.id}
              onClick={() => setSelectedProgramId(prog.id)}
              className={`p-4 rounded-card border cursor-pointer transition-all relative flex flex-col justify-between ${
                isSelected 
                  ? 'bg-carbon border-ember/80 shadow-lg shadow-ember/10 ring-1 ring-ember/30' 
                  : 'bg-carbon/60 border-steel hover:border-steel/80'
              }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3 bg-streak/20 border border-streak/40 text-streak font-headline text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-streak" />
                  Active Program
                </div>
              )}

              <div>
                <span className="text-[10px] text-muted font-mono uppercase">
                  {prog.difficulty}
                </span>
                <h3 className="font-headline text-xl font-bold text-chalk uppercase mt-1 leading-snug">
                  {prog.title}
                </h3>
                <p className="text-xs text-muted mt-1 line-clamp-2">
                  {prog.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-steel/60 flex items-center justify-between text-xs font-mono text-muted">
                <span>{prog.duration_weeks} Weeks</span>
                <span>{prog.sessions_per_week}x / week</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Program Detailed Schedule */}
      {currentProgram && (
        <div className="bg-carbon border border-steel rounded-card p-5 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-steel/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline text-2xl font-black text-chalk uppercase">
                  {currentProgram.title}
                </h3>
                <span className="bg-steel/60 text-muted font-headline uppercase text-xs px-2 py-0.5 rounded">
                  {currentProgram.duration_weeks} Weeks
                </span>
              </div>
              <p className="text-xs text-muted mt-1 max-w-xl">
                {currentProgram.description}
              </p>
            </div>

            {/* Activate Button */}
            {activeUserProgram?.program_id !== currentProgram.id ? (
              <button
                onClick={() => handleSelectProgram(currentProgram.id)}
                className="min-h-[48px] px-6 bg-ember hover:bg-ember-hot text-white font-headline text-base font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-ember/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Activate Program</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 bg-streak/10 border border-streak/30 text-streak px-4 py-2 rounded-xl font-headline text-sm uppercase font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Currently Active (Week {activeUserProgram.current_week})</span>
              </div>
            )}
          </div>

          {/* Planned Days */}
          <div className="space-y-4">
            <h4 className="font-headline text-lg font-bold text-chalk uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold" />
              <span>Weekly Training Schedule</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currentProgram.schedule?.map((day, idx) => (
                <div 
                  key={day.day_id || idx}
                  className="bg-void border border-steel rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-headline text-base font-bold text-chalk uppercase">
                        {day.name}
                      </span>
                      <span className="text-[10px] text-muted font-mono">
                        {day.exercises?.length} Lifts
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {day.exercise_details?.map((ex, eIdx) => (
                        <div key={eIdx} className="flex items-center justify-between text-muted hover:text-chalk py-0.5">
                          <span className="truncate">{ex.name}</span>
                          <span className={`text-[9px] font-headline uppercase font-bold px-1.5 rounded ${
                            ex.stat_tag === 'STR' ? 'text-ember-hot' : ex.stat_tag === 'END' ? 'text-gold' : 'text-streak'
                          }`}>
                            {ex.stat_tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Start Workout for this plan */}
                  <button
                    onClick={() => onStartWorkout && onStartWorkout()}
                    className="w-full min-h-[44px] bg-carbon hover:bg-steel/60 border border-steel text-chalk font-headline text-sm font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-ember-hot text-ember-hot" />
                    <span>Train This Session (+25 XP)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
