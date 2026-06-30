import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

type PreferenceState = {
  email_booking_confirmed: boolean;
  email_expert_application: boolean;
  email_expert_approved: boolean;
  in_app_notifications: boolean;
};

const defaultPreferences: PreferenceState = {
  email_booking_confirmed: true,
  email_expert_application: true,
  email_expert_approved: true,
  in_app_notifications: true,
};

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: user?.email || "",
    phone: "",
    company: "",
  });
  const [preferences, setPreferences] = useState<PreferenceState>(defaultPreferences);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        setLoading(false);
        navigate("/auth");
        return;
      }

      setLoading(true);

      const [{ data: profile }, { data: userProfile }, { data: prefData }] = await Promise.all([
        supabase.from("profiles").select("full_name, email, phone").eq("id", user.id).maybeSingle(),
        supabase.from("user_profiles").select("company, phone, full_name, email").eq("user_id", user.id).maybeSingle(),
        supabase.from("notification_preferences" as never).select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      setFormData({
        full_name: userProfile?.full_name || profile?.full_name || "",
        email: userProfile?.email || profile?.email || user.email || "",
        phone: userProfile?.phone || profile?.phone || "",
        company: userProfile?.company || "",
      });

      if (prefData) {
        setPreferences({
          email_booking_confirmed: Boolean((prefData as PreferenceState).email_booking_confirmed),
          email_expert_application: Boolean((prefData as PreferenceState).email_expert_application),
          email_expert_approved: Boolean((prefData as PreferenceState).email_expert_approved),
          in_app_notifications: Boolean((prefData as PreferenceState).in_app_notifications),
        });
      }

      setLoading(false);
    };

    loadSettings();
  }, [navigate, user]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneDigits = formData.phone.replace(/\D/g, "");

    if (!formData.full_name.trim()) nextErrors.full_name = "Name is required.";
    if (!emailPattern.test(formData.email.trim())) nextErrors.email = "Enter a valid email address.";
    if (formData.phone.trim() && phoneDigits.length < 10) nextErrors.phone = "Enter a valid phone number.";
    if (formData.company.trim() && /^\d+$/.test(formData.company.trim())) nextErrors.company = "Company name cannot be numbers only.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !validate()) return;

    setSaving(true);

    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
        });

      if (profileError) throw profileError;

      const userProfilePayload = {
        user_id: user.id,
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        company: formData.company.trim() || null,
      };

      const { data: existingUserProfile, error: existingUserProfileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingUserProfileError) throw existingUserProfileError;

      const { error: userProfileError } = existingUserProfile
        ? await supabase
            .from("user_profiles")
            .update(userProfilePayload)
            .eq("id", existingUserProfile.id)
        : await supabase
            .from("user_profiles")
            .insert(userProfilePayload);

      if (userProfileError) throw userProfileError;

      const { error: preferencesError } = await supabase
        .from("notification_preferences" as never)
        .upsert({
          user_id: user.id,
          ...preferences,
        } as never);

      if (preferencesError) throw preferencesError;

      toast({ title: "Settings saved", description: "Your settings have been updated." });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "Unable to save settings",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    const confirmed = window.confirm("Delete your Irookee account permanently?");
    if (!confirmed) return;

    setDeleting(true);

    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;

      await signOut();
      toast({ title: "Account deleted", description: "Your account has been deleted." });
      navigate("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast({
        title: "Unable to delete account",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto max-w-3xl px-4 pt-24 pb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile, notifications, and account.</p>
        </div>

        <form onSubmit={saveSettings} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>These details are used across your Irookee account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))} />
                {errors.full_name && <p className="mt-1 text-sm text-destructive">{errors.full_name}</p>}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
                {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={formData.company} onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))} />
                {errors.company && <p className="mt-1 text-sm text-destructive">{errors.company}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose the key events you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["email_booking_confirmed", "Booking confirmation emails"],
                ["email_expert_application", "Expert application emails"],
                ["email_expert_approved", "Expert approval emails"],
                ["in_app_notifications", "In-app notifications"],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Label htmlFor={key}>{label}</Label>
                  <Switch
                    id={key}
                    checked={preferences[key as keyof PreferenceState]}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, [key]: checked }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            <Button type="button" variant="destructive" onClick={deleteAccount} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
