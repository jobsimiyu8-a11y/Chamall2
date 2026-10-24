import React, { useState, useEffect } from 'react';
import { User, ChamaGroup } from '../types.ts';
import { api } from '../api.ts';
import { Users, ArrowRight, ShieldCheck, Clock, CheckCircle } from 'lucide-react';

interface MyChamasPageProps {
  currentUser: User | null;
  onNavigate: (view: string, arg?: any) => void;
  onOpenAuth: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const MyChamasPage: React.FC<MyChamasPageProps> = ({
  currentUser,
  onNavigate,
  onOpenAuth,
  onNotify,
}) => {
  const [groups, setGroups] = useState<ChamaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickJoinCode, setQuickJoinCode] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  useEffect(() => {
    loadMyGroups();
  }, [currentUser]);

  async function loadMyGroups() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await api.getGroups();
      const my = res.groups.filter(g =>
        g.slots.some(s => s.userId === currentUser.id && s.status === 'active')
      );
      setGroups(my);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load your Chamas');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const code = quickJoinCode.trim().toUpperCase();
    if (!code) return;

    setSubmittingJoin(true);
    try {
      // Find group matching code
      const allGroups = await api.getGroups();
      const match = allGroups.groups.find(
        g => g.inviteCode === code || g.slots.some(s => s.inviteCode === code)
      );

      if (!match) {
        onNotify('error', 'That Chama code is not valid.');
        setSubmittingJoin(false);
        return;
      }

      const res = await api.joinGroup(match.id, code);
      onNotify('success', res.message);
      setQuickJoinCode('');
      onNavigate('group', match.id);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to join Chama');
    } finally {
      setSubmittingJoin(false);
    }
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Sign in to View Your Chamas</h2>
        <p className="text-xs text-slate-500 mb-4">
          Track your active slots, delivery cycles, and contribution histories.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 bg-[#0E5A3C] text-white text-xs font-bold rounded-xl"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Chama Groups
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store Credit: <b>KSh {currentUser.credit.toLocaleString()}</b> · Points: <b>{currentUser.points}</b>
          </p>
        </div>

        {/* Quick Join With Member Code Box */}
        <form onSubmit={handleQuickJoin} className="flex gap-2 max-w-sm w-full">
          <input
            type="text"
            value={quickJoinCode}
            onChange={(e) => setQuickJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter Chama Code (e.g. SOLAR9X1)"
            className="flex-1 px-3 py-2 text-xs uppercase font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E5A3C] bg-white"
          />
          <button
            type="submit"
            disabled={submittingJoin || !quickJoinCode.trim()}
            className="px-4 py-2 bg-[#FF6A00] hover:bg-[#e85f00] text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            {submittingJoin ? 'Joining...' : 'Join Chama'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading your groups...</div>
      ) : groups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">
            You have not joined a Chama yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Browse our verified product announcements, choose your preferred speed, and start saving with friends today.
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="px-5 py-2.5 bg-[#0E5A3C] hover:bg-[#0b4830] text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((g) => {
            const slot = g.slots.find(s => s.userId === currentUser.id);
            const deliveryDay = slot ? slot.slotNumber * g.cycleDays : 0;
            const paid = slot?.paidAmount || 0;
            const target = g.productPrice;
            const progress = Math.min(100, Math.round((paid / target) * 100));
            const isMod = g.moderators.includes(currentUser.id) || g.adminId === currentUser.id;

            return (
              <div
                key={g.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                      Member #{slot?.slotNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Day {deliveryDay} Delivery
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{g.name}</h3>
                  <div className="text-xs text-slate-500 mb-4">{g.productTitle}</div>

                  {/* Progress */}
                  <div className="p-3.5 bg-slate-50 rounded-xl mb-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Contribution Progress:</span>
                      <b className="text-slate-900">{progress}%</b>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0E5A3C] rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                      <span>Paid: KSh {paid.toLocaleString()}</span>
                      <span>Target: KSh {target.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 mb-4">
                    <div>
                      Daily rate: <b className="text-slate-900">KSh {g.dailyAmount.toLocaleString()} / day</b>
                    </div>
                    <div>
                      Your invite code: <b className="font-mono text-indigo-700">{slot?.inviteCode}</b>
                    </div>
                    {isMod && (
                      <div className="text-[11px] text-emerald-800 font-semibold">
                        You have Group Moderator privileges
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('group', g.id)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-[#FF6A00] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Open Chama Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
