import { motion } from "framer-motion";
import { Users, Calendar, Star, Globe } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "1,000+",
    label: "Expert Speakers",
    description: "From various industries"
  },
  {
    icon: Calendar,
    value: "5,000+",
    label: "Events Completed",
    description: "Successfully delivered"
  },
  {
    icon: Star,
    value: "4.9/5",
    label: "Average Rating",
    description: "From event organizers"
  },
  {
    icon: Globe,
    value: "50+",
    label: "Countries",
    description: "Global presence"
  }
];

const StatsSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">Our Impact in Numbers</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transforming events and empowering speakers across the globe
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center p-6 rounded-lg bg-gray-50"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-purple-100">
                <stat.icon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
              <h4 className="font-semibold text-gray-800 mb-1">{stat.label}</h4>
              <p className="text-sm text-gray-600">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;