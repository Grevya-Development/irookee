import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ShieldAlert, AlertTriangle, Eye, CheckCircle2, X } from "lucide-react";

interface Report {
  id: string;
  reporter_id: string;
  expert_id: string;
  category: string;
  description: string;
  status: "pending" | "reviewed" | "action_taken" | "rejected";
  admin_notes: string | null;
  created_at: string;
  reporter?: {
    full_name: string | null;
    email: string | null;
  } | null;
  expert?: {
    id: string;
    name: string | null;
    title: string | null;
    verification_status: string | null;
  } | null;
}

export default function PlatformModeration() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expert_reports" as never)
        .select(`
          id,
          reporter_id,
          expert_id,
          category,
          description,
          status,
          admin_notes,
          created_at,
          reporter:profiles(full_name, email),
          expert:speakers(id, name, title, verification_status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports((data || []) as unknown as Report[]);
    } catch (err: unknown) {
      console.error("Error loading reports:", err);
      toast.error("Failed to load expert reports.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleUpdateStatus = async (status: Report["status"], suspendExpert = false) => {
    if (!selectedReport) return;
    setUpdating(true);
    try {
      // 1. Update report status and notes
      const { error: reportError } = await supabase
        .from("expert_reports" as never)
        .update({
          status,
          admin_notes: adminNotes.trim() || null,
        } as never)
        .eq("id", selectedReport.id);

      if (reportError) throw reportError;

      // 2. If taking action / suspending the expert, update the speaker profile status
      if (suspendExpert && selectedReport.expert?.id) {
        const { data: speaker } = await supabase
          .from("speakers")
          .select("suspension_history, user_id")
          .eq("id", selectedReport.expert.id)
          .single();

        const history = speaker && Array.isArray(speaker.suspension_history) ? speaker.suspension_history : [];
        const updatedHistory = [
          ...history,
          {
            action: "suspended",
            reason: adminNotes.trim() || `Suspended due to report category: ${selectedReport.category}`,
            timestamp: new Date().toISOString(),
          }
        ];

        const { error: expertError } = await supabase
          .from("speakers")
          .update({
            verification_status: "suspended",
            is_verified: false,
            suspension_reason: adminNotes.trim() || `Suspended due to report category: ${selectedReport.category}`,
            suspended_at: new Date().toISOString(),
            suspension_history: updatedHistory,
          } as never)
          .eq("id", selectedReport.expert.id);

        if (expertError) throw expertError;

        if (speaker?.user_id) {
          await supabase
            .from("profiles")
            .update({ user_type: "suspended" })
            .eq("id", speaker.user_id);
        }

        toast.success("Expert has been suspended and report marked as action taken.");
      } else {
        toast.success(`Report status updated to ${status}.`);
      }

      setSelectedReport(null);
      setAdminNotes("");
      fetchReports();
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update report status.");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "reviewed":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">Reviewed</Badge>;
      case "action_taken":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Action Taken</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-muted-foreground border-gray-200">Rejected</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "spam": return "Spam / Promotion";
      case "abuse": return "Abusive Behavior";
      case "harassment": return "Harassment";
      case "misleading": return "Misleading Profile";
      default: return "Other Violation";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingReports = reports.filter((r) => r.status === "pending");
  const processedReports = reports.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" /> Community Reports
          </h2>
          <p className="text-sm text-muted-foreground">Review and manage reported violations against expert profiles</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReports}>Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{pendingReports.length}</div>
            <div className="text-xs text-muted-foreground">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {reports.filter((r) => r.status === "action_taken").length}
            </div>
            <div className="text-xs text-muted-foreground">Actions Taken</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{reports.length}</div>
            <div className="text-xs text-muted-foreground">Total Reports Received</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Pending Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingReports.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              All reports resolved! No pending items.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expert Profile</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date Reported</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{report.expert?.name || "Unknown Expert"}</div>
                        <div className="text-xs text-muted-foreground font-normal">{report.expert?.title || ""}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{report.reporter?.full_name || "Anonymous User"}</div>
                        <div className="text-xs text-muted-foreground font-normal">{report.reporter?.email || ""}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(report.category)}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(report.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedReport(report);
                          setAdminNotes(report.admin_notes || "");
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
          <CardTitle>History & Resolved Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {processedReports.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No historical reports to display.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expert</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.expert?.name || "Unknown Expert"}</TableCell>
                    <TableCell>{report.reporter?.full_name || "Anonymous"}</TableCell>
                    <TableCell>{getCategoryLabel(report.category)}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(report.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedReport(report);
                          setAdminNotes(report.admin_notes || "");
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {selectedReport && (
        <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" /> Review Expert Report
              </DialogTitle>
              <DialogDescription>
                Review report details submitted by a seeker and decide on the appropriate action.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="font-semibold">Reported Expert:</span>
                <span className="col-span-2">
                  {selectedReport.expert?.name} ({selectedReport.expert?.title})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="font-semibold">Reporter Name:</span>
                <span className="col-span-2">{selectedReport.reporter?.full_name}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="font-semibold">Reporter Email:</span>
                <span className="col-span-2">{selectedReport.reporter?.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-2 border-b">
                <span className="font-semibold">Reason Category:</span>
                <span className="col-span-2">
                  <Badge variant="outline">{getCategoryLabel(selectedReport.category)}</Badge>
                </span>
              </div>

              <div className="space-y-1">
                <span className="font-semibold">User Description:</span>
                <div className="p-3 bg-gray-50 rounded border text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedReport.description}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="admin-notes">Admin Notes & Resolution Action</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Document the internal evaluation or action details..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={selectedReport.status !== "pending" && selectedReport.status !== "reviewed"}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-wrap gap-2 sm:justify-between items-center w-full">
              <div>
                {selectedReport.status !== "pending" && (
                  <span className="text-xs text-muted-foreground">
                    Resolution Status: {getStatusBadge(selectedReport.status)}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {selectedReport.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("rejected")}
                      disabled={updating}
                      className="text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                    >
                      Dismiss Report
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus("reviewed")}
                      disabled={updating}
                      className="text-blue-600 hover:bg-blue-50 border-blue-200"
                    >
                      Mark Reviewed
                    </Button>
                  </>
                )}
                {(selectedReport.status === "pending" || selectedReport.status === "reviewed") && (
                  <Button
                    variant="destructive"
                    onClick={() => handleUpdateStatus("action_taken", true)}
                    disabled={updating}
                  >
                    {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Suspend Expert
                  </Button>
                )}
                {selectedReport.status !== "pending" && selectedReport.status !== "reviewed" && (
                  <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
