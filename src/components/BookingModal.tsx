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
import { CheckCircle2, Copy, Sparkles, Calendar, Clock, Video, Loader2 } from "lucide-react";
import { buildBookingTimeFields, formatZonedBookingTime } from "@/lib/bookingUtils";
import { notifyBookingEvent } from "@/lib/notifications";
import { ensureUserProfileExists } from "@/lib/userUtils";
import { motion, AnimatePresence } from "framer-motion";
import { scaleIn } from "@/lib/motion";

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
    if (isSubmitting) return;

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
      const { customerName, customerEmail } = await ensureUserProfileExists(user, profile);
      const roomId = `irookee-${crypto.randomUUID().slice(0, 8)}`;
      const generatedMeetingLink = `https://meet.jit.si/${roomId}`;

      const formattedNotes = notes
        ? `[Format: ${sessionFormat}] ${notes}`
        : `[Format: ${sessionFormat}]`;

      const scheduledStart = new Date(selectedDateTime);
      const scheduledEnd = new Date(scheduledStart.getTime() + selectedDuration * 60 * 1000);

      const { data: conflicts, error: conflictErr } = await supabase
        .from("expertise_bookings")
        .select("scheduled_at, event_date, duration_minutes, duration_hours, status")
        .eq("expert_id", speaker.id)
        .in("status", ["pending", "confirmed", "in_progress"]);

      if (conflictErr) throw conflictErr;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let legacyConflicts: any[] = [];
      const { data: legacyData, error: legacyErr } = await supabase
        .from("bookings")
        .select("scheduled_at, duration_minutes, status")
        .eq("speaker_id", speaker.id)
        .in("status", ["pending", "confirmed", "in_progress"]);
      if (legacyErr) {
        console.error("Failed to check legacy conflicts:", legacyErr);
        throw legacyErr;
      }
      if (legacyData) legacyConflicts = legacyData;

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
        console.error("SUPABASE BOOKING INSERT ERROR:", error);
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
      console.error("SUPABASE BOOKING CATCH ERROR:", error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errObj = error as any;
      const mainMsg = errObj?.message || (error instanceof Error ? error.message : String(error || "Unknown error occurred"));

      toast({
        title: "Booking Failed",
        description: mainMsg,
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
        <DialogContent className="max-w-md glass-panel rounded-2xl p-6">
          <div className="text-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Checking session...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md glass-panel rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Sign in to Book</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <p className="text-sm text-muted-foreground">Please sign in to confirm your session schedule with {speaker.name}.</p>
            <Button size="lg" className="w-full font-bold" onClick={() => navigate("/auth?redirect=/experts")}>
              Sign In to Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto glass-panel rounded-2xl p-6 sm:p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">
            {bookingSuccess ? (
              <>
                <Sparkles className="h-6 w-6 text-indigo-500" />
                Session Confirmed!
              </>
            ) : (
              `Book 1-on-1 Session`
            )}
          </DialogTitle>
          {!bookingSuccess && (
            <p className="text-xs text-muted-foreground mt-1">
              Selecting date & slot for <strong className="text-foreground">{speaker.name}</strong>
            </p>
          )}
        </DialogHeader>

        {bookingSuccess ? (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="show"
            className="text-center py-6 space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/20">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground">You're All Set!</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your 1-on-1 session with <strong className="text-foreground">{speaker.name}</strong> is scheduled for:
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-foreground font-bold text-sm">
                <Calendar className="h-4 w-4 text-indigo-500" />
                {selectedDateTime && formatZonedBookingTime(selectedDateTime)}
              </div>
            </div>

            {meetingLink && (
              <div className="glass-card rounded-2xl p-4 text-left space-y-2 border-indigo-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" /> HD Video Meeting Link
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 underline truncate flex-1"
                  >
                    {meetingLink}
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 h-8 px-2"
                    onClick={() => {
                      navigator.clipboard.writeText(meetingLink);
                      toast({ title: "Copied!", description: "Meeting link copied to clipboard." });
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" className="flex-1 font-semibold" onClick={handleClose}>
                Close Window
              </Button>
              <Button className="flex-1 font-bold shadow-md" onClick={() => { handleClose(); navigate('/dashboard'); }}>
                Go to Dashboard
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <BookingCalendar
              expertId={speaker.id}
              onDateTimeSelect={handleDateTimeSelect}
            />

            {selectedDateTime && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80"
              >
                <SessionFormatSelector
                  value={sessionFormat}
                  onChange={setSessionFormat}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-sm font-semibold">Discussion Topic / Questions (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Briefly describe what you'd like to ask or get guidance on..."
                    rows={3}
                    className="rounded-xl"
                  />
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-900 dark:text-indigo-300 text-xs flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span><strong>100% Free Platform Session</strong> — Instant video link will be generated upon confirmation.</span>
                </div>

                <Button
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  size="xl"
                  className="w-full font-bold shadow-lg"
                >
                  Confirm & Reserve Time Slot
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
