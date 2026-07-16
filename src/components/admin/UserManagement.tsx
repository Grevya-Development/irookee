import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Eye, Edit, Trash2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  user_type: string | null;
  created_at: string;
  bookings_count?: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userRows = data || [];
      const userIds = userRows.map((user) => user.id);
      let bookingCounts: Record<string, number> = {};

      if (userIds.length > 0) {
        const { data: bookingData } = await supabase
          .from('expertise_bookings')
          .select('consumer_id')
          .in('consumer_id', userIds);

        bookingCounts = (bookingData || []).reduce((acc, booking) => {
          if (booking.consumer_id) acc[booking.consumer_id] = (acc[booking.consumer_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }

      setUsers(userRows.map((user) => ({ ...user, bookings_count: bookingCounts[user.id] || 0 })));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    setActionLoading(editingUser.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim(), user_type: editType })
        .eq('id', editingUser.id);
      if (error) throw error;
      toast({ title: "User Updated", description: "The user details have been updated." });
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast({
        title: "Update Failed",
        description: "Could not update user details",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleSuspend = async (user: UserRow) => {
    setActionLoading(user.id);
    const nextType = user.user_type === 'suspended' ? 'consumer' : 'suspended';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: nextType })
        .eq('id', user.id);
      if (error) throw error;

      // Sync suspension to speakers table if exists
      const { data: speaker } = await supabase
        .from('speakers')
        .select('id, suspension_history')
        .eq('user_id', user.id)
        .maybeSingle();

      if (speaker) {
        const history = Array.isArray(speaker.suspension_history) ? speaker.suspension_history : [];
        const action = nextType === 'suspended' ? 'suspended' : 'unsuspended';
        const updatedHistory = [
          ...history,
          {
            action,
            reason: nextType === 'suspended' ? "Suspended by admin in User Management" : "Unsuspended by admin in User Management",
            timestamp: new Date().toISOString(),
          }
        ];

        await supabase
          .from('speakers')
          .update({
            verification_status: nextType === 'suspended' ? 'suspended' : 'verified',
            is_verified: nextType === 'suspended' ? false : undefined,
            suspension_reason: nextType === 'suspended' ? "Suspended by admin in User Management" : null,
            suspended_at: nextType === 'suspended' ? new Date().toISOString() : null,
            suspension_history: updatedHistory,
          } as never)
          .eq('id', speaker.id);
      }

      toast({
        title: nextType === 'suspended' ? "User Suspended" : "User Unsuspended",
        description: `User role has been updated to ${nextType}`,
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast({
        title: "Action Failed",
        description: "Could not update user suspension status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you absolutely sure you want to delete this user? This will delete all of their bookings, reviews, and profile data permanently!")) return;
    setActionLoading(userId);
    try {
      const { error: funcError } = await supabase.functions.invoke('delete-account', {
        body: { target_user_id: userId },
      });

      if (funcError) throw funcError;

      toast({ title: "User Deleted", description: "User account and all associated data have been permanently deleted." });
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast({
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "Could not delete user account",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => {
    if (typeFilter !== 'all' && (user.user_type || 'consumer') !== typeFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      user.user_type?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>User Management ({users.length} users)</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Filter type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="consumer">Consumers</SelectItem>
              <SelectItem value="expert">Experts</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredUsers.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No users found</p>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                  <TableCell>{user.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={user.user_type === 'expert' ? 'default' : user.user_type === 'suspended' ? 'destructive' : 'secondary'}>
                      {user.user_type || 'consumer'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.bookings_count || 0} booking(s)</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" title="View details" onClick={() => setSelectedUser(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Edit User"
                        onClick={() => {
                          setEditingUser(user);
                          setEditName(user.full_name || "");
                          setEditType(user.user_type || "consumer");
                          setIsEditDialogOpen(true);
                        }}
                        disabled={actionLoading === user.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={user.user_type === 'suspended' ? 'default' : 'outline'}
                        title={user.user_type === 'suspended' ? 'Unsuspend User' : 'Suspend User'}
                        onClick={() => handleToggleSuspend(user)}
                        disabled={actionLoading === user.id}
                      >
                        <ShieldAlert className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        title="Delete User"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={actionLoading === user.id}
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
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

    <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        {selectedUser && (
          <div className="space-y-3 text-sm">
            <div><p className="font-medium text-muted-foreground">Name</p><p>{selectedUser.full_name || 'N/A'}</p></div>
            <div><p className="font-medium text-muted-foreground">Email</p><p>{selectedUser.email || 'N/A'}</p></div>
            <div><p className="font-medium text-muted-foreground">Type</p><p>{selectedUser.user_type || 'consumer'}</p></div>
            <div><p className="font-medium text-muted-foreground">Activity</p><p>{selectedUser.bookings_count || 0} booking(s)</p></div>
            <div><p className="font-medium text-muted-foreground">Joined</p><p>{new Date(selectedUser.created_at).toLocaleString()}</p></div>
            <div><p className="font-medium text-muted-foreground">User ID</p><p className="font-mono text-xs break-all">{selectedUser.id}</p></div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-type">User Type</Label>
            <Select value={editType} onValueChange={setEditType}>
              <SelectTrigger id="edit-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consumer">Consumer</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditUser} disabled={!!actionLoading}>
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default UserManagement;
