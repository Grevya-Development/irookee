import React from 'react';
import { Star, ShieldCheck, Video, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookingModal } from './BookingModal';
import { Link } from 'react-router-dom';

interface ExpertCardProps {
  id: string;
  name: string;
  title: string;
  company: string;
  rating: number;
  reviews_count: number;
  hourly_rate: number;
  image_url: string;
  expertise: string[];
  verified?: boolean;
}

export const ExpertCard: React.FC<ExpertCardProps> = ({
  id,
  name,
  title,
  company,
  rating,
  reviews_count,
  hourly_rate,
  image_url,
  expertise,
  verified = true
}) => {
  return (
    <div className="group relative rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between overflow-hidden">
      <div className="p-6 space-y-4">
        {/* Header with avatar & rating */}
        <div className="flex items-start justify-between gap-4">
          <div className="relative">
            <img
              src={image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
              alt={name}
              className="w-16 h-16 rounded-2xl object-cover border border-slate-700/50 group-hover:border-blue-500/50 transition-colors"
            />
            {verified && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 shadow-md">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-slate-400 font-normal">({reviews_count})</span>
          </div>
        </div>

        {/* Info */}
        <div>
          <Link to={`/expert/${id}`} className="hover:underline">
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
              {name}
            </h3>
          </Link>
          <p className="text-sm text-slate-400 font-medium">{title} {company && `at ${company}`}</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {expertise.slice(0, 3).map((item) => (
            <Badge key={item} variant="secondary" className="bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border-slate-700/50 text-xs">
              {item}
            </Badge>
          ))}
          {expertise.length > 3 && (
            <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
              +{expertise.length - 3}
            </Badge>
          )}
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="p-4 bg-slate-950/40 border-t border-slate-800/60 flex items-center justify-between gap-3 mt-4">
        <div>
          <span className="text-xs text-slate-400 block">Rate</span>
          <span className="text-lg font-bold text-white">${hourly_rate}<span className="text-xs font-normal text-slate-400">/hr</span></span>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/expert/${id}`}>
            <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
              Profile
            </Button>
          </Link>
          <BookingModal expert={{ id, name, hourly_rate }} />
        </div>
      </div>
    </div>
  );
};
