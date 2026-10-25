import React, { useState, useEffect } from 'react';
import { ChamaGroup, User, GroupSlot, Product, PeerLoanRequest, MemberStatement } from '../types.ts';
import { api, resolveImageUrl } from '../api.ts';
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
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  RefreshCw,
  Store,
  ArrowRight,
  FileText,
  HandCoins,
  X,
  Printer,
  Wallet,
  Check,
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
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loans, setLoans] = useState<PeerLoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment form state
  const [mpesaCode, setMpesaCode] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [payingFromWallet, setPayingFromWallet] = useState(false);

  // Chat message state
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Moderator actions modal state
  const [selectedSlotForAction, setSelectedSlotForAction] = useState<GroupSlot | null>(null);
  const [actionType, setActionType] = useState<'moderator' | 'default' | null>(null);
  const [defaultReason, setDefaultReason] = useState('Missed scheduled Chama contribution');
  const [submittingModAction, setSubmittingModAction] = useState(false);

  // Peer-to-Peer Loan state
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanRequestAmount, setLoanRequestAmount] = useState<number>(0);
  const [loanRequestPurpose, setLoanRequestPurpose] = useState('');
  const [submittingLoanRequest, setSubmittingLoanRequest] = useState(false);

  const [selectedLoanToFund, setSelectedLoanToFund] = useState<PeerLoanRequest | null>(null);
  const [lenderAgreedTerms, setLenderAgreedTerms] = useState(false);
  const [submittingFund, setSubmittingFund] = useState(false);

  // Member Financial Statement Modal state
  const [selectedStatementMember, setSelectedStatementMember] = useState<{ id: number; name: string } | null>(null);
  const [statementData, setStatementData] = useState<MemberStatement | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  async function loadGroup() {
    setLoading(true);
    setError(null);
    try {
      const [data, prodsRes, loansRes] = await Promise.all([
        api.getGroup(groupId),
        api.getProducts(),
        api.getGroupLoans(groupId).catch(() => ({ loans: [] })),
      ]);
      setGroup(data.group);
      setLoans(loansRes.loans || []);
      if (data.group && !paymentAmount) {
        setPaymentAmount(data.group.dailyAmount);
      }

      // Filter products from other items/merchants (guaranteeing at least 5 recommendations)
      const others = prodsRes.products.filter(
        (p: Product) => p.id !== data.group?.productId
      );
      setRecommendedProducts(others);
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

  // Pay slot directly using wallet credit balance (from loan or store credit)
  async function handlePayFromWallet() {
    if (!currentUser || !mySlot || !group) return;
    const amountToPay = Math.min(paymentAmount || group.dailyAmount, currentUser.credit || 0);
    if (amountToPay <= 0) {
      onNotify('error', 'You do not have sufficient wallet balance to pay.');
      return;
    }

    setPayingFromWallet(true);
    try {
      const res = await api.paySlotFromWallet(group.id, {
        slotNumber: mySlot.slotNumber,
        amount: amountToPay,
      });
      currentUser.credit = res.walletBalance;
      setGroup(res.group);
      onNotify('success', res.message);
      loadGroup();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to pay from wallet');
    } finally {
      setPayingFromWallet(false);
    }
  }

  // Submit Peer Loan Request
  async function handleRequestPeerLoan(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !mySlot || !group) return;
    if (loanRequestAmount <= 0) {
      onNotify('error', 'Please enter a valid loan amount.');
      return;
    }

    setSubmittingLoanRequest(true);
    try {
      const res = await api.requestPeerLoan(group.id, {
        amount: Number(loanRequestAmount),
        purpose: loanRequestPurpose.trim() || `Chama Slot #${mySlot.slotNumber} installment support`,
      });
      onNotify('success', res.message);
      setShowLoanModal(false);
      setLoanRequestAmount(0);
      setLoanRequestPurpose('');
      loadGroup();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to submit loan request');
    } finally {
      setSubmittingLoanRequest(false);
    }
  }

  // 3rd-Party Lender Funds Member Wallet directly
  async function handleConfirmFundLoan() {
    if (!currentUser || !selectedLoanToFund || !group) return;
    if (!lenderAgreedTerms) {
      onNotify('error', 'Please confirm that loan terms and repayments are handled manually outside the platform.');
      return;
    }

    setSubmittingFund(true);
    try {
      const res = await api.fundPeerLoan(group.id, selectedLoanToFund.id);
      onNotify('success', res.message);
      setSelectedLoanToFund(null);
      setLenderAgreedTerms(false);
      loadGroup();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to fund member wallet');
    } finally {
      setSubmittingFund(false);
    }
  }

  // Moderator notifies 3rd party lenders
  async function handleNotifyLenders() {
    if (!currentUser || !group) return;
    try {
      await api.sendGroupChat(group.id, {
        kind: 'system',
        text: `🔔 MODERATOR NOTICE: Chama members are seeking optional peer-to-peer installment loans. 3rd-party lenders in this group can review open loan requests below and fund member wallets directly (1% Buyoll escrow fee applies). Repayments are arranged outside the platform.`,
      });
      onNotify('success', 'Notification alert sent to group chat and 3rd-party lenders.');
      loadGroup();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to send alert');
    }
  }

  // Open Member Statement Modal
  async function handleOpenStatement(member: { id: number; name: string }) {
    setSelectedStatementMember(member);
    setLoadingStatement(true);
    setStatementData(null);
    try {
      const res = await api.getMemberStatement(member.id);
      setStatementData(res.statement);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load member statement');
    } finally {
      setLoadingStatement(false);
    }
  }

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

                      {/* Dynamic Payment Progress Bar for Active Members */}
                      {isActive && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-semibold text-slate-700">
                              Payment Progress:
                            </span>
                            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                              percentPaid === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : percentPaid > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {percentPaid}% Paid
                            </span>
                          </div>

                          {/* Dynamic Bar: Fills up alongside payment progress; if member has not paid, bar remains empty at 0% */}
                          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5 relative">
                            {percentPaid > 0 ? (
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 via-teal-600 to-[#0E5A3C] rounded-full transition-all duration-500 shadow-xs"
                                style={{ width: `${percentPaid}%` }}
                              />
                            ) : (
                              // Member has not paid yet -> Bar remains completely empty!
                              <div className="w-0 h-full" />
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                            <span>KSh {(slot.paidAmount || 0).toLocaleString()} paid</span>
                            <span>
                              {slot.paidAmount === 0 ? (
                                <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded">
                                  0% · Bar remains empty
                                </span>
                              ) : (
                                `KSh ${Math.max(0, group.productPrice - (slot.paidAmount || 0)).toLocaleString()} remaining`
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Slot Actions / Status Footer */}
                    <div className="mt-3 pt-2 flex items-center justify-between gap-2">
                      {isActive ? (
                        <div className="flex items-center gap-2 w-full justify-between flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 font-mono">
                              Code: {slot.inviteCode}
                            </span>
                            {/* Member Financial Statement & Ledger button */}
                            <button
                              onClick={() => handleOpenStatement({ id: slot.userId!, name: slot.userName || 'Member' })}
                              title="View Customer Statement & Ledger"
                              className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded transition-colors"
                            >
                              <FileText className="w-2.5 h-2.5 text-[#0E5A3C]" />
                              <span>Statement</span>
                            </button>
                          </div>

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

          {/* PEER TO PEER (P2P) CHAMA LOAN DESK (OPTIONAL) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0E5A3C] flex items-center justify-center">
                  <HandCoins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>P2P Chama Loan Desk</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                      Optional
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    3rd-party lenders fund member wallets directly · 1% platform fee · Repayment arranged outside platform
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {mySlot && (
                  <button
                    onClick={() => {
                      const remaining = Math.max(0, (mySlot.targetAmount || group.productPrice) - (mySlot.paidAmount || 0));
                      setLoanRequestAmount(Math.min(remaining, group.dailyAmount * 2));
                      setShowLoanModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0E5A3C] hover:bg-[#0b4830] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                  >
                    <HandCoins className="w-3.5 h-3.5" />
                    <span>Request P2P Loan</span>
                  </button>
                )}

                {isModerator && (
                  <button
                    onClick={handleNotifyLenders}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                    title="Alert 3rd-party lenders in group chat"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Alert Lenders</span>
                  </button>
                )}
              </div>
            </div>

            {/* Information Notice */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 mb-4 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <b>How P2P Loans Work:</b> A member posts a request in the group. A 3rd-party lender agrees and transfers funds directly into that member's Buyoll wallet. The 3rd party contributes a 1% platform fee to Buyoll. The member then uses their wallet to pay for the item. All loan agreements, interest, and repayments are conducted manually outside the Buyoll platform.
              </div>
            </div>

            {/* Loan Requests List */}
            {loans.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <HandCoins className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-xs text-slate-500">No active P2P loan requests in this Chama group.</p>
                {mySlot && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Need help keeping your slot active? Click "Request P2P Loan" above.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {loans.map((loan) => {
                  const fee = loan.platformFeeAmount || Math.max(1, Math.round(loan.amount * 0.01));
                  const isFunded = loan.status === 'funded';
                  const isMyRequest = currentUser && loan.requesterId === currentUser.id;

                  return (
                    <div
                      key={loan.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isFunded
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-slate-200 bg-white shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900">
                            {loan.requesterName} (Member #{loan.slotNumber})
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isFunded
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isFunded ? 'Funded' : 'Open Request'}
                          </span>
                          {isMyRequest && (
                            <span className="text-[10px] bg-slate-900 text-white font-bold px-1.5 py-0.2 rounded">
                              Your Request
                            </span>
                          )}
                        </div>

                        <div className="text-sm font-black text-slate-900">
                          KSh {loan.amount.toLocaleString()}
                          <span className="text-xs font-normal text-slate-500 ml-2">
                            1% Platform Fee: KSh {fee.toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-0.5">
                          Purpose: {loan.purpose}
                        </p>

                        {isFunded && (
                          <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Funded by <b>{loan.fundedByUserName}</b> · 1% fee paid · Credited to member wallet</span>
                          </div>
                        )}
                      </div>

                      {/* Action for 3rd-Party Lenders */}
                      <div>
                        {!isFunded && (
                          <button
                            onClick={() => {
                              if (!currentUser) {
                                onNotify('info', 'Please sign in to fund member loans.');
                                onOpenAuth();
                                return;
                              }
                              setSelectedLoanToFund(loan);
                              setLenderAgreedTerms(false);
                            }}
                            className="px-3.5 py-2 bg-[#FF6A00] hover:bg-[#e85f00] text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-xs"
                          >
                            Fund Member's Wallet (3rd-Party Lender)
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                {/* Instant Wallet Payment Option (from Peer Loan or Store Credit) */}
                {currentUser && (currentUser.credit || 0) > 0 && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Wallet Credit Available</span>
                      </span>
                      <span className="text-xs font-black text-emerald-800 tabular-nums">
                        KSh {(currentUser.credit || 0).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-snug mb-2.5">
                      You have funds deposited from peer loans or previous returns. Apply them directly to pay for this slot!
                    </p>
                    <button
                      type="button"
                      disabled={payingFromWallet}
                      onClick={handlePayFromWallet}
                      className="w-full py-2 bg-[#0E5A3C] hover:bg-[#0b4830] text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {payingFromWallet
                          ? 'Applying Payment...'
                          : `Pay KSh ${Math.min(paymentAmount || group.dailyAmount, currentUser.credit || 0).toLocaleString()} from Wallet`}
                      </span>
                    </button>
                  </div>
                )}

                <div className="p-2.5 bg-amber-50 text-amber-900 rounded-lg text-xs">
                  Pay only to Buyoll Till <b>000000</b> (Buy Goods). Never pay members directly.
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

      {/* RECOMMENDED FROM OTHER SHOPS & MERCHANTS (At least 5 recommendations) */}
      <section className="border-t border-slate-200 pt-10 mt-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-emerald-100 text-[#0E5A3C] rounded-lg">
                <Store className="w-4 h-4" />
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Recommended from Other Shops & Merchants
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Check out other active Chama products from verified merchants across Kenya.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full shrink-0">
            {recommendedProducts.length} Alternate Shops
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {recommendedProducts.slice(0, 10).map((rec) => {
            const minDaily = rec.speedOptions && rec.speedOptions.length > 0
              ? Math.min(...rec.speedOptions.map(s => s.dailyAmount))
              : Math.ceil(rec.price / 10 / 10);

            return (
              <div
                key={rec.id}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onNavigate('product', rec.id);
                }}
                className="group flex flex-col justify-between bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#0E5A3C] hover:shadow-md transition-all cursor-pointer p-3"
              >
                <div>
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-2.5">
                    <img
                      src={resolveImageUrl(rec.images[0])}
                      alt={rec.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {rec.discountPercent && rec.discountPercent > 0 && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#FF6A00] text-white text-[10px] font-black rounded">
                        -{rec.discountPercent}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1 truncate">
                    <Store className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate font-medium text-slate-600">{rec.vendorName}</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug mb-2 group-hover:text-[#0E5A3C] transition-colors">
                    {rec.title}
                  </h4>

                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                      KSh {rec.price.toLocaleString()}
                    </span>
                    {rec.wasPrice && rec.wasPrice > rec.price && (
                      <span className="text-[10px] text-slate-400 line-through tabular-nums">
                        KSh {rec.wasPrice.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-[#0E5A3C] font-semibold mb-3">
                    From KSh {minDaily.toLocaleString()} / day
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    onNavigate('product', rec.id);
                  }}
                  className="w-full py-1.5 bg-slate-100 group-hover:bg-[#0E5A3C] text-slate-700 group-hover:text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>Check Shop</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

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

      {/* MODAL 1: REQUEST PEER LOAN (Member Option) */}
      {showLoanModal && mySlot && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowLoanModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0E5A3C] flex items-center justify-center">
                <HandCoins className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Request P2P Installment Loan
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Post an optional loan request to this Chama group. 3rd-party lenders will see your request in the chat and loan board and can fund your wallet directly.
            </p>

            <form onSubmit={handleRequestPeerLoan} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Your Chama Slot:</span>
                  <span className="font-bold text-slate-900">Member #{mySlot.slotNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Remaining Obligation:</span>
                  <span className="font-bold text-slate-900">
                    KSh {Math.max(0, (mySlot.targetAmount || group.productPrice) - (mySlot.paidAmount || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loan Amount Needed (KSh) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="50"
                  required
                  value={loanRequestAmount || ''}
                  onChange={(e) => setLoanRequestAmount(Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E5A3C]"
                />
                {loanRequestAmount > 0 && (
                  <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                    <span>1% Platform Escrow Fee:</span>
                    <b className="text-slate-800">
                      KSh {Math.max(1, Math.round(loanRequestAmount * 0.01)).toLocaleString()}
                    </b>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Purpose Note
                </label>
                <input
                  type="text"
                  value={loanRequestPurpose}
                  onChange={(e) => setLoanRequestPurpose(e.target.value)}
                  placeholder="e.g. Cover upcoming 10-day cycle installment"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E5A3C]"
                />
              </div>

              <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-[11px] leading-relaxed">
                ⚖️ <b>Notice:</b> Interest rates, repayment schedule, and loan agreements are negotiated and settled manually outside the Buyoll platform. Buyoll only facilitates direct wallet transfer upon agreement.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLoanRequest || loanRequestAmount <= 0}
                  className="px-5 py-2 bg-[#0E5A3C] hover:bg-[#0b4830] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                >
                  {submittingLoanRequest ? 'Posting Request...' : 'Post Loan Request to Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FUND PEER LOAN (3rd-Party Lender Action) */}
      {selectedLoanToFund && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedLoanToFund(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#FF6A00] flex items-center justify-center">
                <HandCoins className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Fund Member's Wallet (3rd-Party Lender)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              You are funding <b>{selectedLoanToFund.requesterName}</b> (Member #{selectedLoanToFund.slotNumber}).
            </p>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs mb-4 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-600">Loan Principal to Member Wallet:</span>
                <span className="font-bold text-slate-900">
                  KSh {selectedLoanToFund.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">1% Buyoll Platform Escrow Fee:</span>
                <span className="font-bold text-[#FF6A00]">
                  KSh {(selectedLoanToFund.platformFeeAmount || Math.max(1, Math.round(selectedLoanToFund.amount * 0.01))).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>Total Commitment:</span>
                <span>
                  KSh {(selectedLoanToFund.amount + (selectedLoanToFund.platformFeeAmount || Math.max(1, Math.round(selectedLoanToFund.amount * 0.01)))).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 text-amber-900 rounded-xl text-xs space-y-2 mb-4">
              <p className="font-bold">Important 3rd-Party Lender Agreement:</p>
              <p className="text-[11px] leading-relaxed">
                All repayment schedules, interest agreements, and collection are strictly arranged and settled manually outside the Buyoll platform. Buyoll takes 1% platform fee for facilitating this loan and deposits the principal directly into the member's wallet to ensure Chama payment continuity.
              </p>
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lenderAgreedTerms}
                  onChange={(e) => setLenderAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded text-[#0E5A3C] focus:ring-[#0E5A3C]"
                />
                <span className="text-[11px] font-semibold text-slate-800">
                  I agree that repayments and loan agreements are handled manually outside the Buyoll platform.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedLoanToFund(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingFund || !lenderAgreedTerms}
                onClick={handleConfirmFundLoan}
                className="px-5 py-2 bg-[#FF6A00] hover:bg-[#e85f00] text-white text-xs font-bold rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                {submittingFund ? 'Funding Member Wallet...' : 'Confirm & Deposit to Wallet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MEMBER FINANCIAL STATEMENT & LEDGER */}
      {selectedStatementMember && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8 relative">
            <button
              onClick={() => setSelectedStatementMember(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Statement Header */}
            <div className="border-b border-slate-200 pb-4 mb-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0E5A3C] bg-emerald-50 px-2 py-0.5 rounded">
                    Official Customer Statement
                  </span>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                    Buyoll Member Financial Statement
                  </h2>
                  <p className="text-xs text-slate-500">
                    Account Holder: <b>{selectedStatementMember.name}</b> · Generated on {new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg print:hidden"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Statement</span>
                </button>
              </div>
            </div>

            {loadingStatement ? (
              <div className="py-12 text-center">
                <div className="w-6 h-6 border-2 border-[#0E5A3C] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading ledger records...</p>
              </div>
            ) : statementData ? (
              <div className="space-y-6">
                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Total Contributed</div>
                    <div className="text-lg font-black text-[#0E5A3C] mt-0.5">
                      KSh {statementData.totalPaid.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Available Wallet Credit</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      KSh {statementData.currentCredit.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Active Chama Slots</div>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {statementData.activeSlots.length} slot{statementData.activeSlots.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Dynamic Progress for this Chama */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Active Chama Obligations & Dynamic Progress
                  </h4>
                  <div className="space-y-2.5">
                    {statementData.activeSlots.map((s, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-slate-900">
                            {s.groupName} · Slot #{s.slotNumber} ({s.productTitle})
                          </span>
                          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            s.progressPercent === 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.progressPercent > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {s.progressPercent}%
                          </span>
                        </div>
                        {/* Dynamic Progress Bar */}
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden mb-1.5 p-0.5">
                          {s.progressPercent > 0 ? (
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-[#0E5A3C] rounded-full transition-all"
                              style={{ width: `${s.progressPercent}%` }}
                            />
                          ) : (
                            <div className="w-0 h-full" />
                          )}
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Paid: KSh {s.paidAmount.toLocaleString()} of KSh {s.targetAmount.toLocaleString()}</span>
                          <span>Delivery on Day {s.deliveryDay}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Transactions Ledger */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Customer Ledger & Transaction Statement
                  </h4>
                  {statementData.transactions.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                      No transaction entries recorded yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Reference</th>
                            <th className="py-2 px-3">Description</th>
                            <th className="py-2 px-3 text-right">Debit</th>
                            <th className="py-2 px-3 text-right">Credit</th>
                            <th className="py-2 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {statementData.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 text-slate-500 whitespace-nowrap">
                                {new Date(tx.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                              </td>
                              <td className="py-2 px-3 font-mono font-medium text-slate-900 whitespace-nowrap">
                                {tx.reference}
                              </td>
                              <td className="py-2 px-3 text-slate-700 max-w-xs truncate" title={tx.description}>
                                {tx.description}
                              </td>
                              <td className="py-2 px-3 text-right text-red-600 font-medium tabular-nums">
                                {tx.debit ? `-KSh ${tx.debit.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-2 px-3 text-right text-emerald-700 font-bold tabular-nums">
                                {tx.credit ? `+KSh ${tx.credit.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-emerald-100 text-emerald-800">
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-400 text-center">
                  Official statement issued by Buyoll Social Fintech · Secured by Buyoll Escrow M-Pesa Till 000000
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

