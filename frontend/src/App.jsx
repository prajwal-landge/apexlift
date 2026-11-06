import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import RewardModal from './components/RewardModal';
import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import ProgressScreen from './screens/ProgressScreen';
import PlansScreen from './screens/PlansScreen';
import QuestsScreen from './screens/QuestsScreen';
import LeagueScreen from './screens/LeagueScreen';
import SettingsScreen from './screens/SettingsScreen';
import { api, getToken, setToken, getCurrentUser, setCurrentUser } from './api';

export default function App() {
  const [user, setUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  
  // Reward Modal
  const [rewardData, setRewardData] = useState(null);
  const [workoutInitialMini, setWorkoutInitialMini] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setDashboardData(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    if (getToken()) {
      fetchUserAndDashboard();
    }

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const fetchUserAndDashboard = async () => {
    setLoadingDashboard(true);
    setDashboardError('');
    try {
      const [userData, dashData] = await Promise.all([
        api.getMe(),
        api.getDashboard()
      ]);
      setUser(userData);
      setCurrentUser(userData);
      setDashboardData(dashData);
    } catch (err) {
      setDashboardError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setActiveTab('dashboard');
    fetchUserAndDashboard();
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setUser(null);
    setDashboardData(null);
    setActiveTab('dashboard');
  };

  const handleWorkoutLogged = (result) => {
    // Show reward animation modal
    setRewardData(result);
    // Refresh dashboard data
    fetchUserAndDashboard();
    setActiveTab('dashboard');
  };

  const handleCheckin = async (energyState) => {
    try {
      const res = await api.logCheckin(energyState);
      await fetchUserAndDashboard();
      if (res.xp_earned > 0) {
        setRewardData({
          xp_earned: res.xp_earned,
          raw_xp: res.xp_earned,
          breakdown: [{ label: `Daily Ready Check (${energyState})`, amount: res.xp_earned }],
          level_up: false,
          prs_achieved: []
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNavigate = (tab, options = {}) => {
    if (options.isMini) {
      setWorkoutInitialMini(true);
    } else {
      setWorkoutInitialMini(false);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user && !getToken()) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-void text-chalk flex flex-col font-sans selection:bg-ember selection:text-white">
      {/* Top Navigation */}
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={handleNavigate}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-4 sm:pt-6">
        {activeTab === 'dashboard' && (
          <DashboardScreen
            dashboardData={dashboardData}
            onNavigate={handleNavigate}
            onCheckin={handleCheckin}
            isLoading={loadingDashboard}
            error={dashboardError}
          />
        )}

        {activeTab === 'workout' && (
          <WorkoutScreen
            initialMini={workoutInitialMini}
            onWorkoutLogged={handleWorkoutLogged}
            onCancel={() => handleNavigate('dashboard')}
            userUnits={user?.units || 'kg'}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressScreen
            userUnits={user?.units || 'kg'}
          />
        )}

        {activeTab === 'plans' && (
          <PlansScreen
            onStartWorkout={() => handleNavigate('workout')}
          />
        )}

        {activeTab === 'quests' && (
          <QuestsScreen
            onRewardClaimed={() => fetchUserAndDashboard()}
          />
        )}

        {activeTab === 'league' && (
          <LeagueScreen />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            user={user}
            onUpdateUser={(updated) => {
              setUser(updated);
              setCurrentUser(updated);
              fetchUserAndDashboard();
            }}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={handleNavigate}
      />

      {/* Animated Reward Modal on XP Gain / Level Up */}
      {rewardData && (
        <RewardModal
          rewardData={rewardData}
          onClose={() => setRewardData(null)}
        />
      )}
    </div>
  );
}
