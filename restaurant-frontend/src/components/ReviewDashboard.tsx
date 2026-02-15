import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, MessageSquare, Utensils, Truck, Users, BarChart3, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';
import { apiService } from '../services/api';
import StarRating from './StarRating';

interface ReviewItem {
  menu_item_name: string;
  rating: number;
  comment?: string;
}

interface Review {
  id: number;
  order_id: string;
  employee_name: string;
  overall_rating: number;
  food_rating: number | null;
  service_rating: number | null;
  comment: string | null;
  is_anonymous: boolean;
  items: ReviewItem[];
  created_at: string;
}

interface ReviewStats {
  total_reviews: number;
  avg_overall: number;
  avg_food: number;
  avg_service: number;
  rating_distribution: Record<number, number>;
  top_items: { menu_item_name: string; avg_rating: number; review_count: number }[];
  monthly_trend: { month: string; avg_rating: number; count: number }[];
  recent_reviews: Review[];
}

const ReviewDashboard: React.FC = () => {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReview, setExpandedReview] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, reviewsData] = await Promise.all([
        apiService.getRestaurantReviewStats(),
        apiService.getRestaurantReviews(),
      ]);
      setStats(statsData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Erreur chargement avis:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getMonthLabel = (month: string) => {
    const [year, m] = month.split('-');
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${months[parseInt(m) - 1]} ${year.slice(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des avis...</p>
        </div>
      </div>
    );
  }

  const totalReviews = stats?.total_reviews || 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Avis & Notations</h1>
        <p className="text-gray-600">Consultez les avis de vos clients et suivez votre satisfaction</p>
      </div>

      {totalReviews === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun avis pour le moment</h3>
          <p className="text-gray-500">Les avis des employés apparaîtront ici après leurs commandes.</p>
        </div>
      ) : (
        <>
          {/* Cartes statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Note globale */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-amber-700">Note globale</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats?.avg_overall?.toFixed(1)}</p>
              <p className="text-xs text-gray-500 mt-1">{totalReviews} avis</p>
            </div>

            {/* Nourriture */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-semibold text-gray-600">Nourriture</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats?.avg_food ? stats.avg_food.toFixed(1) : '—'}</p>
              <StarRating rating={stats?.avg_food || 0} readonly size="sm" />
            </div>

            {/* Service */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-semibold text-gray-600">Service</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stats?.avg_service ? stats.avg_service.toFixed(1) : '—'}</p>
              <StarRating rating={stats?.avg_service || 0} readonly size="sm" />
            </div>

            {/* Total avis */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-semibold text-gray-600">Total avis</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalReviews}</p>
              <p className="text-xs text-gray-500 mt-1">depuis le début</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Distribution des notes */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-semibold text-gray-900">Distribution</h3>
              </div>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = stats?.rating_distribution?.[rating] || 0;
                  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12">
                        <span className="text-sm font-medium text-gray-700">{rating}</span>
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </div>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top plats */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ThumbsUp className="w-5 h-5 text-green-500" />
                <h3 className="text-base font-semibold text-gray-900">Top plats</h3>
              </div>
              {stats?.top_items && stats.top_items.length > 0 ? (
                <div className="space-y-3">
                  {stats.top_items.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-amber-100 text-amber-700' :
                          idx === 1 ? 'bg-gray-100 text-gray-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-600' :
                          'bg-gray-50 text-gray-500'
                        }`}>{idx + 1}</span>
                        <span className="text-sm font-medium text-gray-800 truncate">{item.menu_item_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold text-gray-700">{Number(item.avg_rating).toFixed(1)}</span>
                        <span className="text-[10px] text-gray-400">({item.review_count})</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Pas encore de notation par plat</p>
              )}
            </div>

            {/* Évolution mensuelle */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-semibold text-gray-900">Évolution</h3>
              </div>
              {stats?.monthly_trend && stats.monthly_trend.length > 0 ? (
                <div className="space-y-3">
                  {stats.monthly_trend.map((month, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 w-16">{getMonthLabel(month.month)}</span>
                      <div className="flex-1 mx-3">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                            style={{ width: `${(Number(month.avg_rating) / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-semibold text-gray-700">{Number(month.avg_rating).toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Pas encore assez de données</p>
              )}
            </div>
          </div>

          {/* Liste des avis */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-semibold text-gray-900">Tous les avis</h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-600 rounded-full">{reviews.length}</span>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {reviews.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400">Aucun avis reçu</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-orange-600">
                              {review.is_anonymous ? '?' : (review.employee_name || 'E').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {review.is_anonymous ? 'Anonyme' : review.employee_name}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                          </div>
                        </div>

                        <div className="ml-12">
                          <StarRating rating={review.overall_rating} readonly size="sm" />

                          {review.comment && (
                            <p className="text-sm text-gray-600 mt-2">"{review.comment}"</p>
                          )}

                          {/* Détails des notes */}
                          <div className="flex items-center gap-4 mt-2">
                            {review.food_rating && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Utensils className="w-3 h-3" /> {review.food_rating}/5
                              </span>
                            )}
                            {review.service_rating && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <Truck className="w-3 h-3" /> {review.service_rating}/5
                              </span>
                            )}
                          </div>

                          {/* Avis par plat (expandable) */}
                          {review.items && review.items.length > 0 && (
                            <div className="mt-2">
                              <button
                                onClick={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
                              >
                                {expandedReview === review.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {review.items.length} plat{review.items.length > 1 ? 's' : ''} noté{review.items.length > 1 ? 's' : ''}
                              </button>
                              {expandedReview === review.id && (
                                <div className="mt-2 space-y-1.5">
                                  {review.items.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                                      <span className="text-xs font-medium text-gray-700">{item.menu_item_name}</span>
                                      <div className="flex items-center gap-1">
                                        <StarRating rating={item.rating} readonly size="sm" />
                                        {item.comment && (
                                          <span className="text-[10px] text-gray-400 ml-2 italic max-w-[150px] truncate">"{item.comment}"</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Badge note */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                        review.overall_rating >= 4 ? 'bg-green-50 text-green-600' :
                        review.overall_rating >= 3 ? 'bg-yellow-50 text-yellow-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        <span className="text-lg font-bold">{review.overall_rating}</span>
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewDashboard;
