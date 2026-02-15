import React, { useState } from 'react';
import { X, Star, Send, MessageSquare, Utensils, Truck, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import StarRating from './StarRating';

interface OrderItem {
  item_id?: string;
  name?: string;
  quantity: number;
  price: number;
}

interface PendingOrder {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  items: OrderItem[];
  total_amount: number;
  confirmed_at: string;
  created_at: string;
}

interface ReviewItemData {
  menu_item_id: string;
  menu_item_name: string;
  rating: number;
  comment: string;
}

interface ReviewModalProps {
  order: PendingOrder;
  onClose: () => void;
  onSubmit: (data: {
    order_id: string;
    overall_rating: number;
    food_rating: number | null;
    service_rating: number | null;
    comment: string;
    is_anonymous: boolean;
    items: ReviewItemData[];
  }) => Promise<void>;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ order, onClose, onSubmit }) => {
  const [overallRating, setOverallRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [itemRatings, setItemRatings] = useState<Record<string, { rating: number; comment: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showItemRatings, setShowItemRatings] = useState(false);

  const handleItemRating = (itemId: string, rating: number) => {
    setItemRatings(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], rating, comment: prev[itemId]?.comment || '' }
    }));
  };

  const handleItemComment = (itemId: string, itemComment: string) => {
    setItemRatings(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], rating: prev[itemId]?.rating || 0, comment: itemComment }
    }));
  };

  const handleSubmit = async () => {
    if (overallRating === 0) return;

    setIsSubmitting(true);
    try {
      const reviewItems: ReviewItemData[] = Object.entries(itemRatings)
        .filter(([, data]) => data.rating > 0)
        .map(([itemId, data]) => {
          const orderItem = order.items.find(i => (i.item_id || i.name) === itemId);
          return {
            menu_item_id: itemId,
            menu_item_name: orderItem?.name || 'Article',
            rating: data.rating,
            comment: data.comment,
          };
        });

      await onSubmit({
        order_id: order.id,
        overall_rating: overallRating,
        food_rating: foodRating || null,
        service_rating: serviceRating || null,
        comment,
        is_anonymous: isAnonymous,
        items: reviewItems,
      });
    } catch (error) {
      console.error('Erreur soumission avis:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Très mauvais';
      case 2: return 'Mauvais';
      case 3: return 'Correct';
      case 4: return 'Bon';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[fadeIn_0.2s_ease-out]" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_ease-out]" onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)' }}>

        {/* Modal header */}
        <div className="relative overflow-hidden px-6 pt-6 pb-5">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-200/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Notez votre commande</h2>
                <p className="text-xs text-gray-500 mt-0.5">{order.restaurant_name}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-600 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="px-6 pt-6 pb-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">

          {/* Note globale */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
              <Star className="w-3.5 h-3.5 text-orange-500" />
              Note globale <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-4 p-4 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-gray-200 transition-all">
              <StarRating rating={overallRating} onRatingChange={setOverallRating} size="lg" />
              {overallRating > 0 && (
                <span className="text-sm font-semibold text-amber-600">{getRatingLabel(overallRating)}</span>
              )}
            </div>
          </div>

          {/* Notes détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                <Utensils className="w-3.5 h-3.5 text-orange-500" />
                Nourriture
              </label>
              <div className="p-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-gray-200 transition-all">
                <StarRating rating={foodRating} onRatingChange={setFoodRating} size="md" />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                <Truck className="w-3.5 h-3.5 text-orange-500" />
                Service
              </label>
              <div className="p-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-gray-200 transition-all">
                <StarRating rating={serviceRating} onRatingChange={setServiceRating} size="md" />
              </div>
            </div>
          </div>

          {/* Notation par plat (optionnelle, toggle) */}
          {order.items && order.items.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowItemRatings(!showItemRatings)}
                className="flex items-center gap-2 w-full p-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50/30 transition-all text-sm font-semibold text-gray-600"
              >
                <Utensils className="w-3.5 h-3.5 text-orange-500" />
                <span className="flex-1 text-left">Noter chaque plat (optionnel)</span>
                {showItemRatings
                  ? <ChevronUp className="w-4 h-4 text-gray-400" />
                  : <ChevronDown className="w-4 h-4 text-gray-400" />
                }
              </button>

              {showItemRatings && (
                <div className="mt-3 space-y-3">
                  {order.items.map((item, idx) => {
                    const itemKey = item.item_id || item.name || `item-${idx}`;
                    return (
                      <div key={idx} className="p-4 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-gray-200 transition-all">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-sm font-medium text-gray-800">
                            {item.name || 'Article'} <span className="text-gray-400 text-xs">×{item.quantity}</span>
                          </span>
                        </div>
                        <StarRating
                          rating={itemRatings[itemKey]?.rating || 0}
                          onRatingChange={(r) => handleItemRating(itemKey, r)}
                          size="sm"
                        />
                        {(itemRatings[itemKey]?.rating || 0) > 0 && (
                          <input
                            type="text"
                            placeholder="Un commentaire sur ce plat ?"
                            value={itemRatings[itemKey]?.comment || ''}
                            onChange={(e) => handleItemComment(itemKey, e.target.value)}
                            className="mt-2.5 w-full px-4 py-2.5 bg-white border-2 border-gray-100 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Commentaire général */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Partagez votre expérience..."
              maxLength={1000}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/10 hover:border-gray-200 resize-none"
            />
            <p className="text-right text-[10px] text-gray-400 mt-1">{comment.length}/1000</p>
          </div>

          {/* Anonyme */}
          <div
            className="flex items-center gap-3 p-4 bg-gray-50 border-2 border-gray-100 rounded-xl hover:border-gray-200 transition-all cursor-pointer"
            onClick={() => setIsAnonymous(!isAnonymous)}
          >
            <input type="checkbox" checked={isAnonymous} readOnly
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
            <div className="flex items-center gap-1.5">
              {isAnonymous ? <EyeOff className="w-3.5 h-3.5 text-orange-500" /> : <Eye className="w-3.5 h-3.5 text-orange-500" />}
              <span className="text-xs font-semibold text-gray-700">Publier anonymement</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-3">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all">
              Plus tard
            </button>
            <button type="button" onClick={handleSubmit}
              disabled={overallRating === 0 || isSubmitting}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                overallRating === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0'
              }`}>
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? 'Envoi...' : 'Envoyer mon avis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
