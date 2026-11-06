import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Trash2, Dumbbell, Zap, Flame, 
  CheckCircle, AlertCircle, ArrowLeft, Clock, Info
} from 'lucide-react';
import { api } from '../api';

export default function WorkoutScreen({ 
  initialMini = false, 
  onWorkoutLogged,
  onCancel,
  userUnits = 'kg' 
}) {
  const [exercises, setExercises] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStat, setSelectedStat] = useState('All');
  const [isMiniSession, setIsMiniSession] = useState(initialMini);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [energyState, setEnergyState] = useState('Energized');
  const [notes, setNotes] = useState('');
  
  // Sets in current session: { exercise_id, exercise_name, set_number, reps, weight_kg, rpe, stat_tag }
  const [loggedSets, setLoggedSets] = useState([]);
  
  // Exercise selector modal state
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadExercises();
  }, [selectedStat]);

  const loadExercises = async () => {
    try {
      const data = await api.getExercises({ stat_tag: selectedStat });
      setExercises(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExercise = (exercise) => {
    const nextSetNumber = loggedSets.filter(s => s.exercise_id === exercise.id).length + 1;
    setLoggedSets([
      ...loggedSets,
      {
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        set_number: nextSetNumber,
        reps: 10,
        weight_kg: 50.0,
        rpe: 8,
        stat_tag: exercise.stat_tag
      }
    ]);
    setShowExercisePicker(false);
  };

  const handleDuplicateSet = (index) => {
    const target = loggedSets[index];
    const matchingSets = loggedSets.filter(s => s.exercise_id === target.exercise_id);
    const newSet = {
      ...target,
      set_number: matchingSets.length + 1
    };
    const updated = [...loggedSets];
    updated.splice(index + 1, 0, newSet);
    setLoggedSets(updated);
  };

  const handleRemoveSet = (index) => {
    const updated = loggedSets.filter((_, i) => i !== index);
    setLoggedSets(updated);
  };

  const handleUpdateSet = (index, field, value) => {
    const updated = [...loggedSets];
    updated[index][field] = value;
    setLoggedSets(updated);
  };

  const handleSaveWorkout = async () => {
    if (loggedSets.length === 0) {
      setErrorMessage("Please add at least 1 set. Even a mini session counts!");
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        duration_minutes: isMiniSession ? 15 : parseInt(durationMinutes, 10),
        is_mini_session: isMiniSession,
        is_planned_session: true,
        energy_state: energyState,
        notes: notes.trim(),
        sets: loggedSets.map(s => ({
          exercise_id: s.exercise_id,
          exercise_name: s.exercise_name,
          set_number: s.set_number,
          reps: parseInt(s.reps, 10) || 1,
          weight_kg: parseFloat(s.weight_kg) || 0.0,
          rpe: parseFloat(s.rpe) || null
        }))
      };

      const result = await api.logWorkout(payload);
      if (onWorkoutLogged) {
        onWorkoutLogged(result);
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to log workout");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExercises = exercises.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-2xl mx-auto">
      {/* Header & Back */}
      <div className="flex items-center justify-between border-b border-steel pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-ember-hot font-bold">
            ApexLift Protocol
          </span>
          <h2 className="font-headline text-3xl font-extrabold text-chalk uppercase tracking-wide">
            {isMiniSession ? "Log Mini Session" : "Log Workout Session"}
          </h2>
        </div>

        {/* Mini Session Toggle */}
        <button
          onClick={() => setIsMiniSession(!isMiniSession)}
          className={`px-3 py-1.5 rounded-xl font-headline text-xs font-bold uppercase tracking-wider transition-all border ${
            isMiniSession
              ? 'bg-ember text-white border-ember shadow-md shadow-ember/25'
              : 'bg-carbon text-muted border-steel hover:text-chalk'
          }`}
        >
          {isMiniSession ? "Mini Session: ON" : "Normal Mode"}
        </button>
      </div>

      {/* Mini Session Alert Callout */}
      {isMiniSession && (
        <div className="bg-carbon border border-steel/80 rounded-card p-4 flex items-start gap-3 text-xs">
          <Info className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-headline text-sm font-bold text-chalk uppercase tracking-wide">
              Mini Session Active (+40 Base XP)
            </h4>
            <p className="text-muted text-xs leading-relaxed">
              Low motivation day? Complete just 1 set. In ApexLift, showing up is 100% of the victory. Protect the streak.
            </p>
          </div>
        </div>
      )}

      {/* Session Metadata Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Duration */}
        <div className="bg-carbon border border-steel rounded-card p-3.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1">
            Duration (Minutes)
          </label>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted" />
            <input
              type="number"
              min="1"
              max="240"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="bg-void border border-steel rounded-lg px-3 py-1.5 text-chalk font-headline font-bold text-lg w-full focus:outline-none focus:border-ember"
            />
          </div>
        </div>

        {/* Energy State */}
        <div className="bg-carbon border border-steel rounded-card p-3.5">
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1">
            Energy Level
          </label>
          <select
            value={energyState}
            onChange={(e) => setEnergyState(e.target.value)}
            className="bg-void border border-steel rounded-lg px-3 py-2 text-chalk font-headline font-bold text-base w-full focus:outline-none focus:border-ember"
          >
            <option value="Energized">Energized (Full Charge)</option>
            <option value="Okay">Okay (Standard)</option>
            <option value="Low energy">Low Energy (1.5x Grit Mult!)</option>
          </select>
        </div>
      </div>

      {/* Error Message banner */}
      {errorMessage && (
        <div className="bg-ember/15 border border-ember text-chalk p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-ember-hot flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sets Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold text-chalk uppercase tracking-wide">
            Logged Exercises & Sets
          </h3>
          <span className="text-xs text-muted font-mono">{loggedSets.length} Sets Total</span>
        </div>

        {loggedSets.length === 0 ? (
          <div className="bg-carbon border border-dashed border-steel rounded-card p-8 text-center space-y-3">
            <Dumbbell className="w-10 h-10 text-muted mx-auto" />
            <p className="text-muted text-xs font-sans">
              No exercises added yet. Tap below to select an exercise from the database.
            </p>
            <button
              onClick={() => setShowExercisePicker(true)}
              className="min-h-[48px] px-6 bg-ember hover:bg-ember-hot text-white font-headline text-base font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-ember/20 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Choose Exercise</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {loggedSets.map((set, idx) => (
              <div 
                key={idx}
                className="bg-carbon border border-steel rounded-card p-3.5 space-y-2 relative"
              >
                <div className="flex items-center justify-between border-b border-steel/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-base font-bold text-chalk uppercase">
                      {set.exercise_name}
                    </span>
                    <span className={`text-[9px] font-headline font-bold uppercase px-1.5 py-0.5 rounded ${
                      set.stat_tag === 'STR' ? 'bg-ember/20 text-ember-hot border border-ember/30' :
                      set.stat_tag === 'END' ? 'bg-gold/20 text-gold border border-gold/30' :
                      'bg-streak/20 text-streak border border-streak/30'
                    }`}>
                      {set.stat_tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDuplicateSet(idx)}
                      className="text-xs text-muted hover:text-chalk font-headline uppercase font-bold px-2 py-1 bg-void border border-steel rounded-md"
                      title="Duplicate set"
                    >
                      + Set
                    </button>
                    <button
                      onClick={() => handleRemoveSet(idx)}
                      className="text-muted hover:text-ember-hot p-1"
                      title="Remove set"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inputs: Set #, Reps, Weight, RPE */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-xs">
                  <div>
                    <label className="text-[10px] text-muted block mb-1">Set</label>
                    <div className="font-headline font-bold text-chalk text-base py-1 px-2 bg-void border border-steel rounded-lg text-center">
                      #{set.set_number}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-1">Reps</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={set.reps}
                      onChange={(e) => handleUpdateSet(idx, 'reps', e.target.value)}
                      className="w-full bg-void border border-steel rounded-lg px-2 py-1 text-chalk font-headline font-bold text-base text-center focus:outline-none focus:border-ember"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-1">Weight ({userUnits})</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="500"
                      value={set.weight_kg}
                      onChange={(e) => handleUpdateSet(idx, 'weight_kg', e.target.value)}
                      className="w-full bg-void border border-steel rounded-lg px-2 py-1 text-gold font-headline font-bold text-base text-center focus:outline-none focus:border-gold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-muted block mb-1">RPE (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      value={set.rpe}
                      onChange={(e) => handleUpdateSet(idx, 'rpe', e.target.value)}
                      className="w-full bg-void border border-steel rounded-lg px-2 py-1 text-chalk font-headline font-bold text-base text-center focus:outline-none focus:border-ember"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add Another Exercise Button */}
            <button
              onClick={() => setShowExercisePicker(true)}
              className="w-full min-h-[44px] bg-void border border-steel hover:border-steel/80 text-chalk font-headline text-sm font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4 text-ember-hot" />
              <span>Add Another Exercise</span>
            </button>
          </div>
        )}
      </div>

      {/* Session Notes */}
      <div className="bg-carbon border border-steel rounded-card p-4">
        <label className="text-[10px] font-mono uppercase tracking-widest text-muted block mb-1.5">
          Workout Notes (Optional)
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Clean bar path, felt locked in..."
          className="w-full bg-void border border-steel rounded-xl p-3 text-xs text-chalk focus:outline-none focus:border-ember resize-none"
        />
      </div>

      {/* Primary Submit Button (Min 48px) */}
      <div className="pt-2">
        <button
          disabled={submitting}
          onClick={handleSaveWorkout}
          className="w-full min-h-[48px] bg-ember hover:bg-ember-hot disabled:opacity-50 text-white font-headline text-xl font-bold uppercase tracking-wider rounded-xl shadow-xl shadow-ember/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {submitting ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-5 h-5 fill-white" />
              <span>Complete Session & Claim XP</span>
            </>
          )}
        </button>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-carbon border border-steel rounded-card max-w-lg w-full max-h-[80vh] flex flex-col p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-steel">
              <h3 className="font-headline text-2xl font-bold text-chalk uppercase tracking-wide">
                Select Exercise
              </h3>
              <button
                onClick={() => setShowExercisePicker(false)}
                className="text-muted hover:text-chalk p-1 font-headline uppercase text-sm font-bold"
              >
                Cancel
              </button>
            </div>

            {/* Search Input */}
            <div className="relative my-3">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search 40+ exercises..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-void border border-steel rounded-xl pl-9 pr-3 py-2 text-xs text-chalk focus:outline-none focus:border-ember"
              />
            </div>

            {/* Stat Filter Pills: All, STR, END, AGI */}
            <div className="flex items-center gap-2 pb-3 overflow-x-auto">
              {['All', 'STR', 'END', 'AGI'].map((stat) => (
                <button
                  key={stat}
                  onClick={() => setSelectedStat(stat)}
                  className={`px-3 py-1 rounded-lg font-headline text-xs font-bold uppercase tracking-wide transition-colors ${
                    selectedStat === stat
                      ? 'bg-ember text-white'
                      : 'bg-void text-muted border border-steel hover:text-chalk'
                  }`}
                >
                  {stat === 'All' ? 'All Stats' : stat}
                </button>
              ))}
            </div>

            {/* Exercise List */}
            <div className="overflow-y-auto flex-1 divide-y divide-steel/50 pr-1 space-y-1">
              {filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleAddExercise(ex)}
                  className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-void/80 flex items-center justify-between transition-colors group"
                >
                  <div>
                    <h5 className="font-headline text-base font-bold text-chalk uppercase group-hover:text-ember-hot transition-colors">
                      {ex.name}
                    </h5>
                    <p className="text-[11px] text-muted">
                      {ex.category} • {ex.equipment}
                    </p>
                  </div>

                  <span className={`text-[10px] font-headline font-bold uppercase px-2 py-0.5 rounded ${
                    ex.stat_tag === 'STR' ? 'bg-ember/20 text-ember-hot' :
                    ex.stat_tag === 'END' ? 'bg-gold/20 text-gold' :
                    'bg-streak/20 text-streak'
                  }`}>
                    {ex.stat_tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
