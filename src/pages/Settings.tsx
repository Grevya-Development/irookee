import { useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { isCurrentUserAdmin } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Footer from '@/components/sections/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserAvatar } from '@/components/UserAvatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Camera,
  Save,
  Trash2,
  Loader2,
  AlertTriangle,
  User,
  Shield,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Bell,
  KeyRound,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatAndValidatePhone } from '@/lib/phoneUtils';
import { validateExpertiseAreas } from '@/lib/expertiseValidation';
import { profileNotificationService } from '@/lib/profileNotifications';
import Seo from '@/components/Seo';

interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  bio: string;
  avatar_url: string;
}

interface ExpertData {
  id: string;
  name: string;
  title: string;
  bio: string;
  location: string;
  company: string;
  phone: string;
  email: string;
  linkedin_url: string;
  website_url: string;
  expertise: string[];
  languages: string[];
  experience_years: number | null;
  verification_status: string;
  image_url: string | null;
}

type NotificationPreferences = {
  email_booking_confirmed: boolean;
  email_expert_application: boolean;
  email_expert_approved: boolean;
  in_app_notifications: boolean;
};

const defaultNotificationPreferences: NotificationPreferences = {
  email_booking_confirmed: true,
  email_expert_application: true,
  email_expert_approved: true,
  in_app_notifications: true,
};

const getPasswordStrength = (pass: string) => {
  if (!pass) return { score: 0, label: '', color: 'bg-slate-200 dark:bg-slate-800' };
  let score = 0;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass)) score++;
  if (/[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  switch (score) {
    case 1: return { score: 25, label: 'Weak', color: 'bg-red-500' };
    case 2: return { score: 50, label: 'Fair', color: 'bg-amber-500' };
    case 3: return { score: 75, label: 'Good', color: 'bg-indigo-500' };
    case 4: return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
    default: return { score: 15, label: 'Weak', color: 'bg-red-500' };
  }
};

export default function Settings() {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    avatar_url: '',
  });
  const [expertData, setExpertData] = useState<ExpertData | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [isExpert, setIsExpert] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const [isAdmin, setIsAdmin] = useState(false);

  // Security / Change Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isCurrentUserAdmin();
      setIsAdmin(adminStatus);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    } else if (user) {
      loadProfile();
      loadExpertProfile();
      loadNotificationPreferences();
      checkAdminStatus();
    }
  }, [user, authLoading, navigate]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setProfileData({
        full_name: data.full_name || '',
        email: data.email || user.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
      });
    } else {
      setProfileData((prev) => ({ ...prev, email: user.email || '' }));
    }
  };

  const loadExpertProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('speakers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setIsExpert(true);
      setExpertData({
        id: data.id,
        name: data.name || '',
        title: data.title || '',
        bio: data.bio || '',
        location: data.location || '',
        company: data.company || '',
        phone: data.phone || '',
        email: data.email || '',
        linkedin_url: data.linkedin_url || '',
        website_url: data.website_url || '',
        expertise: data.expertise || [],
        languages: data.languages || [],
        experience_years: data.experience_years,
        verification_status: data.verification_status || 'pending',
        image_url: data.image_url || data.profile_photo_url || null,
      });
    }
  };

  const loadNotificationPreferences = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('notification_preferences' as never)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      const prefs = data as NotificationPreferences;
      setNotificationPreferences({
        email_booking_confirmed: Boolean(prefs.email_booking_confirmed),
        email_expert_application: Boolean(prefs.email_expert_application),
        email_expert_approved: Boolean(prefs.email_expert_approved),
        in_app_notifications: Boolean(prefs.in_app_notifications),
      });
    }
  };

  const saveNotificationPreferences = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences' as never)
        .upsert({
          user_id: user.id,
          ...notificationPreferences,
        } as never);

      if (error) throw error;
      toast({ title: 'Notification Preferences Saved', description: 'Your notification settings have been updated' });
    } catch (error) {
      console.error('Notification preference save error:', error);
      toast({ title: 'Save Failed', description: 'Could not save notification preferences', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      profileNotificationService.notifyError('Please select a valid image file (PNG, JPEG, WebP, etc.).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      profileNotificationService.notifyError('Profile photo must be smaller than 5MB.');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `${user.id}/avatars/profile_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setProfileData((prev) => ({ ...prev, avatar_url: publicUrl }));

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() });

      if (profileError) throw profileError;

      if (isExpert && expertData) {
        await supabase
          .from('speakers')
          .update({ image_url: publicUrl, profile_photo_url: publicUrl })
          .eq('id', expertData.id);
        setExpertData((prev) => (prev ? { ...prev, image_url: publicUrl } : prev));
      }

      await refreshProfile();
      profileNotificationService.notifySuccess('avatar');
    } catch (error) {
      console.error('Upload error:', error);
      profileNotificationService.notifyError(error, 'Could not upload profile photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const nameRegex = /^[\p{L}\s\-'.]+$/u;
  const invalidSymbolsRegex = /[<>={}[\]/\\^%$@#*]/;
  const numericOnlyRegex = /^[0-9\s\-_, .()]+$/;

  const saveProfile = async () => {
    if (!user) return;

    const nameTrimmed = profileData.full_name.trim();
    if (!nameTrimmed) {
      profileNotificationService.notifyError('Full Name is required');
      return;
    }
    if (!nameRegex.test(nameTrimmed)) {
      profileNotificationService.notifyError('Full Name contains invalid characters or symbols');
      return;
    }
    if (numericOnlyRegex.test(nameTrimmed)) {
      profileNotificationService.notifyError('Full Name cannot be numeric-only');
      return;
    }

    const emailTrimmed = profileData.email.trim();
    if (!emailTrimmed || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailTrimmed)) {
      profileNotificationService.notifyError('Please enter a valid email address');
      return;
    }

    let phoneClean: string | null = null;
    const phoneTrimmed = profileData.phone.trim();
    if (phoneTrimmed) {
      const phoneValidation = formatAndValidatePhone(phoneTrimmed);
      if (!phoneValidation.isValid) {
        profileNotificationService.notifyError(phoneValidation.error || 'Please enter a valid phone number');
        return;
      }
      phoneClean = phoneValidation.normalized;
    }

    const bioTrimmed = profileData.bio ? profileData.bio.trim() : '';
    if (bioTrimmed) {
      if (numericOnlyRegex.test(bioTrimmed)) {
        profileNotificationService.notifyError('Bio cannot be numeric-only');
        return;
      }
      if (invalidSymbolsRegex.test(bioTrimmed)) {
        profileNotificationService.notifyError('Bio contains invalid symbols');
        return;
      }
    }

    setSaving(true);
    try {
      const cleanAvatarUrl = profileData.avatar_url?.trim() || null;
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: nameTrimmed,
        email: emailTrimmed,
        phone: phoneClean,
        bio: bioTrimmed || null,
        avatar_url: cleanAvatarUrl,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;

      if (isExpert && expertData) {
        await supabase
          .from('speakers')
          .update({ phone: phoneClean })
          .eq('id', expertData.id);
      }

      await refreshProfile();

      if (phoneClean && phoneClean !== profileData.phone) {
        setProfileData((prev) => ({ ...prev, phone: phoneClean! }));
        profileNotificationService.notifySuccess('phone');
      } else {
        profileNotificationService.notifySuccess('profile');
      }
    } catch (error) {
      console.error('Save error:', error);
      profileNotificationService.notifyError(error, 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (changingPassword) return;
    setPasswordError(null);
    setPasswordSuccess(null);

    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedNew) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (trimmedNew.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: trimmedNew });
      if (error) throw error;
      setPasswordSuccess('Password changed successfully.');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Could not update password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const saveExpertProfile = async () => {
    if (!user || !expertData) return;

    const nameTrimmed = expertData.name.trim();
    if (!nameTrimmed) {
      profileNotificationService.notifyError('Display Name is required');
      return;
    }
    if (!nameRegex.test(nameTrimmed)) {
      profileNotificationService.notifyError('Display Name contains invalid characters or symbols');
      return;
    }
    if (numericOnlyRegex.test(nameTrimmed)) {
      profileNotificationService.notifyError('Display Name cannot be numeric-only');
      return;
    }

    const titleTrimmed = expertData.title.trim();
    if (!titleTrimmed) {
      profileNotificationService.notifyError('Professional Title is required');
      return;
    }
    if (numericOnlyRegex.test(titleTrimmed)) {
      profileNotificationService.notifyError('Professional Title cannot be numeric-only');
      return;
    }
    if (invalidSymbolsRegex.test(titleTrimmed)) {
      profileNotificationService.notifyError('Professional Title contains invalid symbols');
      return;
    }

    const emailTrimmed = expertData.email.trim();
    if (!emailTrimmed || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailTrimmed)) {
      profileNotificationService.notifyError('Please enter a valid email address');
      return;
    }

    const phoneValidation = formatAndValidatePhone(expertData.phone);
    if (!phoneValidation.isValid) {
      profileNotificationService.notifyError(phoneValidation.error || 'Please enter a valid phone number');
      return;
    }
    const phoneClean = phoneValidation.normalized;

    const companyTrimmed = expertData.company.trim();
    if (companyTrimmed) {
      if (numericOnlyRegex.test(companyTrimmed)) {
        profileNotificationService.notifyError('Company name cannot be numeric-only');
        return;
      }
      if (invalidSymbolsRegex.test(companyTrimmed)) {
        profileNotificationService.notifyError('Company name contains invalid symbols');
        return;
      }
    }

    const locationTrimmed = expertData.location.trim();
    if (!locationTrimmed) {
      profileNotificationService.notifyError('Location is required');
      return;
    }
    if (numericOnlyRegex.test(locationTrimmed) || locationTrimmed.length < 2) {
      profileNotificationService.notifyError('Please enter a valid location/country');
      return;
    }
    if (invalidSymbolsRegex.test(locationTrimmed)) {
      profileNotificationService.notifyError('Location contains invalid symbols');
      return;
    }

    const bioTrimmed = expertData.bio ? expertData.bio.trim() : '';
    if (!bioTrimmed) {
      profileNotificationService.notifyError('Bio is required');
      return;
    }
    if (numericOnlyRegex.test(bioTrimmed)) {
      profileNotificationService.notifyError('Bio cannot be numeric-only');
      return;
    }
    if (invalidSymbolsRegex.test(bioTrimmed)) {
      profileNotificationService.notifyError('Bio contains invalid symbols');
      return;
    }

    if (expertData.experience_years === null || expertData.experience_years === undefined || Number.isNaN(expertData.experience_years)) {
      profileNotificationService.notifyError('Experience years is required and must be a valid number');
      return;
    }
    if (expertData.experience_years < 0 || !Number.isInteger(expertData.experience_years)) {
      profileNotificationService.notifyError('Years of experience must be a non-negative integer');
      return;
    }

    if (!expertData.languages || expertData.languages.length === 0) {
      profileNotificationService.notifyError('Please specify at least one language');
      return;
    }
    const invalidLangs = expertData.languages.some((lang) => numericOnlyRegex.test(lang) || lang.length < 2 || invalidSymbolsRegex.test(lang));
    if (invalidLangs) {
      profileNotificationService.notifyError('Please enter valid language names');
      return;
    }

    const expertiseRes = validateExpertiseAreas(expertData.expertise);
    if (!expertiseRes.isValid) {
      profileNotificationService.notifyError(expertiseRes.error || 'Please enter valid expertise names');
      return;
    }
    const cleanExpertise = expertiseRes.sanitized;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('speakers')
        .update({
          name: nameTrimmed,
          title: titleTrimmed,
          bio: bioTrimmed,
          location: locationTrimmed,
          company: companyTrimmed || null,
          phone: phoneClean,
          email: emailTrimmed,
          linkedin_url: expertData.linkedin_url ? expertData.linkedin_url.trim() : null,
          website_url: expertData.website_url ? expertData.website_url.trim() : null,
          expertise: cleanExpertise,
          topics: cleanExpertise,
          languages: expertData.languages,
          experience_years: expertData.experience_years,
        })
        .eq('id', expertData.id);

      if (error) throw error;

      setExpertData((prev) => (prev ? { ...prev, phone: phoneClean, expertise: cleanExpertise } : prev));
      profileNotificationService.notifySuccess('expertise');
    } catch (error) {
      console.error('Save error:', error);
      profileNotificationService.notifyError(error, 'Could not save expert profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc('delete_account');
      if (error) throw error;

      await supabase.auth.signOut();

      toast({ title: 'Account Deleted', description: 'Your account and profile data have been removed' });
      navigate('/');
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Delete Failed', description: 'Could not delete account. Contact support.', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="pt-24 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo title="Account Settings" description="Manage your irookee profile, notifications, security and account preferences." noindex />
      <Navigation />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 max-w-5xl flex-1">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground mb-6">Manage your personal profile, security credentials, and account details.</p>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              <User className="h-4 w-4 mr-1.5" /> Personal Info
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              <Lock className="h-4 w-4 mr-1.5" /> Security
            </TabsTrigger>
            {isExpert && (
              <TabsTrigger value="expert" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
                <Shield className="h-4 w-4 mr-1.5" /> Expert Profile
              </TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
              <Bell className="h-4 w-4 mr-1.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 text-red-600 dark:text-red-400">
              <Trash2 className="h-4 w-4 mr-1.5" /> Danger Zone
            </TabsTrigger>
          </TabsList>

          {/* Personal Profile Tab */}
          <TabsContent value="profile">
            <Card className="glass-card border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details, contact info, and profile avatar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
                  <div className="relative">
                    <UserAvatar
                      src={profileData.avatar_url}
                      name={profileData.full_name}
                      email={user.email}
                      className="h-24 w-24 ring-4 ring-white dark:ring-slate-900 shadow-md text-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 shadow-md hover:bg-indigo-700 transition-colors cursor-pointer"
                      disabled={uploading}
                      aria-label="Upload photo"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-bold text-foreground text-lg">{profileData.full_name || 'Your Name'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs font-semibold"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading...</> : 'Change Photo'}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name</Label>
                    <Input
                      value={profileData.full_name}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Your full name"
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address (Read-Only)</Label>
                    <Input value={user.email || ''} disabled className="h-11 rounded-xl bg-muted/60" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-indigo-500" /> Phone Number
                    </Label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="h-11 rounded-xl"
                    />
                    <p className="text-[11px] text-muted-foreground">Include country code for verification and booking SMS alerts.</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bio / About</Label>
                  <Textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="rounded-xl"
                  />
                </div>

                <Button onClick={saveProfile} disabled={saving} className="rounded-xl font-bold h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Save Personal Info
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security & Password Tab */}
          <TabsContent value="security">
            <Card className="glass-card border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Security & Password</CardTitle>
                    <CardDescription>Update your account password safely.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 max-w-lg">
                <form onSubmit={handleChangePassword} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="settings-new-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="settings-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        className="pr-10 h-11 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((v) => !v)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {newPassword && (
                      <div className="space-y-1 pt-1">
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${passwordStrength.color} transition-all duration-300 rounded-full`}
                            style={{ width: `${passwordStrength.score}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                          <span>Password strength: <strong className="text-foreground">{passwordStrength.label}</strong></span>
                          <span>At least 8 chars</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="settings-confirm-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="settings-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Re-enter new password"
                        className="pr-10 h-11 rounded-xl text-sm border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {passwordError && (
                    <p role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {passwordError}
                    </p>
                  )}

                  {passwordSuccess && (
                    <p role="alert" className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      {passwordSuccess}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full rounded-xl font-bold h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expert Profile Tab */}
          {isExpert && expertData && (
            <TabsContent value="expert">
              <Card className="glass-card border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Expert Profile</CardTitle>
                      <CardDescription>Update your public expert profile</CardDescription>
                    </div>
                    <Badge variant={expertData.verification_status === 'verified' ? 'default' : 'secondary'}>
                      {expertData.verification_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Unified Profile Picture Notice */}
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl border mb-4">
                    <UserAvatar
                      src={expertData.image_url || profileData.avatar_url}
                      name={expertData.name || profileData.full_name}
                      email={user.email}
                      className="h-14 w-14 ring-2 ring-primary/20"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Account & Public Expert Profile Picture
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your profile picture is synchronized between your account and your public expert profile for brand consistency.
                      </p>
                    </div>
                  </div>

                  {expertData.verification_status === 'pending' && !isAdmin && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm flex items-start gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900">Profile Under Review</p>
                        <p className="text-amber-700 mt-0.5">Your profile is currently under review. Editing is temporarily disabled until verification completes.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={expertData.name}
                        onChange={(e) => setExpertData((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Professional Title</Label>
                      <Input
                        value={expertData.title}
                        onChange={(e) => setExpertData((prev) => (prev ? { ...prev, title: e.target.value } : null))}
                        placeholder="e.g., Startup Mentor"
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Company</Label>
                      <Input
                        value={expertData.company}
                        onChange={(e) => setExpertData((prev) => (prev ? { ...prev, company: e.target.value } : null))}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={expertData.location}
                        onChange={(e) => setExpertData((prev) => (prev ? { ...prev, location: e.target.value } : null))}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={expertData.phone}
                        onChange={(e) => setExpertData((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={expertData.email}
                        onChange={(e) => setExpertData((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Years of Experience</Label>
                      <Input
                        type="number"
                        value={expertData.experience_years || ''}
                        onChange={(e) =>
                          setExpertData((prev) =>
                            prev ? { ...prev, experience_years: parseInt(e.target.value) || null } : null
                          )
                        }
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>LinkedIn URL</Label>
                      <Input
                        value={expertData.linkedin_url}
                        onChange={(e) => setExpertData((prev) => (prev ? { ...prev, linkedin_url: e.target.value } : null))}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                    <div>
                      <Label>Website URL</Label>
                      <Input
                        value={expertData.website_url}
                        onChange={(e) => setExpertData((prev) => (prev ? { ...prev, website_url: e.target.value } : null))}
                        className="mt-1"
                        disabled={expertData.verification_status === 'pending' && !isAdmin}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      value={expertData.bio}
                      onChange={(e) => setExpertData((prev) => (prev ? { ...prev, bio: e.target.value } : null))}
                      rows={4}
                      className="mt-1"
                      disabled={expertData.verification_status === 'pending' && !isAdmin}
                    />
                  </div>

                  <div>
                    <Label>Expertise Areas (comma-separated)</Label>
                    <Input
                      value={expertData.expertise.join(', ')}
                      onChange={(e) =>
                        setExpertData((prev) =>
                          prev
                            ? {
                                ...prev,
                                expertise: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              }
                            : null
                        )
                      }
                      placeholder="Startups, Marketing, Finance"
                      className="mt-1"
                      disabled={expertData.verification_status === 'pending' && !isAdmin}
                    />
                  </div>

                  <div>
                    <Label>Languages (comma-separated)</Label>
                    <Input
                      value={expertData.languages.join(', ')}
                      onChange={(e) =>
                        setExpertData((prev) =>
                          prev
                            ? {
                                ...prev,
                                languages: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              }
                            : null
                        )
                      }
                      placeholder="English, Hindi, Tamil"
                      className="mt-1"
                      disabled={expertData.verification_status === 'pending' && !isAdmin}
                    />
                  </div>

                  <Button onClick={saveExpertProfile} disabled={saving || (expertData.verification_status === 'pending' && !isAdmin)}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" /> Save Expert Profile
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="notifications">
            <Card className="glass-card border-slate-200/80 dark:border-slate-800/80 rounded-2xl">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose which Irookee updates you want to receive.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  ['email_booking_confirmed', 'Booking confirmation emails'],
                  ['email_expert_application', 'Expert application emails'],
                  ['email_expert_approved', 'Expert approval emails'],
                  ['in_app_notifications', 'In-app notifications'],
                ].map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-4 rounded-xl border p-4 bg-slate-50/60 dark:bg-slate-900/60">
                    <Label htmlFor={key} className="text-sm font-medium cursor-pointer">
                      {label}
                    </Label>
                    <Switch
                      id={key}
                      checked={notificationPreferences[key as keyof NotificationPreferences]}
                      onCheckedChange={(checked) =>
                        setNotificationPreferences((prev) => ({ ...prev, [key]: checked }))
                      }
                    />
                  </div>
                ))}
                <Button onClick={saveNotificationPreferences} disabled={saving} className="rounded-xl font-bold">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Save Notifications
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account / Danger Zone Tab */}
          <TabsContent value="account">
            <Card className="border-red-200 dark:border-red-900/50 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Danger Zone
                </CardTitle>
                <CardDescription>Irreversible actions for your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border border-red-200 dark:border-red-900/50 rounded-xl p-4 space-y-3 bg-red-50/50 dark:bg-red-950/20">
                  <h3 className="font-semibold text-red-700 dark:text-red-400">Delete Account</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Permanently delete your account and all associated data. This includes your profile,
                    {isExpert && ' expert profile, availability slots, categories,'} and all personal information. This action cannot be undone.
                  </p>
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="rounded-xl font-bold">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account Permanently?</DialogTitle>
            <DialogDescription>
              This will permanently delete your account, profile{isExpert ? ', expert profile,' : ''} and all associated data. This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl p-3">
              <p className="text-xs text-red-700 dark:text-red-300">
                Type <strong>DELETE</strong> to confirm account deletion.
              </p>
            </div>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirm('');
              }}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteConfirm !== 'DELETE' || deleting}
              className="rounded-xl font-bold"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                </>
              ) : (
                'Delete Account Forever'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
