import React, { useState, useEffect } from 'react';
import { ChamaGroup, User, GroupSlot } from '../types.ts';
import { api } from '../api.ts';
import {
  Users,
  Shield,
  ArrowLeft,
  Calendar,
  Send,
  Coins,
  AlertTriangle,
  UserPlus,
  CheckCircle,
  Clock,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';

interface GroupDetailPageProps {
  groupId: number;
  currentUser: User | null;
  onNavigate: (view: string, arg?: any) => void;
  onOpenAuth: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const GroupDetailPage: React.FC<GroupDetailPageProps> = ({
  groupId,
  currentUser,
  onNavigate,
  onOpenAuth,
  onNotify,
}) => {
  const [group, setGroup] = useState<ChamaGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment form state
  const [mpesaCode, setMpesaCode] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Chat message state
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Moderator actions modal state
  const [selectedSlotForAction, setSelectedSlotForAction] = useState<GroupSlot | null>(null);
  const [actionType, setActionType] = useState<'moderator' | 'default' | null>(null);
  const [defaultReason, setDefaultReason] = useState('Missed scheduled Chama contribution');
  const [submittingModAction, setSubmittingModAction] = useState(false);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  async function loadGroup() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGroup(groupId);
      setGroup(data.group);
      if (data.group && !paymentAmount) {
        setPaymentAmount(data.group.dailyAmount);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load group details.');
    } finally {
      setLoading(false);
    }
  }

  // Find user's slot in this group
  const mySlot = currentUser && group
    ? group.slots.find(s => s.userId === currentUser.id && s.status === 'active')
    : null;

  // Check if current user is moderator
  const isModerator = currentUser && group
    ? group.moderators?.includes(currentUser.id) || group.adminId === currentUser.id || currentUser.role === 'admin'
    : false;

  // Post payment code
  async function handlePostPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !mySlot || !group) return;

    if (!mpesaCode.trim()) {
      onNotify('error', 'Please enter your M-Pesa transaction code.');
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await api.postPayment({
        type: 'group_installment',
        code: mpesaCode.trim().toUpperCase(),
        amount: Number(paymentAmount),
        groupId: group.id,
        slotNumber: mySlot.slotNumber,
        productId: group.productId,
      });

      onNotify('success', res.message);
      setMpesaCode('');
      loadGroup();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to submit payment code');
    } finally {
      setSubmittingPayment(false);
    }
  }

  // Send chat message
  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !group) return;
    if (!chatInput.trim()) return;

    setSendingChat(true);
    try {
      const res = await api.sendGroupChat(group.id, { text: chatInput.trim() });
      setGroup(res.group);
      setChatInput('');
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to send message');
    } finally {
      setSendingChat(false);
    }
  }

  // Tip peer with coins
  async function handleTipCoins(targetUserId: number) {
    if (!currentUser || !group) return;
    if ((currentUser.coins || 0) < 5) {
      onNotify('error', 'You need at least 5 coins to applaud. Top up in your Wallet.');
      return;
    }

    try {
      const res = await api.sendGroupChat(group.id, {
        kind: 'reward',
        targetUserId,
        coinAmount: 5,
      });
      setGroup(res.group);
      onNotify('success', res.message || 'Applauded with 5 coins!');
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to send coins');
    }
  }

  // Handle Moderator Appoint Co-moderator
  async function handleAppointModerator(targetUserId: number) {
    if (!group) return;
    setSubmittingModAction(true);
    try {
      const res = await api.manageModerator(group.id, targetUserId, 'appoint');
      setGroup(res.group);
      onNotify('success', res.message);
      setActionType(null);
      setSelectedSlotForAction(null);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to appoint moderator');
    } finally {
      setSubmittingModAction(false);
    }
  }

  // Handle Moderator Record Default (Part 5)
  async function handleRecordDefault() {
    if (!group || !selectedSlotForAction) return;
    setSubmittingModAction(true);
    try {
      const res = await api.markDefault(group.id, selectedSlotForAction.slotNumber, defaultReason);
      setGroup(res.group);
      onNotify('success', res.message);
      setActionType(null);
      setSelectedSlotForAction(null);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to record default');
    } finally {
      setSubmittingModAction(false);
    }
  }

  // Quick Join into an open or replacement-eligible slot
  async function handleDirectJoin(slot: GroupSlot) {
    if (!currentUser) {
      onNotify('info', 'Please sign in to join this Chama slot.');
      onOpenAuth();
      return;
    }
    try {
      const res = await api.joinGroup(group!.id, slot.inviteCode || group!.inviteCode);
      onNotify('success', res.message);
      loadGroup();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to claim slot');
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-[#0E5A3C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Loading Chama details...</p>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-4 text-sm">{error || 'Chama not found'}</div>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg"
        >
          Return to Announcements
        </button>
      </div>
    );
  }

  const occupiedSlots = group.slots.filter(s => s.status === 'active').length;
  const availableSlots = group.size - occupiedSlots;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back button */}
      <button
        onClick={() => onNavigate('product', group.productId)}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Product Details</span>
      </button>

      {/* Chama Hero Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full uppercase tracking-wider">
                {group.status === 'active' ? 'Active Group' : group.status}
              </span>
              <span className="text-xs text-slate-500">
                {group.size}-Member Rotation · Every {group.cycleDays} Days
              </span>
              {isModerator && (
                <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>You are a Moderator</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {group.name}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Saving for: <b className="text-slate-900">{group.productTitle}</b> (KSh {group.productPrice.toLocaleString()})
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                Daily Contribution
              </div>
              <div className="text-2xl font-black text-[#0E5A3C] tabular-nums">
                KSh {group.dailyAmount.toLocaleString()}
                <span className="text-xs font-normal text-slate-500"> / day</span>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                Slot Capacity
              </div>
              <div className="text-sm font-bold text-slate-900">
                {occupiedSlots} / {group.size} Joined
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold">
                {availableSlots} available
              </div>
            </div>
          </div>
        </div>

        {/* Start Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <p className="flex items-center gap-1.5 text-emerald-800 font-medium">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Your group starts as soon as the first member joins. Other members can join while the group is active.
            </span>
          </p>
          <div className="font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-700">
            Invite Code: <b className="text-slate-900">{group.inviteCode}</b>
          </div>
        </div>
      </div>

      {/* Main Grid: Slots on Left (60%), Sidebar & Chat on Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Slots Grid (~65%) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Member Slots & Allocation Rotation</span>
                <span className="text-xs font-normal text-slate-500">({group.size} total)</span>
              </h2>
              <span className="text-xs text-slate-500">
                1 item delivered every {group.cycleDays} days
              </span>
            </div>

            {/* Slots List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {group.slots.map((slot) => {
                const isMe = currentUser && slot.userId === currentUser.id;
                const isModSlot = slot.userId && group.moderators.includes(slot.userId);
                const isReplacement = slot.status === 'replacement_eligible';
                const isOpen = slot.status === 'open';
                const isActive = slot.status === 'active';
                const deliveryDay = slot.slotNumber * group.cycleDays;
                const percentPaid = Math.min(100, Math.round(((slot.paidAmount || 0) / group.productPrice) * 100));

                return (
                  <div
                    key={slot.slotNumber}
                    className={`relative p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      isMe
                        ? 'border-[#0E5A3C] bg-emerald-50/30'
                        : isReplacement
                        ? 'border-amber-400 bg-amber-50/40'
                        : isActive
                        ? 'border-slate-200 bg-white'
                        : 'border-dashed border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      {/* Top Header of Slot */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs ${
                              isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            #{slot.slotNumber}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              {isActive ? slot.userName : isReplacement ? 'Vacated Slot (Open)' : 'Open Slot'}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Receives item on <b>Day {deliveryDay}</b>
                            </span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1">
                          {isModSlot && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded">
                              Moderator
                            </span>
                          )}
                          {isMe && (
                            <span className="text-[10px] bg-[#0E5A3C] text-white font-bold px-1.5 py-0.5 rounded">
                              You
                            </span>
                          )}
                          {isReplacement && (
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                              Replacement Pool
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Payment Progress for Active Members */}
                      {isActive && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>Paid: KSh {(slot.paidAmount || 0).toLocaleString()}</span>
                            <span className="font-semibold text-slate-900">{percentPaid}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#0E5A3C] rounded-full transition-all"
                              style={{ width: `${percentPaid}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Slot Actions / Status Footer */}
                    <div className="mt-3 pt-2 flex items-center justify-between gap-2">
                      {isActive ? (
                        <div className="flex items-center gap-2 w-full justify-between">
                          <span className="text-[11px] text-slate-400 font-mono">
                            Code: {slot.inviteCode}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Applaud / Reward coin button */}
                            {currentUser && slot.userId !== currentUser.id && (
                              <button
                                onClick={() => handleTipCoins(slot.userId!)}
                                title="Applaud with 5 coins"
                                className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-semibold rounded transition-colors"
                              >
                                <Coins className="w-3 h-3" />
                                <span>+5</span>
                              </button>
                            )}

                            {/* Moderator Slot Management Menu */}
                            {isModerator && slot.userId !== currentUser?.id && (
                              <button
                                onClick={() => {
                                  setSelectedSlotForAction(slot);
                                  setActionType('default');
                                }}
                                title="Moderator Options"
                                className="px-2 py-1 text-[11px] text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded"
                              >
                                Manage
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full">
                          <button
                            onClick={() => handleDirectJoin(slot)}
                            className="w-full py-1.5 bg-[#FF6A00] hover:bg-[#e85f00] text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            {isReplacement ? 'Claim Replacement Slot' : 'Join as Member #' + slot.slotNumber}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Payment Panel & Group Chat (~35%) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Member Payment Box */}
          {mySlot ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Your Member #{mySlot.slotNumber} Payment
                </h3>
                <span className="text-xs text-[#0E5A3C] font-bold">
                  Day {mySlot.slotNumber * group.cycleDays} Rotation
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl mb-4 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Target Amount:</span>
                  <b className="text-slate-900">KSh {group.productPrice.toLocaleString()}</b>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid So Far:</span>
                  <b className="text-emerald-700">KSh {(mySlot.paidAmount || 0).toLocaleString()}</b>
                </div>
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <b className="text-slate-900">
                    KSh {Math.max(0, group.productPrice - (mySlot.paidAmount || 0)).toLocaleString()}
                  </b>
                </div>
              </div>

              <form onSubmit={handlePostPayment} className="space-y-3">
                <div className="p-2.5 bg-amber-50 text-amber-900 rounded-lg text-xs">
                  Pay only to ChaMall Till <b>000000</b> (Buy Goods). Never pay members directly.
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    M-Pesa Transaction Code
                  </label>
                  <input
                    type="text"
                    required
                    value={mpesaCode}
                    onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    placeholder="e.g. QJK4X8L2PA"
                    className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E5A3C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Amount Paid (KSh)
                  </label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E5A3C]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="w-full py-2.5 bg-[#FF6A00] hover:bg-[#e85f00] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  {submittingPayment ? 'Submitting Payment Code...' : 'Post M-Pesa Code for Approval'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-xs">
              <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">Join this Chama to Contribute</h3>
              <p className="text-xs text-slate-500 mb-4">
                Choose an open slot from the list to join and receive this product on your rotation day.
              </p>
              {group.availableCount > 0 ? (
                <button
                  onClick={() => {
                    const firstOpen = group.slots.find(s => s.status === 'replacement_eligible' || s.status === 'open');
                    if (firstOpen) handleDirectJoin(firstOpen);
                  }}
                  className="w-full py-2.5 bg-[#FF6A00] text-white text-xs font-bold rounded-lg"
                >
                  Join Next Available Slot
                </button>
              ) : (
                <p className="text-xs text-amber-700 font-semibold">Group is currently full.</p>
              )}
            </div>
          )}

          {/* Group Chat & Rewards Activity */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-900">Chama Chat & Peer Rewards</h3>
              <span className="text-[11px] text-slate-400">Your coins: {currentUser?.coins || 0}</span>
            </div>

            {/* Message Thread */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
              {group.chat && group.chat.length > 0 ? (
                group.chat.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-xl ${
                      m.kind === 'system'
                        ? 'bg-slate-100 text-slate-600'
                        : m.kind === 'reward'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200 font-medium'
                        : 'bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <b className="text-slate-900">{m.senderName}</b>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="leading-snug">{m.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">No messages yet. Say hello!</p>
              )}
            </div>

            {/* Chat Input */}
            {currentUser ? (
              <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Post message or update..."
                  className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E5A3C]"
                />
                <button
                  type="submit"
                  disabled={sendingChat || !chatInput.trim()}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-400 text-center pt-3 border-t border-slate-100">
                Sign in to participate in group chat.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MODERATOR ACTIONS MODAL */}
      {selectedSlotForAction && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Moderator Controls · Slot #{selectedSlotForAction.slotNumber} ({selectedSlotForAction.userName})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              As an authorized moderator, manage group roles or record defaulted contributions.
            </p>

            <div className="flex gap-2 mb-4 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActionType('moderator')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
                  actionType === 'moderator' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Appoint Co-Moderator
              </button>
              <button
                onClick={() => setActionType('default')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
                  actionType === 'default' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Record Member Default
              </button>
            </div>

            {actionType === 'moderator' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600">
                  Appoint <b>{selectedSlotForAction.userName}</b> as an additional moderator with permissions to review member activity and manage group slots.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setSelectedSlotForAction(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAppointModerator(selectedSlotForAction.userId!)}
                    disabled={submittingModAction}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                  >
                    {submittingModAction ? 'Appointing...' : 'Confirm Moderator Appointment'}
                  </button>
                </div>
              </div>
            )}

            {actionType === 'default' && (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs space-y-1">
                  <p className="font-bold">Part 5 Default Policy:</p>
                  <p>1. Slot #{selectedSlotForAction.slotNumber} will be returned to the referral pool for replacement.</p>
                  <p>2. {selectedSlotForAction.userName}'s paid history of KSh {(selectedSlotForAction.paidAmount || 0).toLocaleString()} will be preserved.</p>
                  <p>3. The member will receive options for a cash refund, store credit, or order transfer.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Reason for Default
                  </label>
                  <input
                    type="text"
                    value={defaultReason}
                    onChange={(e) => setDefaultReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setSelectedSlotForAction(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRecordDefault}
                    disabled={submittingModAction}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700"
                  >
                    {submittingModAction ? 'Recording...' : 'Confirm Default & Release Slot'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
