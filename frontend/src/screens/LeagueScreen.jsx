import React, { useState, useEffect } from 'react';
import { 
  Trophy, Users, UserPlus, ArrowUp, ArrowDown, Minus, 
  Flame, Shield, Clock, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { api } from '../api';

export default function LeagueScreen() {
  const [viewMode, setViewMode] = useState('league'); // 'league' or 'friends'
  const [selectedTier, setSelectedTier] = useState('Diamond');
  const [standings, setStandings] = useState(null);
  const [friendsList, setFriendsList] = useState([]);
  const [friendUsername, setFriendUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('');

  useEffect(() => {
    if (viewMode === 'league') {
      loadLeague();
    } else {
      loadFriends();
    }
  }, [viewMode, selectedTier]);

  const loadLeague = async () => {
    setLoading(true);
    try {
      const data = await api.getLeagueStandings(selectedTier);
      setStandings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    setLoading(true);
    try {
      const data = await api.getFriends();
      setFriendsList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!friendUsername.trim()) return;

    try {
      const res = await api.addFriend(friendUsername.trim());
      setFriendStatus(res.message);
      setFriendUsername('');
      await loadFriends();
      setTimeout(() => setFriendStatus(''), 3000);
    } catch (err) {
      setFriendStatus(err.message);
      setTimeout(() => setFriendStatus(''), 3000);
    }
  };

  const { all_tiers = [], participants = [], user_rank = 1, season_week = 3, days_remaining_in_week = 4 } = standings || {};

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-steel pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-gold font-bold">
            Weekly Consistency Competition
          </span>
          <h2 className="font-headline text-3xl font-extrabold text-chalk uppercase tracking-wide">
            Ranked Leagues
          </h2>
          <p className="text-muted text-xs font-sans mt-0.5">
            Ranked strictly by showing up (sessions + consistency XP). <strong className="text-chalk">No XP for weight lifted.</strong>
          </p>
        </div>

        {/* League / Friends View Switcher */}
        <div className="inline-flex p-1 bg-carbon border border-steel rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('league')}
            className={`px-4 py-1.5 rounded-lg font-headline text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              viewMode === 'league'
                ? 'bg-ember text-white shadow-md'
                : 'text-muted hover:text-chalk'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Tier Standings</span>
          </button>

          <button
            onClick={() => setViewMode('friends')}
            className={`px-4 py-1.5 rounded-lg font-headline text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              viewMode === 'friends'
                ? 'bg-ember text-white shadow-md'
                : 'text-muted hover:text-chalk'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends Only</span>
          </button>
        </div>
      </div>

      {viewMode === 'league' ? (
        <>
          {/* Tier Selector Bar: Bronze, Silver, Gold, Platinum, Diamond, Apex */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(all_tiers.length > 0 ? all_tiers : ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Apex"]).map((tier) => {
              const isSelected = selectedTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`py-2 px-1 text-center rounded-xl border font-headline text-xs font-bold uppercase tracking-wider transition-all ${
                    isSelected
                      ? 'bg-carbon border-gold text-gold shadow-md shadow-gold/10'
                      : 'bg-carbon/50 border-steel text-muted hover:text-chalk'
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>

          {/* Season Status Strip */}
          <div className="bg-carbon border border-steel rounded-card p-3.5 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-muted">
              <Clock className="w-4 h-4 text-gold" />
              <span>Season Week: <strong className="text-chalk">{season_week} / 4</strong></span>
            </div>
            <span className="text-muted">
              Week closes in: <strong className="text-streak">{days_remaining_in_week} days</strong>
            </span>
          </div>

          {/* Leaderboard Table Card */}
          <div className="bg-carbon border border-steel rounded-card overflow-hidden shadow-xl">
            <div className="p-4 border-b border-steel/60 flex items-center justify-between text-xs text-muted font-mono uppercase">
              <span>Rank & Athlete</span>
              <div className="flex items-center gap-6">
                <span className="hidden sm:inline">Streak</span>
                <span className="hidden sm:inline">Sessions</span>
                <span>Consistency Score</span>
              </div>
            </div>

            <div className="divide-y divide-steel/50">
              {participants.map((p, idx) => {
                const isPromoted = p.status === 'promotion';
                const isDemoted = p.status === 'demotion';

                return (
                  <div
                    key={p.user_id}
                    className={`p-3.5 flex items-center justify-between transition-colors relative ${
                      p.is_current_user 
                        ? 'bg-ember/10 font-bold border-l-4 border-l-ember' 
                        : 'hover:bg-void/60'
                    }`}
                  >
                    {/* Rank, Status & Athlete Info */}
                    <div className="flex items-center gap-3">
                      <div className="w-7 text-center font-headline text-lg font-black text-chalk">
                        #{p.rank}
                      </div>

                      {/* Promotion / Demotion Icon Indicator */}
                      <div className="w-5 flex items-center justify-center">
                        {isPromoted && <ArrowUp className="w-4 h-4 text-streak" title="Promotion Zone (Top 3)" />}
                        {isDemoted && <ArrowDown className="w-4 h-4 text-ember-hot" title="Demotion Zone (Bottom 3)" />}
                        {!isPromoted && !isDemoted && <Minus className="w-3.5 h-3.5 text-muted" />}
                      </div>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-void border border-steel overflow-hidden flex-shrink-0">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-headline text-sm font-bold text-muted">
                            {p.full_name?.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-headline text-base uppercase leading-tight ${
                            p.is_current_user ? 'text-ember-hot' : 'text-chalk'
                          }`}>
                            {p.full_name}
                          </span>
                          {p.is_current_user && (
                            <span className="bg-ember text-white font-headline text-[9px] uppercase px-1.5 py-0.2 rounded font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-muted">
                          @{p.username} • {p.class_title}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-right">
                      <div className="hidden sm:block text-xs font-mono text-streak">
                        {p.weekly_streak}w streak
                      </div>
                      <div className="hidden sm:block text-xs font-mono text-chalk">
                        {p.sessions_count} sessions
                      </div>
                      <div>
                        <span className="font-headline text-lg font-bold text-gold tracking-wide">
                          {p.consistency_score.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted block font-mono">pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted font-sans px-2">
            <span className="flex items-center gap-1.5">
              <ArrowUp className="w-3.5 h-3.5 text-streak" /> Top 3 advance to higher tier weekly
            </span>
            <span className="flex items-center gap-1.5">
              <ArrowDown className="w-3.5 h-3.5 text-ember-hot" /> Bottom 3 re-bracket down
            </span>
          </div>
        </>
      ) : (
        /* Friends View */
        <div className="space-y-6">
          {/* Add Friend Form */}
          <form onSubmit={handleAddFriend} className="bg-carbon border border-steel rounded-card p-4 flex gap-2">
            <input
              type="text"
              placeholder="Add friend by username (e.g. elena_r)..."
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              className="flex-1 bg-void border border-steel rounded-xl px-4 py-2 text-xs text-chalk focus:outline-none focus:border-ember"
            />
            <button
              type="submit"
              className="min-h-[44px] px-5 bg-ember hover:bg-ember-hot text-white font-headline text-sm font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Friend</span>
            </button>
          </form>

          {friendStatus && (
            <div className="bg-void border border-steel text-chalk p-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-streak flex-shrink-0" />
              <span>{friendStatus}</span>
            </div>
          )}

          {/* Friends Leaderboard */}
          <div className="bg-carbon border border-steel rounded-card overflow-hidden shadow-xl">
            <div className="p-4 border-b border-steel/60 text-xs text-muted font-mono uppercase">
              Friends Consistency Circle
            </div>

            <div className="divide-y divide-steel/50">
              {friendsList.map((f) => (
                <div 
                  key={f.user_id}
                  className={`p-3.5 flex items-center justify-between ${
                    f.is_current_user ? 'bg-ember/10 font-bold border-l-4 border-l-ember' : 'hover:bg-void/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 text-center font-headline text-lg font-black text-chalk">
                      #{f.rank}
                    </div>

                    <div className="w-9 h-9 rounded-full bg-void border border-steel overflow-hidden flex-shrink-0">
                      {f.avatar_url ? (
                        <img src={f.avatar_url} alt={f.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-headline text-sm font-bold text-muted">
                          {f.full_name?.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 className="font-headline text-base text-chalk uppercase leading-tight">
                        {f.full_name} {f.is_current_user && '(YOU)'}
                      </h5>
                      <span className="text-[11px] text-muted">
                        @{f.username} • {f.class_title}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-headline text-lg font-bold text-gold">
                      {f.consistency_score.toLocaleString()} pts
                    </span>
                    <span className="text-[10px] text-streak block font-mono">
                      {f.weekly_streak}w streak
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
