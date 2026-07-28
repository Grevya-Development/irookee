import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { sendNotificationEmail } from "@/lib/notifications";
import { formatAndValidatePhone } from "@/lib/phoneUtils";
import { profileNotificationService } from "@/lib/profileNotifications";

const GuestProfileForm = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    company: "",
    phone: "",
    message: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.full_name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.message.trim()) {
      profileNotificationService.notifyError("Please complete all required fields before submitting.");
      return;
    }

    if (!emailPattern.test(formData.email.trim())) {
      profileNotificationService.notifyError("Enter a valid email address.");
      return;
    }

    const phoneRes = formatAndValidatePhone(formData.phone);
    if (!phoneRes.isValid) {
      profileNotificationService.notifyError(phoneRes.error || "Enter a valid phone number.");
      return;
    }

    if (/^\d+$/.test(formData.company.trim())) {
      profileNotificationService.notifyError("Company name cannot be numbers only.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("guest_profiles").insert([{
        ...formData,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: phoneRes.normalized,
        company: formData.company.trim(),
        message: formData.message.trim(),
      }]);

      if (error) throw error;

      await sendNotificationEmail({
        to: formData.email.trim(),
        subject: "We received your Irookee expert application",
        eventType: "expert_application_submitted",
        html: `<p>Thanks for applying to become an Irookee expert.</p><p>Your application has been submitted for review.</p>`,
      });

      profileNotificationService.notifySuccess("profile", "✓ Your profile application has been submitted!");
      navigate("/");
    } catch (error) {
      profileNotificationService.notifyError(error, "Failed to submit profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium mb-2">
          Full Name
        </label>
        <Input
          id="full_name"
          name="full_name"
          value={formData.full_name}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium mb-2">
          Company
        </label>
        <Input
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-2">
          Phone Number
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Message
        </label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Profile"
        )}
      </Button>
    </form>
  );
};

export default GuestProfileForm;
