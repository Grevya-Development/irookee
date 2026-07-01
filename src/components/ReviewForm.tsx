import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReviewFormProps {
  bookingId: string;
  expertId: string;
  expertName: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: () => void;
}

const ReviewForm = ({
  bookingId,
  expertId,
  expertName,
  isOpen,
  onClose,
  onSubmit,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to leave a review.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        reviewer_id: user.id,
        speaker_id: expertId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Review submitted!",
        description: `Thank you for reviewing ${expertName}.`,
      });

      setRating(0);
      setComment("");
      onClose();
      onSubmit?.();
    } catch (error) {
      console.error("Review submit error:", error);
      toast({
        title: "Failed to submit review",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate your session with {expertName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <Label className="mb-2 block">Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {rating === 1
                  ? "Poor"
                  : rating === 2
                  ? "Fair"
                  : rating === 3
                  ? "Good"
                  : rating === 4
                  ? "Very Good"
                  : "Excellent"}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="review-comment">
              Your Review{" "}
              <span className="text-muted-foreground font-normal">
                (optional, min 20 chars recommended)
              </span>
            </Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this expert..."
              rows={4}
              className="mt-1"
            />
            {comment.length > 0 && comment.length < 20 && (
              <p className="text-xs text-amber-600 mt-1">
                Consider writing at least 20 characters for a helpful review (
                {comment.length}/20)
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewForm;
