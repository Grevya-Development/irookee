import Navigation from "@/components/Navigation";
import GuestProfileForm from "@/components/GuestProfileForm";

const GuestProfile = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navigation />
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Guest Profile Submission
          </h1>
          <p className="text-gray-600 text-center mb-12">
            Please fill out the form below to submit your profile for review.
            We'll get back to you shortly.
          </p>
          <GuestProfileForm />
        </div>
      </div>
    </div>
  );
};

export default GuestProfile;