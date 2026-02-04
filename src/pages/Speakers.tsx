
import Navigation from "@/components/Navigation";
import SpeakerGrid from "@/components/SpeakerGrid";

const Speakers = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navigation />
      <div className="container mx-auto px-4 pt-32 pb-20">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Find the Right People
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with experts, consultants, instructors, chefs, medical professionals, and specialists 
            from all walks of life who can help transform your projects and events.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">8</div>
            <div className="text-gray-600">Different Types</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">990+</div>
            <div className="text-gray-600">Total Services</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">4.8</div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">25+</div>
            <div className="text-gray-600">Expertise Areas</div>
          </div>
        </div>

        {/* People Grid with Intelligent Search */}
        <SpeakerGrid />
      </div>
    </div>
  );
};

export default Speakers;
