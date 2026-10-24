import React, { useState, useEffect } from 'react';
import { User, Product, ChamaGroup } from '../types.ts';
import { api } from '../api.ts';
import { VendorProductEditorModal } from './VendorProductEditorModal.tsx';
import {
  Package,
  Plus,
  Edit3,
  Users,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface VendorDashboardPageProps {
  currentUser: User | null;
  onNavigate: (view: string, arg?: any) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const VendorDashboardPage: React.FC<VendorDashboardPageProps> = ({
  currentUser,
  onNavigate,
  onNotify,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<ChamaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    loadVendorData();
  }, [currentUser]);

  async function loadVendorData() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [prodRes, grpRes] = await Promise.all([
        api.getProducts({ vendorId: currentUser.id }),
        api.getGroups(),
      ]);
      setProducts(prodRes.products);
      setGroups(grpRes.groups);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to load merchant data');
    } finally {
      setLoading(false);
    }
  }

  const myProductIds = products.map(p => p.id);
  const myGroups = groups.filter(g => myProductIds.includes(g.productId));
  const totalMembersEnrolled = myGroups.reduce((acc, g) => acc + g.occupiedCount, 0);
  const totalRevenue = myGroups.reduce((acc, g) => {
    return acc + g.slots.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.paidAmount || 0), 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {currentUser?.shopName || currentUser?.name} Dashboard
            </h1>
            {currentUser?.verified ? (
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Merchant</span>
              </span>
            ) : (
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                Verification Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Manage your catalog, edit pricing and speed configurations, and track Chama orders.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsEditorOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FF6A00] hover:bg-[#e85f00] text-white text-xs font-bold rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post New Listing</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Live Listings</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {products.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Available for buyer Chamas</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Members Enrolled</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tabular-nums">
            {totalMembersEnrolled}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            Across {myGroups.length} active group{myGroups.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Value In Circulation</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-[#0E5A3C] tabular-nums">
            KSh {totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Released as slots mature</div>
        </div>
      </div>

      {/* Product Listings Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Your Product Listings</h2>
          <span className="text-xs text-slate-500">{products.length} items</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading your listings...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">No products listed yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Add your first genuine product listing with customized Chama speeds and start selling.
            </p>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsEditorOpen(true);
              }}
              className="px-4 py-2 bg-[#0E5A3C] text-white text-xs font-bold rounded-lg"
            >
              Post First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Configured Speeds</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const itemGroups = myGroups.filter(g => g.productId === p.id);
                  const members = itemGroups.reduce((a, g) => a + g.occupiedCount, 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0] || '/src/assets/images/stainless_cookware_set_1792852473733.jpg'}
                            alt=""
                            className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1 max-w-xs">
                              {p.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {members} members in {itemGroups.length} groups
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                        KSh {p.price.toLocaleString()}
                        {p.wasPrice && (
                          <div className="text-[10px] text-slate-400 line-through">
                            KSh {p.wasPrice.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.speedOptions?.map(s => (
                            <span key={s.size} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">
                              {s.size}m
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{p.stockQuantity}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                          Approved
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onNavigate('product', p.id)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                            title="View Public Page"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsEditorOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#0E5A3C] hover:bg-[#0b4830] text-white font-semibold rounded-lg text-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Listing</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active Chama Groups under this merchant */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Active Buyer Chamas for Your Products
        </h2>
        {myGroups.length === 0 ? (
          <p className="text-xs text-slate-500">No buyer Chamas have formed yet for your products.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.map((g) => (
              <div
                key={g.id}
                onClick={() => onNavigate('group', g.id)}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer bg-slate-50/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 text-xs line-clamp-1">{g.name}</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    {g.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mb-2">{g.productTitle}</div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{g.occupiedCount} of {g.size} members</span>
                  <b>KSh {g.dailyAmount.toLocaleString()}/day</b>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {isEditorOpen && (
        <VendorProductEditorModal
          product={editingProduct}
          onClose={() => setIsEditorOpen(false)}
          onSaved={(savedProduct) => {
            loadVendorData();
          }}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
