import React, { useState, useEffect } from 'react';
import { Product, ChamaGroup } from '../types.ts';
import { api } from '../api.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import {
  Sparkles,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface HomePageProps {
  onSelectProduct: (productId: number) => void;
  searchQuery: string;
}

const CATEGORIES = [
  'All',
  'Appliances',
  'Kitchen',
  'Phones, Tablets & TV',
  'Home & Office Furniture',
  'Bedding',
  'Computing',
  'Gaming',
  'Baby',
];

export const HomePage: React.FC<HomePageProps> = ({
  onSelectProduct,
  searchQuery,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<ChamaGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [selectedCategory, searchQuery]);

  async function loadHomeData() {
    setLoading(true);
    try {
      const [prodRes, grpRes] = await Promise.all([
        api.getProducts({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          search: searchQuery || undefined,
        }),
        api.getGroups(),
      ]);
      setProducts(prodRes.products);
      setGroups(grpRes.groups);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  // Count active groups per product
  const groupCountMap = groups.reduce((acc, g) => {
    acc[g.productId] = (acc[g.productId] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const featuredProduct = products.find(p => p.isFeatured) || products[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Editorial Campaign Hero */}
      {!searchQuery && selectedCategory === 'All' && featuredProduct && (
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0E5A3C] via-[#0b4830] to-[#073221] text-white p-8 sm:p-12 mb-10 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-full text-xs font-semibold text-amber-300 mb-4 border border-white/10">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Featured Group Deal · Instant Activation</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4 text-balance">
                Upgrade Your Home With Group Savings
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-xl mb-6">
                Pool daily contributions with trusted friends or open Chamas. Pick your preferred speed, start saving on Member #1, and receive authentic appliances with zero debt.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => onSelectProduct(featuredProduct.id)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#FF6A00] hover:bg-[#e85f00] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  <span>Explore Featured Chama</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <div className="text-xs text-emerald-200 font-medium">
                  Secured by ChaMall M-Pesa Till <b>000000</b>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div
                onClick={() => onSelectProduct(featuredProduct.id)}
                className="group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 cursor-pointer hover:bg-white/15 transition-all"
              >
                <div className="aspect-4/3 rounded-xl overflow-hidden mb-3 bg-white/5">
                  <img
                    src={featuredProduct.images[0]}
                    alt={featuredProduct.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="text-xs text-emerald-200 mb-1">{featuredProduct.category}</div>
                <h3 className="text-sm font-bold text-white line-clamp-1">{featuredProduct.title}</h3>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-lg font-extrabold text-amber-300 tabular-nums">
                    KSh {featuredProduct.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-100 font-semibold">
                    from KSh {Math.ceil(featuredProduct.price / 10 / 10).toLocaleString()} / day
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3-Step Process Strip */}
      {!searchQuery && selectedCategory === 'All' && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0E5A3C] flex items-center justify-center font-black text-sm shrink-0">
              01
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Choose Your Speed</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Select 10, 6, 4, or 2 members with clear daily installments and scheduled distribution dates.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-sm shrink-0">
              02
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Starts Immediately</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                No waiting for every slot to fill. Your group is active on Member #1, and slots can be claimed anytime.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm shrink-0">
              03
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Track & Receive</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pay daily to the ChaMall till. One verified member receives their product every 10-day cycle.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6 border-b border-slate-200">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Catalog Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {searchQuery ? `Search Results for "${searchQuery}"` : selectedCategory === 'All' ? 'Live Product Announcements' : selectedCategory}
          </h2>
          <p className="text-xs text-slate-500">
            {products.length} verified item{products.length !== 1 ? 's' : ''} available for Chama savings
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-[#0E5A3C] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-400">Loading catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">No products available yet.</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try adjusting your search terms or view all categories.'
              : 'Registered merchants will post genuine verified products here shortly.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onSelect={onSelectProduct}
              activeGroupCount={groupCountMap[p.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};
