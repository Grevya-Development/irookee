import React from 'react';
import { CountUp } from '@/components/ui/CountUp';

export const StatsSection: React.FC = () => {
  return (
    <section className="py-16 bg-slate-900/30 border-y border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-black text-white">
              <CountUp end={500} suffix="+" />
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400 mt-2 font-medium">Verified Experts</p>
          </div>
          <div>
            <p className="text-4xl font-black text-white">
              <CountUp end={12000} suffix="+" />
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400 mt-2 font-medium">Minutes Consulted</p>
          </div>
          <div>
            <p className="text-4xl font-black text-white">
              <CountUp end={99} suffix="%" />
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400 mt-2 font-medium">Satisfaction Rate</p>
          </div>
          <div>
            <p className="text-4xl font-black text-white">
              <CountUp end={4.9} decimals={1} />
            </p>
            <p className="text-xs uppercase tracking-wider text-slate-400 mt-2 font-medium">Average Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
};
