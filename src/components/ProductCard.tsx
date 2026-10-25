import React from 'react';
import { Product } from '../types.ts';
import { resolveImageUrl } from '../api.ts';
import { Users, CheckCircle2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (productId: number) => void;
  activeGroupCount?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  activeGroupCount = 0,
}) => {
  // Lowest daily amount across configured speed options
  const minDaily = product.speedOptions && product.speedOptions.length > 0
    ? Math.min(...product.speedOptions.map(s => s.dailyAmount))
    : Math.ceil(product.price / 10 / 10);

  const mainImage = resolveImageUrl(product.images?.[0]);

  return (
    <article
      onClick={() => onSelect(product.id)}
      className="group flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
    >
      {/* Product Image */}
      <div className="relative aspect-4/3 w-full bg-slate-50 overflow-hidden">
        <img
          src={mainImage}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Styled graceful CSS fallback
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {product.discountPercent && product.discountPercent > 0 && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#FF6A00] text-white text-[11px] font-bold rounded">
            -{product.discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Product Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Clean unboxed metadata with separator */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 truncate">
            <span>{product.category}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1 text-slate-600 truncate">
              {product.vendorName}
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 min-h-10 mb-2">
            {product.title}
          </h3>

          {/* Price Block */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              KSh {product.price.toLocaleString()}
            </span>
            {product.wasPrice && product.wasPrice > product.price && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                KSh {product.wasPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Daily Chama rate */}
          <div className="text-xs text-[#0E5A3C] font-semibold mb-3">
            From KSh {minDaily.toLocaleString()} / day in Chama
          </div>
        </div>

        {/* Card Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {activeGroupCount > 0 ? `${activeGroupCount} active Chama${activeGroupCount > 1 ? 's' : ''}` : 'Open for Chamas'}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product.id);
            }}
            className="px-3 py-1.5 bg-slate-900 group-hover:bg-[#FF6A00] text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
          >
            View Details
          </button>
        </div>
      </div>
    </article>
  );
};
