import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Expert } from "@/types/speaker";
import { useNavigate } from "react-router-dom";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { SessionFormatSelector } from "@/components/booking/SessionFormatSelector";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  speaker: Expert;
}

const BookingModal = ({ isOpen, onClose, speaker }: BookingModalProps) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [sessionFormat, setSessionFormat] = useState("video");
  const [meetingLink, setMeetingLink] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDateTimeSelect = (dateTime: string, duration: number) => {
    setSelectedDateTime(dateTime);
    setSelectedDuration(duration);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to log in to book a session.",
        variant: "destructive",
      });
      navigate("/auth?redirect=/speakers");
      return;
    }

    if (!selectedDateTime) {
      toast({
        title: "Select a time",
        description: "Please select a date and time for your session.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a UUID-based meeting link
      const randomId = crypto.randomUUID();
      const generatedMeetingLink = `https://meet.irookee.com/${randomId}`;

      // Prepend session format to notes
      const formattedNotes = notes
        ? `[Format: ${sessionFormat}] ${notes}`
        : `[Format: ${sessionFormat}]`;

      const { error } = await supabase
        .from("expertise_bookings")
        .insert({
          expert_id: speaker.id,
          user_id: user.id,
          event_name: `Session with ${speaker.name}`,
          event_date: selectedDateTime,
          duration_hours: selectedDuration / 60,
          total_amount: 0, // Free platform
          customer_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          customer_email: user.email,
          notes: formattedNotes,
          currency: "INR",
          status: "confirmed",
          meeting_link: generatedMeetingLink,
        });

      if (error) throw error;

      setMeetingLink(generatedMeetingLink);
      setBookingSuccess(true);
      toast({
        title: "Session Booked!",
        description: `Your session with ${speaker.name} has been confirmed.`,
      });
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Booking Failed",
        description: "Failed to book session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setBookingSuccess(false);
    setSelectedDateTime(null);
    setNotes("");
    setSessionFormat("video");
    setMeetingLink(null);
    onClose();
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to Book</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Please log in to book a session.</p>
            <Button onClick={() => navigate("/auth?redirect=/speakers")}>Sign In</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bookingSuccess ? "Session Booked!" : `Book a Session with ${speaker.name}`}
          </DialogTitle>
        </DialogHeader>

        {bookingSuccess ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">You're all set!</h3>
            <p className="text-muted-foreground">
              Your free session with {speaker.name} is confirmed for{" "}
              {selectedDateTime && new Date(selectedDateTime).toLocaleString('en-IN', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
            {meetingLink && (
              <div className="bg-gray-50 border rounded-lg p-3 text-left space-y-1">
                <p className="text-sm font-medium">Meeting Link:</p>
                <div className="flex items-center gap-2">
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline break-all flex-1"
                  >
                    {meetingLink}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(meetingLink);
                      toast({ title: "Copied!", description: "Meeting link copied to clipboard." });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              Save this meeting link. If you or the expert don't show up, it will be marked as a no-show.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button variant="outline" onClick={handleClose}>Close</Button>
              <Button onClick={() => { handleClose(); navigate('/dashboard'); }}>Go to Dashboard</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <BookingCalendar
              expertId={speaker.id}
              onDateTimeSelect={handleDateTimeSelect}
            />

            {selectedDateTime && (
              <>
                <SessionFormatSelector
                  value={sessionFormat}
                  onChange={setSessionFormat}
                />

                <div>
                  <Label htmlFor="notes">Additional Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What would you like to discuss? Any specific questions?"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Free session</strong> - irookee is currently free for everyone!
                  </p>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? "Booking..." : "Confirm Booking"}
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
