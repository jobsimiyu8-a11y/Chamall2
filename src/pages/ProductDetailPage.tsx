import React, { useState, useEffect } from 'react';
import { Product, ChamaGroup, SpeedOption, User } from '../types.ts';
import { api } from '../api.ts';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Users,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface ProductDetailPageProps {
  productId: number;
  currentUser: User | null;
  onNavigate: (view: string, arg?: any) => void;
  onOpenAuth: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  currentUser,
  onNavigate,
  onOpenAuth,
  onNotify,
}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [groups, setGroups] = useState<ChamaGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Mandatory speed selection state (Part 2)
  const [selectedSpeed, setSelectedSpeed] = useState<number | null>(null);
  const [customGroupName, setCustomGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Joining group state
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  async function loadProductDetails() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProduct(productId);
      setProduct(data.product);
      setGroups(data.groups || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load product details.');
    } finally {
      setLoading(false);
    }
  }

  // Handle group creation
  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      onNotify('info', 'Please sign in to start a Chama group.');
      onOpenAuth();
      return;
    }

    if (!selectedSpeed) {
      onNotify('error', 'Choose your speed to continue.');
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await api.createGroup({
        productId,
        size: selectedSpeed,
        name: customGroupName.trim() || undefined,
      });

      onNotify('success', res.message || 'Group created! You are Member #1 and moderator.');
      onNavigate('group', res.group.id);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  }

  // Handle joining an existing group
  async function handleJoinGroup(groupId: number) {
    if (!currentUser) {
      onNotify('info', 'Please sign in to join this Chama.');
      onOpenAuth();
      return;
    }

    setSubmittingJoin(true);
    try {
      const res = await api.joinGroup(groupId, inviteCodeInput.trim() || undefined);
      onNotify('success', res.message);
      setJoiningGroupId(null);
      setInviteCodeInput('');
      onNavigate('group', groupId);
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to join group');
    } finally {
      setSubmittingJoin(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-[#0E5A3C] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm text-slate-500">Loading product details and active Chamas...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl mb-4 text-sm">
          {error || 'Product not found'}
        </div>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg"
        >
          Return to Announcements
        </button>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : ['/src/assets/images/stainless_cookware_set_1792852473733.jpg'];

  const currentImage = images[selectedImageIndex] || images[0];

  // Selected speed details
  const selectedSpeedOption: SpeedOption | undefined = product.speedOptions.find(
    s => s.size === selectedSpeed
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
        <button onClick={() => onNavigate('home')} className="hover:text-slate-900 transition-colors">
          Home
        </button>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <button onClick={() => onNavigate('home')} className="hover:text-slate-900 transition-colors">
          {product.category}
        </button>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-900 font-medium truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main 2-Column Split: 55-60% Left, 40-45% Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        {/* LEFT COLUMN: Gallery & Description (~58%) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main Large Image Container */}
          <div className="relative aspect-4/3 w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
            <img
              src={currentImage}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
            {product.discountPercent && product.discountPercent > 0 && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-[#FF6A00] text-white text-xs font-bold rounded-md shadow-sm">
                SAVE {product.discountPercent}%
              </div>
            )}
          </div>

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-slate-50 ${
                    selectedImageIndex === idx
                      ? 'border-[#0E5A3C] ring-2 ring-[#0E5A3C]/20'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Product Description & Technical Specifications */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mt-2">
            <h2 className="text-base font-bold text-slate-900 mb-3">Product Overview & Specifications</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {product.description}
            </p>

            {product.attributes && Object.keys(product.attributes).length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">
                  Key Specifications
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  {Object.entries(product.attributes).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-1.5 border-b border-slate-100">
                      <dt className="text-slate-500">{key}</dt>
                      <dd className="font-semibold text-slate-900">{val}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Trust Assurances */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0E5A3C]" />
                <span>Verified Authentic Seller</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#0E5A3C]" />
                <span>Doorstep Delivery on Cycle</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#0E5A3C]" />
                <span>Escrow Refund Guaranteed</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Buy & Chama Speed Selector (~42%) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
            {/* Seller info */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
              <span>Sold by</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                {product.vendorName}
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 font-medium">In Stock ({product.stockQuantity} available)</span>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
              {product.title}
            </h1>

            {/* Price Presentation */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">
                Cash / Full Value Price
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                  KSh {product.price.toLocaleString()}
                </span>
                {product.wasPrice && product.wasPrice > product.price && (
                  <span className="text-sm text-slate-400 line-through tabular-nums">
                    KSh {product.wasPrice.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Or pay flexibly in small daily increments with an Alibaird Chama group below.
              </p>
            </div>

            {/* PART 2: MANDATORY "CHOOSE YOUR SPEED" SECTION */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>1. Choose Your Speed</span>
                  <span className="text-xs text-red-500 font-semibold">*Mandatory</span>
                </label>
                {selectedSpeed && (
                  <span className="text-xs text-[#0E5A3C] font-semibold">
                    {selectedSpeed} members selected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Select your preferred group size and daily payment rate. Number 1 receives the item on Day 10, Number 2 on Day 20, and so on.
              </p>

              {/* Speed Option Cards */}
              <div className="space-y-2.5">
                {product.speedOptions.map((opt) => {
                  const isSelected = selectedSpeed === opt.size;
                  return (
                    <div
                      key={opt.size}
                      onClick={() => setSelectedSpeed(opt.size)}
                      className={`relative flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#0E5A3C] bg-emerald-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="speedSelection"
                          checked={isSelected}
                          onChange={() => setSelectedSpeed(opt.size)}
                          className="w-4 h-4 text-[#0E5A3C] focus:ring-[#0E5A3C] border-slate-300"
                        />
                        <div>
                          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>{opt.size} Members Speed</span>
                            {opt.size === 10 && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                                Most Popular
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">
                            {opt.description || `Delivery cycle every ${opt.cycleDays} days`}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-[#0E5A3C] tabular-nums">
                          KSh {opt.dailyAmount.toLocaleString()}
                          <span className="text-xs font-normal text-slate-500"> / day</span>
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          Total: KSh {opt.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PART 3 & PART 4: GROUP CREATION PANEL */}
            <div className="border-t border-slate-200 pt-5">
              <div className="text-sm font-bold text-slate-900 mb-2">
                2. Start or Join a Chama Group
              </div>

              {!selectedSpeed ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <p className="text-xs font-semibold text-slate-600 mb-2">
                    Choose your speed to continue.
                  </p>
                  <button
                    disabled
                    className="w-full py-3 bg-slate-200 text-slate-400 font-bold text-sm rounded-xl cursor-not-allowed"
                  >
                    Start your own Chama
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreateGroup} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Chama Group Name (optional)
                    </label>
                    <input
                      type="text"
                      value={customGroupName}
                      onChange={(e) => setCustomGroupName(e.target.value)}
                      placeholder={`e.g. ${currentUser?.name || 'My'} ${selectedSpeed}-Member Chama`}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E5A3C]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingGroup}
                    className="w-full py-3.5 bg-[#FF6A00] hover:bg-[#e85f00] text-white font-bold text-sm rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
                  >
                    {creatingGroup ? (
                      <span>Starting Group...</span>
                    ) : (
                      <>
                        <span>Start your own Chama ({selectedSpeed} members)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="p-3 bg-emerald-50 text-[#0E5A3C] rounded-xl text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">
                        Your group starts as soon as the first member joins. Other members can join while the group is active.
                      </p>
                      <p className="text-emerald-800 mt-0.5">
                        As creator, you will automatically be enrolled as <b>Member #1</b> and default group moderator.
                      </p>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Official till & escrow guarantee */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>ChaMall M-Pesa Till: <b>000000</b></span>
              <span>100% Escrow Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* PART 7.7: "GROUPS FOR THIS ITEM" SECTION */}
      <section className="border-t border-slate-200 pt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Open Chamas for this Item
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Join an existing active group with a member's invite code and start saving towards this item.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {groups.length} group{groups.length !== 1 ? 's' : ''} available
          </span>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              No active groups yet. Start a group and become member #1.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Be the first to open a Chama group for this product. Select your speed above and start saving immediately.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((grp) => {
              const openSlots = grp.slots.filter(s => s.status === 'open' || s.status === 'replacement_eligible').length;
              const isMember = currentUser && grp.slots.some(s => s.userId === currentUser.id && s.status === 'active');
              const isJoiningThis = joiningGroupId === grp.id;

              return (
                <div
                  key={grp.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                        {grp.size}-member speed
                      </span>
                      <span className="text-xs font-bold text-[#0E5A3C] uppercase tracking-wider">
                        {grp.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">
                      {grp.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">
                      Created by Member #1 · Rotation every {grp.cycleDays} days
                    </p>

                    {/* Capacity Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-600 mb-1">
                        <span>{grp.occupiedCount} of {grp.size} members joined</span>
                        <span className="font-semibold text-emerald-700">{openSlots} slots available</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0E5A3C] rounded-full transition-all"
                          style={{ width: `${(grp.occupiedCount / grp.size) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Rate */}
                    <div className="text-xs text-slate-600 mb-4">
                      Daily rate: <b className="text-slate-900">KSh {grp.dailyAmount.toLocaleString()}</b> / day
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    {isMember ? (
                      <button
                        onClick={() => onNavigate('group', grp.id)}
                        className="w-full py-2 bg-emerald-50 text-[#0E5A3C] font-semibold text-xs rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        You are a Member · Open Group
                      </button>
                    ) : isJoiningThis ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Enter Chama Invite Code:
                        </label>
                        <input
                          type="text"
                          value={inviteCodeInput}
                          onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                          placeholder="e.g. SOLAR9X1"
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white font-mono uppercase"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleJoinGroup(grp.id)}
                            disabled={submittingJoin}
                            className="flex-1 py-1.5 bg-[#FF6A00] text-white text-xs font-bold rounded"
                          >
                            {submittingJoin ? 'Joining...' : 'Confirm Join'}
                          </button>
                          <button
                            onClick={() => {
                              setJoiningGroupId(null);
                              setInviteCodeInput('');
                            }}
                            className="px-2.5 py-1.5 bg-slate-200 text-slate-700 text-xs rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onNavigate('group', grp.id)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                        {openSlots > 0 && (
                          <button
                            onClick={() => {
                              setJoiningGroupId(grp.id);
                              // Pre-fill with group's main invite code for quick access
                              setInviteCodeInput(grp.inviteCode);
                            }}
                            className="flex-1 py-2 bg-[#FF6A00] hover:bg-[#e85f00] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                          >
                            Join Group
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
