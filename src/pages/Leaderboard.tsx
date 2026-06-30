import Navigation from "@/components/Navigation";
import ExpertGrid from "@/components/ExpertGrid";

const Leaderboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Expert Leaderboard</h1>
          <p className="text-muted-foreground">Top-rated experts by rating and sessions.</p>
        </div>
        <ExpertGrid limit={20} />
      </div>
    </div>
  );
};

export default Leaderboard;
