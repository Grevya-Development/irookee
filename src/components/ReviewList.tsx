import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ReviewItem {
  id: string;
  rating: number | null;
  comment: string | null;
  created_at: string;
  reviewer_id: string | null;
  reviewer_name: string;
}

interface ReviewListProps {
  expertId: string;
}

const ReviewList = ({ expertId }: ReviewListProps) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [expertId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer_id")
        .eq("speaker_id", expertId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const reviewsData = data || [];

      // Fetch reviewer names from profiles
      const reviewerIds = reviewsData
        .map((r) => r.reviewer_id)
        .filter((id): id is string => id !== null);

      let profilesMap: Record<string, string> = {};
      if (reviewerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", reviewerIds);

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p.full_name || "Anonymous User";
            return acc;
          }, {} as Record<string, string>);
        }
      }

      const enrichedReviews: ReviewItem[] = reviewsData.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        reviewer_id: r.reviewer_id,
        reviewer_name: r.reviewer_id
          ? profilesMap[r.reviewer_id] || "Anonymous User"
          : "Anonymous User",
      }));

      setReviews(enrichedReviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number | null) => {
    const value = rating || 0;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border rounded-lg p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderStars(review.rating)}
              {review.rating && (
                <span className="text-sm font-medium">{review.rating}/5</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          {review.comment && (
            <p className="text-sm text-foreground">{review.comment}</p>
          )}
          <p className="text-xs text-muted-foreground">{review.reviewer_name}</p>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
