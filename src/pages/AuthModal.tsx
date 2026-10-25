import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';
import { api, setStoredUser } from '../api.ts';
import { X, User as UserIcon, Store, Shield, Phone, Sparkles } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: User) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onClose,
  onSuccess,
  onNotify,
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'buyer' | 'merchant'>('buyer');
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick switcher accounts
  const [existingUsers, setExistingUsers] = useState<Array<Partial<User>>>([]);

  useEffect(() => {
    api.getUsersList()
      .then(res => setExistingUsers(res.users))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      onNotify('error', 'Phone number is required');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({
        phone: phone.trim(),
        name: name.trim() || undefined,
        role,
        shopName: role === 'merchant' ? shopName.trim() : undefined,
      });

      onNotify('success', `Signed in as ${res.user.name}`);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      onNotify('error', err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickSelect(selectedPhone: string) {
    setLoading(true);
    try {
      const res = await api.login({ phone: selectedPhone });
      onNotify('success', `Signed in as ${res.user.name}`);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      onNotify('error', err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <img
              src="./buyoll_logo.png"
              alt="Buyoll"
              className="h-9 w-auto object-contain"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Buyoll
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Access your Chama groups, escrow wallet, or merchant portal.
          </p>
        </div>

        {/* Quick Account Switcher */}
        {existingUsers.length > 0 && (
          <div className="mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Account Switcher</span>
            </div>
            <div className="space-y-1.5">
              {existingUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleQuickSelect(u.phone!)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    {u.role === 'admin' ? (
                      <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    ) : u.role === 'merchant' ? (
                      <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-900 truncate">
                      {u.shopName || u.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono capitalize">
                    {u.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                className="w-full pl-3 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0E5A3C] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Name (for new accounts)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wanjiku Kimani"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0E5A3C] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Type
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0E5A3C] focus:outline-none bg-white"
            >
              <option value="buyer">Buyer / Chama Member</option>
              <option value="merchant">Merchant Store Owner</option>
            </select>
          </div>

          {role === 'merchant' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shop Display Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Nairobi Appliance Hub"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0E5A3C] focus:outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone.trim()}
            className="w-full py-2.5 bg-[#0E5A3C] hover:bg-[#0b4830] text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
          >
            {loading ? 'Signing In...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};
