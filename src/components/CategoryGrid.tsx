import React from 'react';
import { Sparkles, Code, TrendingUp, Cpu, Palette, LineChart, ShieldCheck, HeartHandshake } from 'lucide-react';
import { motion } from 'framer-motion';

const categories = [
  { icon: Cpu, name: 'AI & Machine Learning', count: '120+ Experts', color: 'from-blue-500/20 to-indigo-500/20 text-blue-400' },
  { icon: Code, name: 'Software Architecture', count: '95+ Experts', color: 'from-purple-500/20 to-pink-500/20 text-purple-400' },
  { icon: TrendingUp, name: 'Growth & Marketing', count: '80+ Experts', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400' },
  { icon: LineChart, name: 'Venture Capital', count: '65+ Experts', color: 'from-amber-500/20 to-orange-500/20 text-amber-400' },
  { icon: Palette, name: 'Product Design', count: '75+ Experts', color: 'from-rose-500/20 to-red-500/20 text-rose-400' },
  { icon: ShieldCheck, name: 'Cybersecurity', count: '50+ Experts', color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400' },
  { icon: HeartHandshake, name: 'Executive Coaching', count: '85+ Experts', color: 'from-violet-500/20 to-purple-500/20 text-violet-400' },
  { icon: Sparkles, name: 'Web3 & Crypto', count: '40+ Experts', color: 'from-indigo-500/20 to-sky-500/20 text-indigo-400' },
];

export const CategoryGrid: React.FC = () => {
  return (
    <section className="py-20 bg-slate-950/50 backdrop-blur-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Explore Advisory Domains
          </h2>
          <p className="text-slate-400 text-lg">
            Connect directly with verified domain specialists across key technology and business industries.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100 group-hover:text-blue-400 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-sm text-slate-400 mt-1">{cat.count}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
