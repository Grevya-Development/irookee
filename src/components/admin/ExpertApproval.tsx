import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  X,
  Eye,
  Loader2,
  FileText,
  Shield,
  AlertCircle,
  Search,
  BadgeCheck,
  ShieldAlert,
  Edit,
  Tag,
  Trash2,
  RotateCcw,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createInAppNotification, sendNotificationEmail } from "@/lib/notifications";
import { PREDEFINED_PROFESSIONS } from "@/lib/professions";

/** Columns that exist in the database but not yet in the generated types. */
type SuspendableSpeaker = {
  id?: string;
  user_id?: string | null;
  verification_status?: string | null;
  is_verified?: boolean | null;
  suspension_history?: unknown;
};

export interface ExpertRow {
  id: string;
  name: string;
  title: string;
  custom_profession?: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  location: string | null;
  languages: string[] | null;
  expertise: string[] | null;
  expertise_areas: string[] | null;
  experience_years: number | null;
  verification_status: string | null;
  is_verified: boolean | null;
  badges: string[] | null;
  verification_documents: Record<string, unknown> | null;
  created_at: string;
  bio: string | null;
  linkedin_url: string | null;
  image_url?: string | null;
  profile_photo_url?: string | null;
  user_id: string | null;
  suspension_reason?: string | null;
  suspended_at?: string | null;
  suspension_history?: unknown[] | null;
}

const VERIFICATION_BUCKET = "verification-documents";

const POPULAR_BADGES = [
  "Top Rated",
  "Rising Star",
  "Super Expert",
  "Industry Leader",
  "Fast Responder",
  "Client Favorite",
];

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const ExpertApproval = () => {
  const [experts, setExperts] = useState<ExpertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<ExpertRow | null>(null);
  const [filter, setFilter] = useState<'pending' | 'changes_requested' | 'verified' | 'rejected' | 'suspended' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog States for Feedback & Remap
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackAction, setFeedbackAction] = useState<'reject' | 'request_changes' | 'suspend'>('request_changes');
  const [feedbackText, setFeedbackText] = useState("");
  const [targetExpertId, setTargetExpertId] = useState<string | null>(null);

  // Remap Custom Profession State
  const [remapDialogOpen, setRemapDialogOpen] = useState(false);
  const [remapValue, setRemapValue] = useState("");

  // Add Badge State
  const [newBadgeText, setNewBadgeText] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    fetchExperts();
  }, [filter]);

  const fetchExperts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('speakers')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('verification_status', filter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Fetch error:', error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      setExperts((data || []) as ExpertRow[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDocument = async (url: string) => {
    try {
      if (!url || url.startsWith('local://')) return;

      if (/^https?:\/\//i.test(url) && !url.includes(`/${VERIFICATION_BUCKET}/`)) {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      let normalizedPath = url;
      if (url.includes("/" + VERIFICATION_BUCKET + "/")) {
        normalizedPath = url.split("/" + VERIFICATION_BUCKET + "/")[1];
      } else {
        normalizedPath = url.replace(/^\/+/, "").replace(new RegExp(`^${VERIFICATION_BUCKET}/`), "");
      }

      try {
        normalizedPath = decodeURIComponent(normalizedPath.split('?')[0]);
      } catch (decodeErr) {
        console.warn("Could not decode document URI path, using raw path:", decodeErr);
        normalizedPath = normalizedPath.split('?')[0];
      }

      const { data, error } = await supabase.storage
        .from(VERIFICATION_BUCKET)
        .createSignedUrl(normalizedPath, 300);

      if (error || !data?.signedUrl) throw error || new Error("Document URL could not be created");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error opening verification document:", error);
      toast({
        title: "Unable to open document",
        description: "The verification document path or storage permissions need attention.",
        variant: "destructive",
      });
    }
  };

  // Approve = make profile live and set profiles.user_type = 'expert'
  const handleApprove = async (expertId: string) => {
    setActionLoading(expertId);
    try {
      const { data: speaker } = await supabase
        .from('speakers')
        .select('suspension_history, verification_status, user_id')
        .eq('id', expertId)
        .single() as unknown as { data: SuspendableSpeaker | null };

      const isUnsuspend = speaker?.verification_status === 'suspended';
      const history = speaker && Array.isArray(speaker.suspension_history) ? speaker.suspension_history : [];

      const lastSuspension = [...history]
        .reverse()
        .find((entry) => (entry as { action?: string })?.action === 'suspended') as
        | { previous_status?: string }
        | undefined;
      const restoredStatus = isUnsuspend
        ? lastSuspension?.previous_status || 'verified'
        : 'verified';

      const updatedHistory = isUnsuspend
        ? [
            ...history,
            {
              action: "unsuspended",
              reason: `Unsuspended by admin; status restored to ${restoredStatus}`,
              restored_status: restoredStatus,
              timestamp: new Date().toISOString(),
            },
          ]
        : history;

      const { error } = await supabase
        .from('speakers')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({
          verification_status: restoredStatus,
          suspension_reason: null,
          suspended_at: null,
          suspension_history: updatedHistory,
        } as any)
        .eq('id', expertId);

      if (error) throw error;

      if (speaker?.user_id && restoredStatus === 'verified') {
        // Authoritatively promote profile to expert
        await supabase
          .from('profiles')
          .update({ user_type: 'expert' })
          .eq('id', speaker.user_id);
      }

      const expert = experts.find((item) => item.id === expertId);
      const subject = isUnsuspend
        ? "Your Irookee account has been reinstated"
        : "Your Irookee expert profile was approved";
      const notificationTitle = isUnsuspend
        ? "Your account has been reinstated"
        : "Expert profile approved";
      const notificationBody = isUnsuspend
        ? "Your suspension has been lifted and your expert profile is active again."
        : "Your Irookee expert profile is now live and ready to receive bookings.";

      if (expert?.email) {
        await sendNotificationEmail({
          to: expert.email,
          subject,
          eventType: isUnsuspend ? "expert_reinstated" : "expert_approved",
          html: `<p>${notificationBody}</p>`,
          userId: expert.user_id,
        }).catch((err) => console.error("Email notification failed:", err));
      }
      await createInAppNotification({
        userId: expert?.user_id,
        title: notificationTitle,
        body: notificationBody,
        type: isUnsuspend ? "expert_reinstated" : "expert_approved",
        relatedId: expertId,
      }).catch((err) => console.error("In-app notification failed:", err));

      toast({
        title: isUnsuspend ? "Expert Reinstated" : "Expert Approved",
        description: isUnsuspend
          ? `Suspension lifted; status restored to ${restoredStatus}.`
          : "Profile is now live on the platform and expert role is active.",
      });
      fetchExperts();
    } catch (error: unknown) {
      console.error('Approve error:', error);
      toast({ title: "Error", description: getErrorMessage(error, "Failed to approve"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const openFeedbackModal = (expertId: string, action: 'reject' | 'request_changes' | 'suspend') => {
    setTargetExpertId(expertId);
    setFeedbackAction(action);
    setFeedbackText("");
    setFeedbackDialogOpen(true);
  };

  const handleFeedbackSubmit = async () => {
    if (!targetExpertId) return;
    const expertId = targetExpertId;
    const reason = feedbackText.trim() || (feedbackAction === 'request_changes' ? 'Changes requested by admin' : feedbackAction === 'reject' ? 'Application not approved' : 'Suspended by admin');

    setActionLoading(expertId);
    try {
      const expert = experts.find((item) => item.id === expertId);

      if (feedbackAction === 'request_changes') {
        const { error } = await supabase
          .from('speakers')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({
            verification_status: 'changes_requested',
            suspension_reason: reason,
          } as any)
          .eq('id', expertId);

        if (error) throw error;

        if (expert?.email) {
          await sendNotificationEmail({
            to: expert.email,
            subject: "Action Required: Updates requested on your Irookee expert application",
            eventType: "expert_changes_requested",
            html: `<p>Dear ${expert.name},</p><p>Our review team has requested updates to your expert application:</p><blockquote>${reason}</blockquote><p>Please log in to your dashboard to edit and resubmit your details.</p>`,
            userId: expert.user_id,
          }).catch(console.error);
        }

        await createInAppNotification({
          userId: expert?.user_id,
          title: "Changes requested on your expert application",
          body: `Feedback: ${reason}`,
          type: "expert_changes_requested",
          relatedId: expertId,
        }).catch(console.error);

        toast({ title: "Changes Requested", description: "Applicant will see feedback in their dashboard." });
      } else if (feedbackAction === 'reject') {
        const { error } = await supabase
          .from('speakers')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({
            verification_status: 'rejected',
            is_verified: false,
            suspension_reason: reason,
          } as any)
          .eq('id', expertId);

        if (error) throw error;

        await supabase
          .from('verification_requests')
          .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
          .eq('speaker_id', expertId);

        if (expert?.email) {
          await sendNotificationEmail({
            to: expert.email,
            subject: "Your Irookee expert application status",
            eventType: "expert_rejected",
            html: `<p>Your Irookee expert profile was not approved.</p><p>Reason: ${reason}</p>`,
            userId: expert.user_id,
          }).catch(console.error);
        }
        await createInAppNotification({
          userId: expert?.user_id,
          title: "Expert application not approved",
          body: `Reason: ${reason}`,
          type: "expert_rejected",
          relatedId: expertId,
        }).catch(console.error);

        toast({ title: "Expert Rejected", description: "Profile application marked as rejected." });
      } else if (feedbackAction === 'suspend') {
        const { data: speaker } = await supabase
          .from('speakers')
          .select('suspension_history, user_id, verification_status')
          .eq('id', expertId)
          .single() as unknown as { data: SuspendableSpeaker | null };

        const history = speaker && Array.isArray(speaker.suspension_history) ? speaker.suspension_history : [];
        const updatedHistory = [
          ...history,
          {
            action: "suspended",
            reason,
            previous_status: speaker?.verification_status || 'verified',
            timestamp: new Date().toISOString(),
          },
        ];

        const { error } = await supabase
          .from('speakers')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({
            verification_status: 'suspended',
            is_verified: false,
            suspension_reason: reason,
            suspended_at: new Date().toISOString(),
            suspension_history: updatedHistory,
          } as any)
          .eq('id', expertId);

        if (error) throw error;

        if (speaker?.user_id) {
          await supabase
            .from('profiles')
            .update({ user_type: 'suspended' })
            .eq('id', speaker.user_id);

          await createInAppNotification({
            userId: speaker.user_id,
            title: "Your expert profile has been suspended",
            body: `${reason} — contact support if you believe this is a mistake.`,
            type: "expert_suspended",
            relatedId: expertId,
          }).catch(console.error);
        }

        toast({ title: "Expert Suspended", description: "Expert profile and tools suspended." });
      }

      setFeedbackDialogOpen(false);
      setSelectedExpert(null);
      fetchExperts();
    } catch (error) {
      console.error('Feedback action error:', error);
      toast({ title: "Error", description: getErrorMessage(error, "Action failed"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle Verified Badge
  const handleToggleVerified = async (expertId: string, value: boolean) => {
    setActionLoading(expertId);
    try {
      const { error } = await supabase
        .from('speakers')
        .update({ is_verified: value })
        .eq('id', expertId);

      if (error) throw error;

      await supabase
        .from('verification_requests')
        .update({ status: value ? 'approved' : 'pending', reviewed_at: new Date().toISOString() })
        .eq('speaker_id', expertId);

      toast({
        title: value ? "Verified badge granted" : "Verified badge removed",
        description: value
          ? "This expert now displays the Verified ✓ checkmark badge."
          : "The Verified checkmark badge has been removed.",
      });

      if (selectedExpert && selectedExpert.id === expertId) {
        setSelectedExpert({ ...selectedExpert, is_verified: value });
      }
      fetchExperts();
    } catch (error: unknown) {
      console.error('Verify toggle error:', error);
      toast({ title: "Error", description: getErrorMessage(error, "Failed to update"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  // Badge Management (Trust tags)
  const handleAddBadge = async (expertId: string, badgeName: string) => {
    const cleanBadge = badgeName.trim();
    if (!cleanBadge) return;

    setActionLoading(expertId);
    try {
      const expert = experts.find((e) => e.id === expertId);
      const existingBadges = expert?.badges && Array.isArray(expert.badges) ? expert.badges : [];
      if (existingBadges.includes(cleanBadge)) {
        toast({ title: "Badge already exists", description: `Expert already has the "${cleanBadge}" badge.` });
        return;
      }

      const updatedBadges = [...existingBadges, cleanBadge];
      const { error } = await supabase
        .from('speakers')
        .update({ badges: updatedBadges })
        .eq('id', expertId);

      if (error) throw error;

      toast({ title: "Badge Added", description: `Added "${cleanBadge}" badge to expert.` });
      setNewBadgeText("");
      if (selectedExpert && selectedExpert.id === expertId) {
        setSelectedExpert({ ...selectedExpert, badges: updatedBadges });
      }
      fetchExperts();
    } catch (error) {
      console.error('Add badge error:', error);
      toast({ title: "Error adding badge", description: getErrorMessage(error, "Failed to add badge"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveBadge = async (expertId: string, badgeName: string) => {
    setActionLoading(expertId);
    try {
      const expert = experts.find((e) => e.id === expertId);
      const existingBadges = expert?.badges && Array.isArray(expert.badges) ? expert.badges : [];
      const updatedBadges = existingBadges.filter((b) => b !== badgeName);

      const { error } = await supabase
        .from('speakers')
        .update({ badges: updatedBadges })
        .eq('id', expertId);

      if (error) throw error;

      toast({ title: "Badge Removed", description: `Removed "${badgeName}" badge.` });
      if (selectedExpert && selectedExpert.id === expertId) {
        setSelectedExpert({ ...selectedExpert, badges: updatedBadges });
      }
      fetchExperts();
    } catch (error) {
      console.error('Remove badge error:', error);
      toast({ title: "Error removing badge", description: getErrorMessage(error, "Failed to remove badge"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  // Remap Custom Profession
  const openRemapModal = (expert: ExpertRow) => {
    setSelectedExpert(expert);
    setRemapValue(expert.title || expert.custom_profession || "");
    setRemapDialogOpen(true);
  };

  const handleRemapSubmit = async () => {
    if (!selectedExpert || !remapValue.trim()) return;
    const expertId = selectedExpert.id;
    const cleanTitle = remapValue.trim();

    setActionLoading(expertId);
    try {
      const { error } = await supabase
        .from('speakers')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({
          title: cleanTitle,
          custom_profession: null, // cleared once reviewed & mapped
        } as any)
        .eq('id', expertId);

      if (error) throw error;

      toast({
        title: "Profession Remapped",
        description: `Expert title updated to "${cleanTitle}".`,
      });

      setRemapDialogOpen(false);
      setSelectedExpert({ ...selectedExpert, title: cleanTitle, custom_profession: null });
      fetchExperts();
    } catch (error) {
      console.error('Remap error:', error);
      toast({ title: "Error", description: getErrorMessage(error, "Failed to remap profession"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  // Secure User / Expert Deletion
  const handleDeleteExpert = async (expert: ExpertRow) => {
    const confirmMsg = expert.user_id
      ? `Are you sure you want to permanently delete expert "${expert.name}" and their underlying user account? This will cascade and delete all bookings, reviews, and records.`
      : `Are you sure you want to delete expert profile "${expert.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setActionLoading(expert.id);
    try {
      if (expert.user_id) {
        const { error } = await supabase.rpc('delete_account', {
          target_user_id: expert.user_id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('speakers').delete().eq('id', expert.id);
        if (error) throw error;
      }

      toast({ title: "Expert Deleted", description: `Expert "${expert.name}" was permanently removed.` });
      setSelectedExpert(null);
      fetchExperts();
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Delete Failed", description: getErrorMessage(error, "Failed to delete expert"), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 border-green-300 font-semibold"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'changes_requested':
        return <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-semibold"><RotateCcw className="h-3 w-3 mr-1" />Changes Req</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="font-semibold"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 font-semibold"><ShieldAlert className="h-3 w-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="secondary" className="bg-blue-50 text-blue-800 font-semibold"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getDocuments = (expert: ExpertRow) => {
    const docs = expert.verification_documents as { documents?: { name: string; url: string; type: string }[] } | null;
    return docs?.documents || [];
  };

  const getExpertise = (expert: ExpertRow): string[] => {
    return expert.expertise || expert.expertise_areas || [];
  };

  const visibleExperts = experts.filter((expert) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    return [
      expert.name,
      expert.title,
      expert.custom_profession,
      expert.email,
      expert.location,
      expert.company,
      expert.bio,
      ...getExpertise(expert),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading expert applications...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Expert Applications & Moderation</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review onboarding submissions, moderate custom professions, grant verified checkmarks, and manage trust badges.
              </p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, title, skill..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="pt-2">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1">
                <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                <TabsTrigger value="changes_requested" className="text-xs">Changes Req</TabsTrigger>
                <TabsTrigger value="verified" className="text-xs">Approved</TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
                <TabsTrigger value="suspended" className="text-xs">Suspended</TabsTrigger>
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <p className="text-xs text-muted-foreground">{visibleExperts.length} expert application(s) found</p>
        </CardHeader>

        <CardContent>
          {visibleExperts.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-muted/20">
              <UserCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="font-semibold text-foreground">No expert applications in this tab</p>
              <p className="text-xs text-muted-foreground mt-1">Switch filter tabs or adjust search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Expert</TableHead>
                    <TableHead>Profession / Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verified ✓</TableHead>
                    <TableHead>Badges</TableHead>
                    <TableHead>Docs</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleExperts.map((expert) => (
                    <TableRow key={expert.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                            {expert.image_url || expert.profile_photo_url ? (
                              <img src={expert.image_url || expert.profile_photo_url || ''} alt={expert.name} className="w-full h-full object-cover" />
                            ) : (
                              (expert.name || 'E').slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm leading-tight">{expert.name || 'Unnamed'}</p>
                            <p className="text-xs text-muted-foreground">{expert.email || 'No email'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-tight">{expert.title || 'N/A'}</p>
                          {expert.custom_profession && (
                            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                              Custom: {expert.custom_profession}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(expert.verification_status)}</TableCell>
                      <TableCell>
                        {expert.is_verified ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold text-xs">
                            <BadgeCheck className="h-3 w-3 mr-1" /> Verified
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unverified</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {expert.badges && expert.badges.length > 0 ? (
                            expert.badges.slice(0, 2).map((b, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800">{b}</Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                          {expert.badges && expert.badges.length > 2 && (
                            <Badge variant="outline" className="text-[10px]">+{expert.badges.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          {getDocuments(expert).length}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setSelectedExpert(expert)} title="View Details">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant={expert.is_verified ? "outline" : "default"}
                            title={expert.is_verified ? "Remove Verified checkmark" : "Grant Verified checkmark"}
                            onClick={() => handleToggleVerified(expert.id, !expert.is_verified)}
                            disabled={actionLoading === expert.id}
                          >
                            {actionLoading === expert.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                          </Button>

                          {/* Action Buttons based on status */}
                          {expert.verification_status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(expert.id)}
                                disabled={actionLoading === expert.id}
                                title="Approve Application"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                {actionLoading === expert.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openFeedbackModal(expert.id, 'request_changes')}
                                disabled={actionLoading === expert.id}
                                title="Request Changes"
                                className="text-amber-700 border-amber-300"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openFeedbackModal(expert.id, 'reject')}
                                disabled={actionLoading === expert.id}
                                title="Reject Application"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}

                          {expert.verification_status === 'changes_requested' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(expert.id)}
                                disabled={actionLoading === expert.id}
                                title="Approve Revised Application"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openFeedbackModal(expert.id, 'reject')}
                                disabled={actionLoading === expert.id}
                                title="Reject"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}

                          {expert.verification_status === 'verified' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openFeedbackModal(expert.id, 'suspend')}
                              disabled={actionLoading === expert.id}
                              title="Suspend Expert"
                            >
                              <ShieldAlert className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {expert.verification_status === 'suspended' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(expert.id)}
                              disabled={actionLoading === expert.id}
                              title="Unsuspend Expert"
                            >
                              Unsuspend
                            </Button>
                          )}

                          {expert.verification_status === 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(expert.id)}
                              disabled={actionLoading === expert.id}
                              title="Re-approve Expert"
                            >
                              Re-approve
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expert Full Profile & Moderation Dialog */}
      <Dialog open={!!selectedExpert} onOpenChange={() => setSelectedExpert(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>Expert Application: {selectedExpert?.name}</span>
              {selectedExpert && getStatusBadge(selectedExpert.verification_status)}
            </DialogTitle>
            <DialogDescription className="sr-only">Review expert onboarding profile, documents, and credentials</DialogDescription>
          </DialogHeader>

          {selectedExpert && (
            <div className="space-y-6 pt-2">
              {/* Custom Profession Review Banner */}
              {selectedExpert.custom_profession && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      Custom Profession Review Required
                    </p>
                    <p className="text-sm font-semibold text-purple-950 dark:text-purple-100 mt-0.5">
                      Submitted: &quot;{selectedExpert.custom_profession}&quot;
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openRemapModal(selectedExpert)} className="border-purple-300 text-purple-800 shrink-0">
                    <Edit className="h-3.5 w-3.5 mr-1" /> Remap / Approve
                  </Button>
                </div>
              )}

              {/* Bio & Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-muted/20 p-4 rounded-xl border">
                <div><p className="text-xs text-muted-foreground font-semibold">Title</p><p className="font-semibold">{selectedExpert.title || 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground font-semibold">Email</p><p className="font-semibold text-xs">{selectedExpert.email || 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground font-semibold">Phone</p><p className="font-semibold">{selectedExpert.phone || 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground font-semibold">Experience</p><p className="font-semibold">{selectedExpert.experience_years ? `${selectedExpert.experience_years} years` : 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground font-semibold">Location</p><p className="font-semibold">{selectedExpert.location || 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground font-semibold">Company</p><p className="font-semibold">{selectedExpert.company || 'N/A'}</p></div>
                <div><p className="text-xs text-muted-foreground font-semibold">Submitted</p><p className="font-semibold text-xs">{new Date(selectedExpert.created_at).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-muted-foreground font-semibold">User ID</p><p className="text-[11px] font-mono">{selectedExpert.user_id || 'Seeded'}</p></div>
              </div>

              {selectedExpert.bio && (
                <div>
                  <Label className="text-xs font-bold uppercase text-muted-foreground">About / Bio</Label>
                  <p className="text-sm mt-1 p-3 bg-muted/30 border rounded-lg leading-relaxed">{selectedExpert.bio}</p>
                </div>
              )}

              {/* Badges & Trust Tags Management */}
              <div className="p-4 border rounded-xl space-y-3 bg-background">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-bold text-sm">Trust Tags & Badges</Label>
                    <p className="text-xs text-muted-foreground">Manage badges assigned to this expert.</p>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">{selectedExpert.badges?.length || 0} active</Badge>
                </div>

                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-muted/20 border rounded-lg">
                  {selectedExpert.badges && selectedExpert.badges.length > 0 ? (
                    selectedExpert.badges.map((badge, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 font-medium">
                        <Tag className="h-3 w-3" />
                        {badge}
                        <button
                          type="button"
                          onClick={() => handleRemoveBadge(selectedExpert.id, badge)}
                          className="hover:text-destructive ml-1"
                          title={`Remove ${badge}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No badges assigned yet.</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {POPULAR_BADGES.map((b) => (
                    <Button
                      key={b}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleAddBadge(selectedExpert.id, b)}
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> + {b}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Input
                    type="text"
                    value={newBadgeText}
                    onChange={(e) => setNewBadgeText(e.target.value)}
                    placeholder="Custom badge name..."
                    className="text-xs h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    onClick={() => handleAddBadge(selectedExpert.id, newBadgeText)}
                  >
                    Add Custom Badge
                  </Button>
                </div>
              </div>

              {/* Verification Documents */}
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">Verification Proof Documents</Label>
                {getDocuments(selectedExpert).length > 0 ? (
                  <div className="space-y-2">
                    {getDocuments(selectedExpert).map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 border rounded-lg bg-background">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                          <span className="text-sm font-medium">{doc.name}</span>
                          <Badge variant="outline" className="text-[10px]">{doc.type}</Badge>
                        </div>
                        {doc.url && (
                          <Button size="sm" variant="link" onClick={() => openDocument(doc.url)}>
                            Open Document
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic p-3 border rounded-lg">No verification documents attached.</p>
                )}
              </div>

              {/* Verified Badge Checkmark Control */}
              <div className="flex items-center justify-between gap-4 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                <div>
                  <p className="text-sm font-semibold">Verified Checkmark Badge</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedExpert.is_verified
                      ? "Expert displays the Verified ✓ badge publicly."
                      : "Tick badge is currently disabled."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={selectedExpert.is_verified ? "outline" : "default"}
                  onClick={() => handleToggleVerified(selectedExpert.id, !selectedExpert.is_verified)}
                  disabled={actionLoading === selectedExpert.id}
                >
                  <BadgeCheck className="h-4 w-4 mr-1.5" />
                  {selectedExpert.is_verified ? "Remove Checkmark" : "Grant Verified ✓"}
                </Button>
              </div>

              {/* Status Note or Suspension Notice */}
              {selectedExpert.suspension_reason && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-lg text-xs space-y-1 text-amber-900 dark:text-amber-200">
                  <p className="font-bold uppercase tracking-wide">Last Review / Suspension Note</p>
                  <p>{selectedExpert.suspension_reason}</p>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 text-xs"
                  onClick={() => handleDeleteExpert(selectedExpert)}
                  disabled={actionLoading === selectedExpert.id}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Expert Account
                </Button>

                <div className="flex items-center gap-2">
                  {selectedExpert.verification_status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openFeedbackModal(selectedExpert.id, 'request_changes')}
                        className="text-amber-700 border-amber-300"
                      >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" /> Request Changes
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openFeedbackModal(selectedExpert.id, 'reject')}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => { handleApprove(selectedExpert.id); setSelectedExpert(null); }}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve Application
                      </Button>
                    </>
                  )}

                  {selectedExpert.verification_status === 'changes_requested' && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => { handleApprove(selectedExpert.id); setSelectedExpert(null); }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                  )}

                  {selectedExpert.verification_status === 'verified' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openFeedbackModal(selectedExpert.id, 'suspend')}
                    >
                      <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Suspend
                    </Button>
                  )}

                  {selectedExpert.verification_status === 'suspended' && (
                    <Button
                      size="sm"
                      onClick={() => { handleApprove(selectedExpert.id); setSelectedExpert(null); }}
                    >
                      Unsuspend
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback / Note Dialog (Reject, Request Changes, Suspend) */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {feedbackAction === 'request_changes' && "Request Changes from Applicant"}
              {feedbackAction === 'reject' && "Reject Expert Application"}
              {feedbackAction === 'suspend' && "Suspend Expert Account"}
            </DialogTitle>
            <DialogDescription className="sr-only">Provide notes or reasons for moderation action</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="feedback-input" className="text-xs font-semibold">
              {feedbackAction === 'request_changes' && "Specify required updates / missing items:"}
              {feedbackAction === 'reject' && "Reason for rejection:"}
              {feedbackAction === 'suspend' && "Reason for suspension:"}
            </Label>
            <Textarea
              id="feedback-input"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={
                feedbackAction === 'request_changes'
                  ? "e.g. Please re-upload a clear copy of your government ID."
                  : feedbackAction === 'reject'
                  ? "e.g. Qualifications do not meet current criteria."
                  : "e.g. Policy violation."
              }
              rows={4}
              className="text-sm"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
            <Button
              variant={feedbackAction === 'request_changes' ? 'default' : 'destructive'}
              onClick={handleFeedbackSubmit}
              disabled={actionLoading !== null}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Submit Decision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remap Custom Profession Dialog */}
      <Dialog open={remapDialogOpen} onOpenChange={setRemapDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Moderate & Remap Custom Profession</DialogTitle>
            <DialogDescription className="sr-only">Map custom profession to standardized title</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground">Submitted Custom Value</Label>
              <p className="text-sm font-bold mt-0.5">{selectedExpert?.custom_profession || selectedExpert?.title}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remap-input" className="text-xs font-semibold">Approved Display Title</Label>
              <Input
                id="remap-input"
                value={remapValue}
                onChange={(e) => setRemapValue(e.target.value)}
                placeholder="Enter approved title..."
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quick Select from Predefined Catalog</Label>
              <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto p-1 border rounded-lg">
                {PREDEFINED_PROFESSIONS.map((prof) => (
                  <button
                    key={prof}
                    type="button"
                    onClick={() => setRemapValue(prof)}
                    className="text-[11px] px-2 py-1 bg-muted hover:bg-primary hover:text-white rounded transition-colors text-left"
                  >
                    {prof}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRemapDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRemapSubmit} disabled={actionLoading !== null || !remapValue.trim()}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Approved Title
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExpertApproval;
