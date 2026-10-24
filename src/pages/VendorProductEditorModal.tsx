import React, { useState } from 'react';
import { Product, SpeedOption } from '../types.ts';
import { api } from '../api.ts';
import { X, Plus, Trash2, Save, Image as ImageIcon } from 'lucide-react';

interface VendorProductEditorModalProps {
  product: Product | null; // null if creating new product
  onClose: () => void;
  onSaved: (product: Product) => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const VendorProductEditorModal: React.FC<VendorProductEditorModalProps> = ({
  product,
  onClose,
  onSaved,
  onNotify,
}) => {
  const isEditing = Boolean(product);

  const [title, setTitle] = useState(product?.title || '');
  const [description, setDescription] = useState(product?.description || '');
  const [category, setCategory] = useState(product?.category || 'Appliances');
  const [price, setPrice] = useState<number>(product?.price || 10000);
  const [wasPrice, setWasPrice] = useState<number | undefined>(product?.wasPrice);
  const [discountPercent, setDiscountPercent] = useState<number | undefined>(product?.discountPercent);
  const [stockQuantity, setStockQuantity] = useState<number>(product?.stockQuantity || 10);
  const [imageUrl, setImageUrl] = useState(product?.images?.[0] || '');

  // Speed options editor
  const [speedOptions, setSpeedOptions] = useState<SpeedOption[]>(
    product?.speedOptions || [
      { size: 10, cycleDays: 10, dailyAmount: Math.ceil((product?.price || 10000) / 10 / 10), totalAmount: product?.price || 10000, description: '10 members · Daily installment · Rotation every 10 days' },
      { size: 6, cycleDays: 10, dailyAmount: Math.ceil((product?.price || 10000) / 6 / 10), totalAmount: product?.price || 10000, description: '6 members · 60-day cycle' },
      { size: 4, cycleDays: 10, dailyAmount: Math.ceil((product?.price || 10000) / 4 / 10), totalAmount: product?.price || 10000, description: '4 members · 40-day cycle' },
      { size: 2, cycleDays: 10, dailyAmount: Math.ceil((product?.price || 10000) / 2 / 10), totalAmount: product?.price || 10000, description: '2 members · 20-day duo' },
    ]
  );

  const [saving, setSaving] = useState(false);

  // Recalculate daily rates when total price changes
  function handlePriceChange(newPrice: number) {
    setPrice(newPrice);
    if (wasPrice && wasPrice > newPrice) {
      setDiscountPercent(Math.round(((wasPrice - newPrice) / wasPrice) * 100));
    }
    // Update daily rates on existing speeds
    setSpeedOptions(prev =>
      prev.map(opt => ({
        ...opt,
        totalAmount: newPrice,
        dailyAmount: Math.ceil(newPrice / opt.size / 10),
      }))
    );
  }

  // Speed options handlers
  function updateSpeedOption(idx: number, field: keyof SpeedOption, val: any) {
    setSpeedOptions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  }

  function addSpeedOption() {
    setSpeedOptions(prev => [
      ...prev,
      {
        size: 8,
        cycleDays: 10,
        dailyAmount: Math.ceil(price / 8 / 10),
        totalAmount: price,
        description: '8 members · Rotation every 10 days',
      },
    ]);
  }

  function removeSpeedOption(idx: number) {
    if (speedOptions.length <= 1) {
      onNotify('error', 'A product must have at least one speed option configured.');
      return;
    }
    setSpeedOptions(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim() || price <= 0) {
      onNotify('error', 'Please fill in all required product fields.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Product> = {
        title: title.trim(),
        description: description.trim(),
        category,
        price,
        wasPrice: wasPrice ? Number(wasPrice) : undefined,
        discountPercent: discountPercent ? Number(discountPercent) : undefined,
        stockQuantity,
        images: imageUrl.trim() ? [imageUrl.trim()] : ['/src/assets/images/stainless_cookware_set_1792852473733.jpg'],
        speedOptions,
      };

      if (isEditing && product) {
        const res = await api.updateProduct(product.id, payload);
        onNotify('success', res.message || 'Product updated permanently in database.');
        onSaved(res.product);
      } else {
        const res = await api.createProduct(payload);
        onNotify('success', 'New product created and saved to database.');
        onSaved(res.product);
      }
      onClose();
    } catch (err: any) {
      onNotify('error', err.message || 'Failed to save product information');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? `Edit Listing: ${product?.title}` : 'Post New Product Listing'}
            </h2>
            <p className="text-xs text-slate-500">
              Changes are permanently validated and saved to the backend database.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. EcoFlow Portable Solar Power Station"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0E5A3C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0E5A3C] focus:outline-none bg-white"
              >
                <option>Appliances</option>
                <option>Kitchen</option>
                <option>Phones, Tablets & TV</option>
                <option>Home & Office Furniture</option>
                <option>Bedding</option>
                <option>Computing</option>
                <option>Gaming</option>
                <option>Baby</option>
              </select>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cash Price (KSh) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                required
                value={price}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0E5A3C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Previous Price (KSh)
              </label>
              <input
                type="number"
                min="0"
                value={wasPrice || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setWasPrice(val);
                  if (val && val > price) {
                    setDiscountPercent(Math.round(((val - price) / val) * 100));
                  } else {
                    setDiscountPercent(undefined);
                  }
                }}
                placeholder="Optional strike price"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0E5A3C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="1"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0E5A3C] focus:outline-none"
              />
            </div>
          </div>

          {/* Image URL / Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="e.g. /src/assets/images/solar_power_backup_station_1792852473757.jpg"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0E5A3C] focus:outline-none"
              />
            </div>
            {imageUrl && (
              <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed technical specifications, materials, warranty, and package contents..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0E5A3C] focus:outline-none"
            />
          </div>

          {/* PART 6: SPEED OPTIONS CONFIGURATION */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Configured Chama Speeds
                </h3>
                <p className="text-[11px] text-slate-500">
                  Define member counts and daily rates buyers can select on the product page.
                </p>
              </div>
              <button
                type="button"
                onClick={addSpeedOption}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Speed</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {speedOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                >
                  <div className="w-24">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Members</label>
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={opt.size}
                      onChange={(e) => {
                        const newSize = Number(e.target.value);
                        updateSpeedOption(idx, 'size', newSize);
                        updateSpeedOption(idx, 'dailyAmount', Math.ceil(price / newSize / 10));
                      }}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                    />
                  </div>

                  <div className="w-28">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Daily Rate (KSh)</label>
                    <input
                      type="number"
                      min="1"
                      value={opt.dailyAmount}
                      onChange={(e) => updateSpeedOption(idx, 'dailyAmount', Number(e.target.value))}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Description Note</label>
                    <input
                      type="text"
                      value={opt.description || ''}
                      onChange={(e) => updateSpeedOption(idx, 'description', e.target.value)}
                      placeholder="e.g. 10 members · 100 days rotation"
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSpeedOption(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded mt-3"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#0E5A3C] hover:bg-[#0b4830] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving to Database...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
