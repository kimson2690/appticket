import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Pause, Play } from 'lucide-react';

interface Advertisement {
  id: number;
  title: string;
  description: string | null;
  media_type: 'image' | 'video';
  media_url: string;
  link_url: string | null;
  status: 'active' | 'inactive';
  display_order: number;
}

const AdSlider: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  const baseUrl = 'http://localhost:8001/api';

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const res = await fetch(`${baseUrl}/advertisements/active`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setAds(data.data);
      }
    } catch (err) {
      console.error('Erreur chargement publicités:', err);
    } finally {
      setLoading(false);
    }
  };

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  }, [ads.length]);

  // Auto-slide every 5 seconds for images, pause for videos
  useEffect(() => {
    if (ads.length <= 1 || isPaused) return;
    const currentAd = ads[currentIndex];
    if (currentAd?.media_type === 'video') return;

    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [ads, currentIndex, isPaused, goNext]);

  if (loading || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 group">
      {/* Media */}
      <div className="relative w-full h-[200px] sm:h-[220px] md:h-[250px] lg:h-[280px]">
        {currentAd.media_type === 'image' ? (
          <img
            src={currentAd.media_url}
            alt={currentAd.title}
            className="w-full h-full object-cover transition-opacity duration-500"
          />
        ) : (
          <video
            key={currentAd.id}
            src={currentAd.media_url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            onEnded={goNext}
          />
        )}

        {/* Gradient overlay bottom */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />

        {/* Title + description */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          <div className="flex-1 mr-4">
            <h3 className="text-white font-bold text-lg leading-tight drop-shadow-lg">
              {currentAd.title}
            </h3>
            {currentAd.description && (
              <p className="text-white/80 text-sm mt-0.5 line-clamp-1 drop-shadow">
                {currentAd.description}
              </p>
            )}
          </div>
          {currentAd.link_url && (
            <a
              href={currentAd.link_url}
              target="_blank"
              rel="noreferrer"
              className="flex-shrink-0 flex items-center space-x-1 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/30 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>En savoir plus</span>
            </a>
          )}
        </div>

        {/* Navigation arrows (visible on hover) */}
        {ads.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Pause/Play button */}
        {ads.length > 1 && (
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Dot indicators */}
      {ads.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 z-10">
          {ads.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdSlider;
