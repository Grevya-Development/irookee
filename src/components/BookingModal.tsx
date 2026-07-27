import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Expert } from "@/types/speaker";
import { track } from "@/lib/analytics";
import { useNavigate } from "react-router-dom";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { SessionFormatSelector } from "@/components/booking/SessionFormatSelector";
import { CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { buildBookingTimeFields, formatZonedBookingTime } from "@/lib/bookingUtils";
import { notifyBookingEvent } from "@/lib/notifications";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  speaker: Expert;
}

const BookingModal = ({ isOpen, onClose, speaker }: BookingModalProps) => {
  const { user, profile, loading: authLoading } = useAuth();
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
      navigate("/auth?redirect=/experts");
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
      // Generate a real Jitsi Meet link (free, no signup, works instantly)
      const roomId = `irookee-${crypto.randomUUID().slice(0, 8)}`;
      const generatedMeetingLink = `https://meet.jit.si/${roomId}`;

      // Prepend session format to notes
      const formattedNotes = notes
        ? `[Format: ${sessionFormat}] ${notes}`
        : `[Format: ${sessionFormat}]`;

      // Check for overlapping bookings in public.expertise_bookings
      const scheduledStart = new Date(selectedDateTime);
      const scheduledEnd = new Date(scheduledStart.getTime() + selectedDuration * 60 * 1000);

      // Query database for overlapping active bookings
      const { data: conflicts, error: conflictErr } = await supabase
        .from("expertise_bookings")
        .select("scheduled_at, event_date, duration_minutes, duration_hours, status")
        .eq("expert_id", speaker.id)
        .in("status", ["pending", "confirmed", "in_progress"]);

      if (conflictErr) throw conflictErr;

      // We also check legacy bookings table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let legacyConflicts: any[] = [];
      try {
        const { data: legacyData } = await supabase
          .from("bookings")
          .select("scheduled_at, duration_minutes, status")
          .eq("expert_id", speaker.id)
          .in("status", ["pending", "confirmed", "in_progress"]);
        if (legacyData) legacyConflicts = legacyData;
      } catch (e) {
        console.warn("Failed to check legacy conflicts:", e);
      }

      const allConflicts = [...(conflicts || []), ...legacyConflicts];
      const hasOverlap = allConflicts.some((booking) => {
        const startVal = booking.scheduled_at || booking.event_date;
        if (!startVal) return false;
        const bStart = new Date(startVal);
        if (Number.isNaN(bStart.getTime())) return false;
        const bDuration = Number(booking.duration_minutes) || Number(booking.duration_hours || 0) * 60 || 60;
        const bEnd = new Date(bStart.getTime() + bDuration * 60 * 1000);
        
        return scheduledStart < bEnd && bStart < scheduledEnd;
      });

      if (hasOverlap) {
        toast({
          title: "Time Slot Unavailable",
          description: "This time slot is already booked. Please choose another slot.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const customerName = user.user_metadata?.full_name || profile?.full_name || user.email?.split("@")[0] || "User";
      const customerEmail = user.email || "";

      // Ensure profile exists in profiles table to satisfy foreign key constraints
      const { error: profileUpsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: customerEmail,
          full_name: customerName,
          user_type: profile?.user_type || 'consumer',
          updated_at: new Date().toISOString(),
        } as never);

      if (profileUpsertError) {
        console.error("SUPABASE PROFILE UPSERT ERROR:", profileUpsertError);
      }

      const bookingPayload = {
        expert_id: speaker.id,
        consumer_id: user.id,
        user_id: user.id,
        event_name: `Session with ${speaker.name}`,
        customer_name: customerName,
        customer_email: customerEmail,
        ...buildBookingTimeFields(selectedDateTime, selectedDuration),
        total_amount: 0,
        platform_fee: 0,
        expert_payout: 0,
        consumer_notes: formattedNotes,
        notes: formattedNotes,
        status: "confirmed",
        meeting_link: generatedMeetingLink,
      };

      const { data: booking, error } = await supabase
        .from("expertise_bookings")
        .insert(bookingPayload as never)
        .select("id")
        .single();

      if (error) {
        console.error("SUPABASE BOOKING INSERT FULL ERROR OBJECT:", error);
        throw error;
      }

      await notifyBookingEvent({
        bookingId: booking?.id,
        eventType: "booking_created",
        userId: user.id,
        userEmail: user.email,
        expertUserId: speaker.user_id,
        expertEmail: (speaker as Expert & { email?: string | null }).email,
        expertName: speaker.name,
        customerName: customerName,
        scheduledAt: selectedDateTime,
        durationMinutes: selectedDuration,
        meetingLink: generatedMeetingLink,
      });

      setMeetingLink(generatedMeetingLink);
      setBookingSuccess(true);
      track("booking_submitted", {
        expert_id: speaker.id,
        expert_name: speaker.name,
        session_format: sessionFormat,
        duration_minutes: selectedDuration,
      });
      toast({
        title: "Session Booked!",
        description: `Your session with ${speaker.name} has been confirmed.`,
      });
    } catch (error: unknown) {
      console.error("SUPABASE BOOKING CATCH ERROR OBJECT:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errObj = error as any;
      const mainMsg = errObj?.message || (error instanceof Error ? error.message : String(error));
      const codeStr = errObj?.code ? ` [Code: ${errObj.code}]` : "";
      const hintStr = errObj?.hint ? ` (${errObj.hint})` : "";
      const detailStr = errObj?.details ? ` - ${errObj.details}` : "";

      toast({
        title: `Booking Failed${codeStr}`,
        description: `${mainMsg}${hintStr}${detailStr}`,
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

  if (authLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Checking authentication state...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to Book</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Please log in to book a session.</p>
            <Button onClick={() => navigate("/auth?redirect=/experts")}>Sign In</Button>
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
              <strong className="text-foreground">{selectedDateTime && formatZonedBookingTime(selectedDateTime)}</strong>
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
