import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, X, Eye, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { approveGuestProfile, rejectGuestProfile } from "@/lib/adminApi";
import { sendNotificationEmail } from "@/lib/notifications";

interface GuestProfile {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string | null;
  created_at: string;
  status?: string | null;
}

type VerificationRequest = {
  id: string;
  speaker_id: string | null;
  status: string | null;
  submitted_at: string;
  documents: unknown;
  notes: string | null;
};

const VERIFICATION_BUCKET = "verification-documents";

const extractDocumentPaths = (documents: unknown): string[] => {
  if (!documents) return [];
  if (typeof documents === "string") return [documents];
  if (Array.isArray(documents)) return documents.flatMap(extractDocumentPaths);
  if (typeof documents === "object") {
    return Object.values(documents).flatMap(extractDocumentPaths);
  }
  return [];
};

const normalizeStoragePath = (value: string) =>
  value.replace(/^\/+/, "").replace(new RegExp(`^${VERIFICATION_BUCKET}/`), "");

const ExpertApproval = () => {
  const [profiles, setProfiles] = useState<GuestProfile[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviewData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const [{ data: guestProfiles, error: guestError }, { data: requests, error: requestError }] = await Promise.all([
        supabase
          .from("guest_profiles")
          .select("*")
          .neq("status", "approved")
          .order("created_at", { ascending: false }),
        supabase
          .from("verification_requests")
          .select("*")
          .order("submitted_at", { ascending: false }),
      ]);

      if (guestError) throw guestError;
      if (requestError) throw requestError;

      setProfiles((guestProfiles || []) as GuestProfile[]);
      setVerificationRequests((requests || []) as VerificationRequest[]);
    } catch (error) {
      console.error("Error loading approval data:", error);
      toast({
        title: "Error",
        description: "Failed to load approval data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (profile: GuestProfile) => {
    setActionLoading(profile.id);
    try {
      await approveGuestProfile(profile.id);
      await sendNotificationEmail({
        to: profile.email,
        subject: "Your Irookee expert profile was approved",
        eventType: "expert_approved",
        html: `<p>Your Irookee expert profile was approved.</p><p>You can now sign in and complete your expert profile setup.</p>`,
      });

      toast({
        title: "Success",
        description: "Profile approved successfully",
      });

      setProfiles(prev => prev.filter(p => p.id !== profile.id));
    } catch (error) {
      console.error("Error approving profile:", error);
      toast({
        title: "Error",
        description: "Failed to approve profile",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (profileId: string) => {
    setActionLoading(profileId);
    try {
      await rejectGuestProfile(profileId);

      toast({
        title: "Success",
        description: "Profile rejected",
      });

      setProfiles(prev => prev.filter(p => p.id !== profileId));
    } catch (error) {
      console.error("Error rejecting profile:", error);
      toast({
        title: "Error",
        description: "Failed to reject profile",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openDocument = async (documentPath: string) => {
    try {
      if (/^https?:\/\//i.test(documentPath)) {
        window.open(documentPath, "_blank", "noopener,noreferrer");
        return;
      }

      const { data, error } = await supabase.storage
        .from(VERIFICATION_BUCKET)
        .createSignedUrl(normalizeStoragePath(documentPath), 300);

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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expert Profile Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading profiles...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Expert Profile Approval</CardTitle>
          <p className="text-sm text-gray-600">
            {profiles.length} pending profile{profiles.length !== 1 ? "s" : ""} for review
          </p>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending profiles to review</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.full_name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.company || "N/A"}</TableCell>
                    <TableCell>{profile.phone || "N/A"}</TableCell>
                    <TableCell>{formatDate(profile.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" title={`Message: ${profile.message || "No message"}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(profile)}
                          disabled={actionLoading === profile.id}
                        >
                          {actionLoading === profile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(profile.id)}
                          disabled={actionLoading === profile.id}
                        >
                          {actionLoading === profile.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification Documents</CardTitle>
          <p className="text-sm text-gray-600">
            Open submitted expert verification documents with signed storage URLs.
          </p>
        </CardHeader>
        <CardContent>
          {verificationRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No verification requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Documents</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verificationRequests.map((request) => {
                  const paths = extractDocumentPaths(request.documents);

                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.speaker_id || request.id}</TableCell>
                      <TableCell>{request.status || "pending"}</TableCell>
                      <TableCell>{formatDate(request.submitted_at)}</TableCell>
                      <TableCell>
                        {paths.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No documents</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {paths.map((path, index) => (
                              <Button
                                key={`${request.id}-${path}-${index}`}
                                size="sm"
                                variant="outline"
                                onClick={() => openDocument(path)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Document {index + 1}
                              </Button>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpertApproval;
