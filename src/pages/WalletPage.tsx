import React, { useState, useEffect } from 'react';
import { User, DefaultRecord, RefundRequest, PaymentRecord, StoreCreditLedgerEntry } from '../types.ts';
import { api } from '../api.ts';
import {
  Wallet,
  Coins,
  Award,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  History,
} from 'lucide-react';

interface WalletPageProps {
  currentUser: User | null;
  onNavigate: (view: string, arg?: any) => void;
  onOpenAuth: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
  onUserUpdate?: () => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({
  currentUser,
  onNavigate,
  onOpenAuth,
  onNotify,
  onUserUpdate,
}) => {
  const [defaults, setDefaults] = useState<DefaultRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [ledger, setLedger] = useState<StoreCreditLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Coin topup state
  const [coinMpesaCode, setCoinMpesaCode] = useState('');
  const [coinAmount, setCoinAmount] = useState(50);
  const [submittingCoin, setSubmittingCoin] = useState(false);

  // Default resolution modal
  const [selectedDefault, setSelectedDefault] = useState<DefaultRecord | null>(null);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadWalletData();
  }, [currentUser]);

  async function loadWalletData() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [defaultsRes, paymentsRes] = await Promise.all([
        api.getMyDefaults(),
        api.getMyPayments(),
      ]);
      setDefaults(defaultsRes.defaults);
      setRefunds(defaultsRes.refunds);
      setPayments(paymentsRes.payments);
      setLedger(paymentsRes.ledger);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }

  // Handle points redemption: 100 points = KSh 10 store credit
  async function handleRedeemPoints() {
    if (!currentUser || (currentUser.points || 0) < 100) {
      onNotify('error', 'You need at least 100 reward points to redeem.');
      return;
    }
    try {
      const res = await api.redeemPoints();
      onNotify('success', res.message);
      if (onUserUpdate) onUserUpdate();
      loadWalletData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to redeem points');
    }
  }

  // Handle Coin purchase
  async function handleBuyCoins(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !coinMpesaCode.trim()) return;

    setSubmittingCoin(true);
    try {
      const res = await api.postPayment({
        type: 'coin_purchase',
        code: coinMpesaCode.trim().toUpperCase(),
        amount: Number(coinAmount),
      });
      onNotify('success', res.message);
      setCoinMpesaCode('');
      loadWalletData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to submit coin purchase');
    } finally {
      setSubmittingCoin(false);
    }
  }

  // Handle resolving a defaulted slot (Part 5.3: Option A, B, or C)
  async function handleResolveDefault(
    recordId: number,
    option: 'refund' | 'store_credit' | 'alternate_purchase'
  ) {
    setResolving(true);
    try {
      const res = await api.resolveDefault(recordId, option, currentUser?.phone);
      onNotify('success', res.message);
      setSelectedDefault(null);
      if (onUserUpdate) onUserUpdate();
      loadWalletData();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to process resolution');
    } finally {
      setResolving(false);
    }
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Sign in to Access Wallet</h2>
        <p className="text-xs text-slate-500 mb-4">
          View your store credit balance, rewards, Chama refund requests, and M-Pesa ledger.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 bg-[#0E5A3C] text-white text-xs font-bold rounded-xl"
        >
          Sign In / Register
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Wallet & Escrow Balance
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your verified store credit, Chama applaud coins, reward points, and refund claims.
        </p>
      </div>

      {/* 3 Main Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Store Credit */}
        <div className="bg-white border-2 border-emerald-500/30 rounded-2xl p-6 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Store Credit Balance
            </span>
            <Wallet className="w-5 h-5 text-[#0E5A3C]" />
          </div>
          <div className="text-3xl font-black text-slate-900 tabular-nums mb-1">
            KSh {currentUser.credit.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            Usable towards any Chama contribution or direct purchase.
          </p>
        </div>

        {/* Reward Points */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Reward Points
              </span>
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 tabular-nums mb-1">
              {currentUser.points} <span className="text-xs font-normal text-slate-400">pts</span>
            </div>
            <p className="text-[11px] text-slate-500">Earn 1 pt for every KSh 10 contributed in Chamas.</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">100 pts = KSh 10</span>
            <button
              onClick={handleRedeemPoints}
              disabled={(currentUser.points || 0) < 100}
              className="px-3 py-1.5 bg-[#0E5A3C] disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-bold rounded-lg transition-colors"
            >
              Redeem to Credit
            </button>
          </div>
        </div>

        {/* Applaud Coins */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Applaud Coins
              </span>
              <Coins className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 tabular-nums mb-1">
              {currentUser.coins}{' '}
              <span className="text-xs font-normal text-slate-400">coins</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Used in Chama group chat to applaud and motivate faithful contributors.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">KSh 1 = 1 coin</span>
            <span className="text-xs font-semibold text-[#0E5A3C]">Top up below</span>
          </div>
        </div>
      </div>

      {/* PART 5.3: DEFAULTED SLOTS & REFUND CLAIMS RESOLUTION CENTER */}
      {defaults.length > 0 && (
        <section className="bg-amber-50/50 border-2 border-amber-300 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-700" />
            <h2 className="text-base font-bold text-amber-950">
              Vacated / Defaulted Slot Resolution Center (Part 5)
            </h2>
          </div>
          <p className="text-xs text-amber-900 mb-4 leading-relaxed">
            When a Chama slot is vacated due to missed contributions, your historical paid amounts are protected. You can claim a cash M-Pesa refund, convert the full value to store credit, or apply it to an alternate order.
          </p>

          <div className="space-y-3">
            {defaults.map((def) => {
              const isResolved = def.resolutionStatus === 'completed';
              const hasRefundReq = refunds.find(r => r.defaultRecordId === def.id);

              return (
                <div
                  key={def.id}
                  className="bg-white rounded-xl p-4 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-900">
                        {def.groupName} · Slot #{def.slotNumber}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {new Date(def.defaultDate).toLocaleDateString()}
                      </span>
                      {isResolved && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                          Resolved ({def.resolutionOption})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600">
                      Product: <b>{def.productTitle}</b> · Verified Paid Amount:{' '}
                      <b className="text-emerald-700 tabular-nums">KSh {def.amountPaid.toLocaleString()}</b>
                    </div>
                    {hasRefundReq && (
                      <div className="text-[11px] text-indigo-700 font-semibold mt-1">
                        Refund Status: <b>{hasRefundReq.status.toUpperCase()}</b> · Request #{hasRefundReq.id}
                      </div>
                    )}
                  </div>

                  {!isResolved && !hasRefundReq && (
                    <button
                      onClick={() => setSelectedDefault(def)}
                      className="px-4 py-2 bg-[#FF6A00] hover:bg-[#e85f00] text-white text-xs font-bold rounded-lg shrink-0 shadow-xs"
                    >
                      Choose Refund or Credit
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Two Column Grid: Top up Coins & Ledger History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT: Coin Top-up Form (~35%) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>Top Up Applaud Coins</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Pay M-Pesa to ChaMall Till <b>000000</b> (KSh 1 = 1 coin) and post the confirmation code.
          </p>

          <form onSubmit={handleBuyCoins} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                M-Pesa Transaction Code
              </label>
              <input
                type="text"
                required
                value={coinMpesaCode}
                onChange={(e) => setCoinMpesaCode(e.target.value.toUpperCase())}
                placeholder="e.g. QJK4X8L2PA"
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E5A3C]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Coins to Buy (KSh)
              </label>
              <input
                type="number"
                min="10"
                required
                value={coinAmount}
                onChange={(e) => setCoinAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E5A3C]"
              />
            </div>

            <button
              type="submit"
              disabled={submittingCoin}
              className="w-full py-2.5 bg-[#0E5A3C] hover:bg-[#0b4830] text-white text-xs font-bold rounded-lg transition-colors"
            >
              {submittingCoin ? 'Posting Code...' : `Buy ${coinAmount} Coins`}
            </button>
          </form>
        </div>

        {/* RIGHT: Transaction Statements & Ledger (~65%) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* M-Pesa Statements */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>M-Pesa Till Statement</span>
            </h3>

            {payments.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No payment transactions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Code</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 capitalize text-slate-700">{p.type.replace('_', ' ')}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.code}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 tabular-nums">
                          KSh {p.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Store Credit Ledger Entries */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-500" />
              <span>Store Credit Ledger</span>
            </h3>

            {ledger.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No credit conversions yet.</p>
            ) : (
              <div className="space-y-2">
                {ledger.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{l.note}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(l.createdAt).toLocaleString()} · Balance After: KSh {l.balanceAfter.toLocaleString()}
                      </div>
                    </div>
                    <div className="font-bold text-emerald-700 text-sm tabular-nums">
                      +KSh {l.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RESOLUTION MODAL FOR DEFAULTED SLOT (PART 5.3) */}
      {selectedDefault && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Select Resolution for Vacated Slot #{selectedDefault.slotNumber}
                </h3>
                <p className="text-xs text-slate-500">{selectedDefault.groupName}</p>
              </div>
              <button
                onClick={() => setSelectedDefault(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50 text-[#0E5A3C] rounded-xl text-xs mb-4">
              Verified Paid Amount Eligible for Resolution:{' '}
              <b className="text-sm font-black">KSh {selectedDefault.amountPaid.toLocaleString()}</b>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Under Part 5 default regulations, you have three protected choices for your verified contributions:
            </p>

            <div className="space-y-3 mb-6">
              {/* Option A: Cash Refund */}
              <button
                onClick={() => handleResolveDefault(selectedDefault.id, 'refund')}
                disabled={resolving}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-[#0E5A3C] hover:bg-slate-50 transition-all flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  A
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Option A: Request Cash M-Pesa Refund</div>
                  <div className="text-[11px] text-slate-500">
                    Submit verified claim to admin. Funds disbursed to your registered M-Pesa number {currentUser.phone}.
                  </div>
                </div>
              </button>

              {/* Option B: Store Credit */}
              <button
                onClick={() => handleResolveDefault(selectedDefault.id, 'store_credit')}
                disabled={resolving}
                className="w-full text-left p-3.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50 transition-all flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  B
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Option B: Retain as Store Credit (Instant)
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Immediately converts KSh {selectedDefault.amountPaid.toLocaleString()} into your account balance for future purchases.
                  </div>
                </div>
              </button>

              {/* Option C: Apply to Another Purchase */}
              <button
                onClick={() => handleResolveDefault(selectedDefault.id, 'alternate_purchase')}
                disabled={resolving}
                className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                  C
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Option C: Apply Value to Alternate Order
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Transfer the credit to join a different Chama group of your choice.
                  </div>
                </div>
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedDefault(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
