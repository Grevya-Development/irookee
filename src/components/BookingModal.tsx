
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Expert } from "@/types/speaker";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  speaker: Expert;
}

const BookingModal = ({ isOpen, onClose, speaker }: BookingModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: "",
    duration: "",
    notes: "",
    contactEmail: user?.email || "",
    contactPhone: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make a booking.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create booking in database
      const { error } = await supabase.from('bookings').insert({
        organizer_id: user.id,
        event_name: formData.eventName,
        event_date: new Date(formData.eventDate).toISOString(),
        duration_hours: parseFloat(formData.duration) || 1,
        total_amount: speaker.hourly_rate * (parseFloat(formData.duration) || 1),
        customer_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
        customer_email: formData.contactEmail,
        customer_phone: formData.contactPhone,
        notes: formData.notes,
        currency: speaker.currency || 'USD',
        status: 'pending'
      });

      if (error) throw error;

      toast({
        title: "Booking Request Sent!",
        description: `Your booking request for ${speaker.name} has been submitted. We'll contact you shortly.`,
      });

      onClose();
      setFormData({
        eventName: "",
        eventDate: "",
        duration: "",
        notes: "",
        contactEmail: user?.email || "",
        contactPhone: ""
      });
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: "Failed to submit booking request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Authentication Required</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Please log in to make a booking request.
            </p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book {speaker.name}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="eventName">Event Name *</Label>
            <Input
              id="eventName"
              name="eventName"
              value={formData.eventName}
              onChange={handleInputChange}
              required
              placeholder="e.g., Tech Conference 2024"
            />
          </div>

          <div>
            <Label htmlFor="eventDate">Event Date *</Label>
            <Input
              id="eventDate"
              name="eventDate"
              type="datetime-local"
              value={formData.eventDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="duration">Duration (hours) *</Label>
            <Input
              id="duration"
              name="duration"
              type="number"
              min="0.5"
              step="0.5"
              value={formData.duration}
              onChange={handleInputChange}
              required
              placeholder="e.g., 2"
            />
          </div>

          <div>
            <Label htmlFor="contactEmail">Your Email *</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleInputChange}
              required
              placeholder="your@email.com"
            />
          </div>

          <div>
            <Label htmlFor="contactPhone">Phone Number</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={handleInputChange}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any special requirements or additional information..."
              rows={3}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Estimated Cost:</span>
              <span className="font-semibold">
                ${(speaker.hourly_rate * (parseFloat(formData.duration) || 1)).toFixed(2)} {speaker.currency}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ${speaker.hourly_rate}/hour × {formData.duration || 1} hours
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
