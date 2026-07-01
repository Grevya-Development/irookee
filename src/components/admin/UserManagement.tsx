import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
          .select('user_id')
          .in('user_id', userIds);

        bookingCounts = (bookingData || []).reduce((acc, booking) => {
          if (booking.user_id) acc[booking.user_id] = (acc[booking.user_id] || 0) + 1;
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
                    <Badge variant={user.user_type === 'expert' ? 'default' : 'secondary'}>
                      {user.user_type || 'consumer'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.bookings_count || 0} booking(s)</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                      <Eye className="h-4 w-4" />
                    </Button>
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
    </>
  );
};

export default UserManagement;
