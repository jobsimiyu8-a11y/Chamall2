import React, { useState, useEffect } from 'react';
import { User, PaymentRecord, RefundRequest, AuditLog, Product, ChamaGroup } from '../types.ts';
import { api } from '../api.ts';
import {
  Shield,
  Check,
  X,
  CreditCard,
  RotateCcw,
  Store,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface AdminDashboardPageProps {
  currentUser: User | null;
  onNavigate: (view: string, arg?: any) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  currentUser,
  onNavigate,
  onNotify,
}) => {
  const [data, setData] = useState<{
    pendingPayments: PaymentRecord[];
    allPayments: PaymentRecord[];
    refundRequests: RefundRequest[];
    merchants: User[];
    allUsers: User[];
    auditLogs: AuditLog[];
    groups: ChamaGroup[];
    products: Product[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'payments' | 'refunds' | 'merchants' | 'audit'>('payments');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await api.getAdminOverview();
      setData(res);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  // Handle Payment Decision
  async function handlePaymentDecision(paymentId: number, decision: 'approve' | 'reject') {
    setProcessingId(paymentId);
    try {
      const res = await api.adminPaymentDecision(paymentId, decision);
      onNotify('success', res.message);
      loadOverview();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to process payment');
    } finally {
      setProcessingId(null);
    }
  }

  // Handle Refund Status Update
  async function handleRefundStatus(refundId: number, status: string) {
    setProcessingId(refundId);
    try {
      const res = await api.adminRefundStatus(refundId, status);
      onNotify('success', res.message);
      loadOverview();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to update refund status');
    } finally {
      setProcessingId(null);
    }
  }

  // Handle Merchant Verification
  async function handleVerifyMerchant(merchantId: number, verified: boolean) {
    setProcessingId(merchantId);
    try {
      const res = await api.adminVerifyMerchant(merchantId, verified);
      onNotify('success', res.message);
      loadOverview();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to update merchant status');
    } finally {
      setProcessingId(null);
    }
  }

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Loading admin console...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              System Administration & Escrow Console
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Reconcile M-Pesa till 000000 payments, process member refunds, verify merchants, and inspect system audit trail.
          </p>
        </div>

        <button
          onClick={loadOverview}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'payments' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Pending Payments ({data.pendingPayments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'refunds' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refund Requests ({data.refundRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('merchants')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'merchants' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Merchants ({data.merchants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Audit Log ({data.auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: PENDING PAYMENTS RECONCILIATION */}
      {activeTab === 'payments' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">
              Pending M-Pesa Till 000000 Transactions
            </h2>
            <span className="text-xs text-slate-500">
              {data.pendingPayments.length} awaiting confirmation
            </span>
          </div>

          {data.pendingPayments.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">
              All transactions reconciled. No pending payments.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">M-Pesa Code</th>
                    <th className="py-3 px-4">Group / Slot</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.pendingPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{p.userName}</td>
                      <td className="py-3 px-4 capitalize text-slate-600">{p.type.replace('_', ' ')}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{p.code}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {p.groupName ? `${p.groupName} (Slot #${p.slotNumber})` : 'Direct / Coins'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                        KSh {p.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePaymentDecision(p.id, 'reject')}
                            disabled={processingId === p.id}
                            className="px-2.5 py-1 text-red-600 hover:bg-red-50 text-xs font-semibold rounded"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handlePaymentDecision(p.id, 'approve')}
                            disabled={processingId === p.id}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REFUND REQUESTS (PART 5.3) */}
      {activeTab === 'refunds' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Member Refund Claims (Part 5 Default Policy)
              </h2>
              <p className="text-xs text-slate-500">
                Verified claims from members whose slots were vacated.
              </p>
            </div>
            <span className="text-xs text-slate-500">{data.refundRequests.length} requests</span>
          </div>

          {data.refundRequests.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No refund requests submitted yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Claim ID</th>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Product Title</th>
                    <th className="py-3 px-4">Refund Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.refundRequests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono">#{r.id}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.userName}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{r.userPhone}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{r.productTitle}</td>
                      <td className="py-3 px-4 font-bold text-emerald-800 tabular-nums">
                        KSh {r.eligibleRefundAmount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : r.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        {r.status === 'requested' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleRefundStatus(r.id, 'approved')}
                              className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRefundStatus(r.id, 'rejected')}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 text-xs font-semibold rounded"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {r.status === 'approved' && (
                          <button
                            onClick={() => handleRefundStatus(r.id, 'completed')}
                            className="px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded"
                          >
                            Mark Disbursed
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MERCHANTS */}
      {activeTab === 'merchants' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Registered Merchant Stores</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Shop Display Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.merchants.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4 text-slate-700">{m.shopName || '—'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{m.phone}</td>
                    <td className="py-3 px-4">
                      {m.verified ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px]">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {m.verified ? (
                        <button
                          onClick={() => handleVerifyMerchant(m.id, false)}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 text-xs font-semibold rounded"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleVerifyMerchant(m.id, true)}
                          className="px-3 py-1 bg-emerald-700 text-white text-xs font-bold rounded"
                        >
                          Verify Merchant
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4">
            System Security & Group Activity Audit Trail
          </h2>
          <div className="space-y-2 text-xs">
            {data.auditLogs.map((log) => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-3">
                <span className="font-mono text-[10px] text-slate-400 shrink-0 mt-0.5">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="font-bold text-indigo-700 shrink-0 font-mono text-[11px]">
                  {log.action}
                </span>
                <div className="flex-1 text-slate-700">
                  <span className="font-semibold text-slate-900">{log.actorName}:</span> {log.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
