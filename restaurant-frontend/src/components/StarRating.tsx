import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  showValue?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 'md',
  readonly = false,
  showValue = false,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const gapClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const activeRating = hoverRating || rating;

  return (
    <div className={`flex items-center ${gapClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onRatingChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          className={`transition-all duration-150 ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          }`}
        >
          <Star
            className={`${sizeClasses[size]} transition-colors ${
              star <= activeRating
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
      {showValue && rating > 0 && (
        <span className={`font-semibold text-gray-700 ml-1 ${textClasses[size]}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
