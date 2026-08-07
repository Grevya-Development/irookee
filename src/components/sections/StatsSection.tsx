import { motion } from "framer-motion";
import { Users, Calendar, Star, Globe } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "1,000+",
    label: "Verified Experts",
    description: "Vetted industry leaders & mentors",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: Calendar,
    value: "5,000+",
    label: "Sessions Delivered",
    description: "1-on-1 advice & consultations",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Star,
    value: "4.9/5",
    label: "Satisfaction Rate",
    description: "From over 2,500 reviews",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Globe,
    value: "50+",
    label: "Countries Reached",
    description: "Global community & insights",
    gradient: "from-emerald-500 to-teal-500",
  }
];

const StatsSection = () => {
  return (
    <section className="py-20 relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/50">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="text-center mb-16 space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            Impact Metrics
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Empowering Knowledge Exchange Worldwide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base">
            Connecting ambitious minds directly with world-class practitioners.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className="glass-card p-6 rounded-2xl relative overflow-hidden text-center group border-slate-200/80 dark:border-slate-800/80"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={`inline-flex items-center justify-center w-12 h-12 mb-4 rounded-xl bg-gradient-to-tr ${stat.gradient} text-white shadow-md group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>

              <h3 className="text-3xl sm:text-4xl font-black text-foreground mb-1 tracking-tight">
                {stat.value}
              </h3>
              <h4 className="font-bold text-sm text-foreground mb-1">{stat.label}</h4>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;