import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, X, Eye, Loader2, FileText, Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExpertRow {
  id: string;
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  location: string | null;
  expertise: string[] | null;
  expertise_areas: string[] | null;
  experience_years: number | null;
  verification_status: string | null;
  verification_documents: Record<string, unknown> | null;
  created_at: string;
  bio: string | null;
  linkedin_url: string | null;
  user_id: string | null;
}

const ExpertApproval = () => {
  const [experts, setExperts] = useState<ExpertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedExpert, setSelectedExpert] = useState<ExpertRow | null>(null);
  const [filter, setFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
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

  const handleApprove = async (expertId: string) => {
    setActionLoading(expertId);
    try {
      const { error } = await supabase
        .from('speakers')
        .update({ verification_status: 'verified', is_verified: true })
        .eq('id', expertId);

      if (error) throw error;

      // Try updating verification_requests (may not exist)
      await supabase
        .from('verification_requests' as any)
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('speaker_id', expertId)
        .then(() => {}) // ignore errors
        .catch(() => {});

      toast({ title: "Expert Approved", description: "Profile is now live on the platform" });
      fetchExperts();
    } catch (error: any) {
      console.error('Approve error:', error);
      toast({ title: "Error", description: error?.message || "Failed to approve", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (expertId: string) => {
    setActionLoading(expertId);
    try {
      const { error } = await supabase
        .from('speakers')
        .update({ verification_status: 'rejected', is_verified: false })
        .eq('id', expertId);

      if (error) throw error;

      await supabase
        .from('verification_requests' as any)
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('speaker_id', expertId)
        .then(() => {})
        .catch(() => {});

      toast({ title: "Expert Rejected", description: "Profile has been rejected" });
      fetchExperts();
    } catch (error: any) {
      console.error('Reject error:', error);
      toast({ title: "Error", description: error?.message || "Failed to reject", variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'verified': return <Badge className="bg-green-100 text-green-800"><Shield className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'rejected': return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getDocuments = (expert: ExpertRow) => {
    const docs = expert.verification_documents as { documents?: { name: string; url: string; type: string }[] } | null;
    return docs?.documents || [];
  };

  const getExpertise = (expert: ExpertRow): string[] => {
    return expert.expertise || expert.expertise_areas || [];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading experts...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Expert Verification & Approval</CardTitle>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-sm text-muted-foreground">{experts.length} expert(s)</p>
        </CardHeader>
        <CardContent>
          {experts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No experts in this category</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Expertise</TableHead>
                  <TableHead>Docs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {experts.map((expert) => (
                  <TableRow key={expert.id}>
                    <TableCell className="font-medium">{expert.name || 'N/A'}</TableCell>
                    <TableCell>{expert.title || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{expert.email || 'N/A'}</TableCell>
                    <TableCell>{expert.location || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {getExpertise(expert).slice(0, 2).map((e, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{e}</Badge>
                        ))}
                        {getExpertise(expert).length > 2 && (
                          <Badge variant="outline" className="text-xs">+{getExpertise(expert).length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        <FileText className="h-3 w-3 mr-1" />
                        {getDocuments(expert).length}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(expert.verification_status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" onClick={() => setSelectedExpert(expert)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {expert.verification_status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(expert.id)} disabled={actionLoading === expert.id}>
                              {actionLoading === expert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleReject(expert.id)} disabled={actionLoading === expert.id}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {expert.verification_status === 'rejected' && (
                          <Button size="sm" variant="outline" onClick={() => handleApprove(expert.id)} disabled={actionLoading === expert.id}>
                            Re-approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedExpert} onOpenChange={() => setSelectedExpert(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Expert Details: {selectedExpert?.name}</DialogTitle>
          </DialogHeader>
          {selectedExpert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="font-medium text-muted-foreground">Title</p><p>{selectedExpert.title || 'N/A'}</p></div>
                <div><p className="font-medium text-muted-foreground">Email</p><p>{selectedExpert.email || 'N/A'}</p></div>
                <div><p className="font-medium text-muted-foreground">Phone</p><p>{selectedExpert.phone || 'N/A'}</p></div>
                <div><p className="font-medium text-muted-foreground">Company</p><p>{selectedExpert.company || 'N/A'}</p></div>
                <div><p className="font-medium text-muted-foreground">Location</p><p>{selectedExpert.location || 'N/A'}</p></div>
                <div><p className="font-medium text-muted-foreground">Experience</p><p>{selectedExpert.experience_years ? `${selectedExpert.experience_years} years` : 'N/A'}</p></div>
                <div><p className="font-medium text-muted-foreground">User ID</p><p className="text-xs font-mono">{selectedExpert.user_id || 'N/A (seeded)'}</p></div>
                <div><p className="font-medium text-muted-foreground">Submitted</p><p>{new Date(selectedExpert.created_at).toLocaleDateString()}</p></div>
              </div>

              {selectedExpert.bio && (
                <div><p className="text-sm font-medium text-muted-foreground">Bio</p><p className="text-sm mt-1">{selectedExpert.bio}</p></div>
              )}

              {getExpertise(selectedExpert).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expertise</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getExpertise(selectedExpert).map((e, i) => <Badge key={i} variant="outline">{e}</Badge>)}
                  </div>
                </div>
              )}

              {selectedExpert.linkedin_url && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                  <a href={selectedExpert.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">{selectedExpert.linkedin_url}</a>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Verification Documents</p>
                {getDocuments(selectedExpert).length > 0 ? (
                  <div className="space-y-2">
                    {getDocuments(selectedExpert).map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 border rounded">
                        <FileText className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="text-sm flex-1">{doc.name}</span>
                        <span className="text-xs text-muted-foreground">{doc.type}</span>
                        {doc.url && !doc.url.startsWith('local://') && (
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                <div className="mt-1">{getStatusBadge(selectedExpert.verification_status)}</div>
              </div>

              {selectedExpert.verification_status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={() => { handleApprove(selectedExpert.id); setSelectedExpert(null); }} className="flex-1">
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                  </Button>
                  <Button variant="destructive" onClick={() => { handleReject(selectedExpert.id); setSelectedExpert(null); }} className="flex-1">
                    <X className="h-4 w-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
              {selectedExpert.verification_status === 'rejected' && (
                <div className="pt-4 border-t">
                  <Button onClick={() => { handleApprove(selectedExpert.id); setSelectedExpert(null); }} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" /> Re-approve Expert
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExpertApproval;
