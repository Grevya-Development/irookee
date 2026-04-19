import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, XCircle, Loader2, UserX, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingRow {
  id: string;
  event_name: string;
  event_date: string | null;
  duration_hours: number | null;
  status: string | null;
  customer_name: string | null;
  customer_email: string | null;
  notes: string | null;
  expert_id: string;
  created_at: string;
  expert_name?: string;
}

const PaymentTracking = () => {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Fetch bookings
      let query = supabase
        .from('expertise_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: bookingData, error: bookingError } = await query;
      if (bookingError) {
        console.error('Booking fetch error:', bookingError);
        toast({ title: "Error", description: bookingError.message, variant: "destructive" });
        setBookings([]);
        return;
      }

      const rawBookings = (bookingData || []) as any[];

      // Fetch expert names for all unique expert_ids
      const expertIds = [...new Set(rawBookings.map(b => b.expert_id).filter(Boolean))];
      let expertMap: Record<string, string> = {};

      if (expertIds.length > 0) {
        const { data: experts } = await supabase
          .from('speakers')
          .select('id, name')
          .in('id', expertIds);

        if (experts) {
          experts.forEach(e => { expertMap[e.id] = e.name || 'Unknown'; });
        }
      }

      const enriched: BookingRow[] = rawBookings.map(b => ({
        id: b.id,
        event_name: b.event_name || 'Session',
        event_date: b.event_date,
        duration_hours: b.duration_hours,
        status: b.status,
        customer_name: b.customer_name,
        customer_email: b.customer_email,
        notes: b.notes,
        expert_id: b.expert_id,
        created_at: b.created_at,
        expert_name: expertMap[b.expert_id] || 'N/A',
      }));

      setBookings(enriched);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('expertise_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      toast({ title: "Updated", description: `Booking marked as ${newStatus.replace('_', ' ')}` });
      fetchBookings();
      setSelectedBooking(null);
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: "Error", description: error?.message || "Failed to update", variant: "destructive" });
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'confirmed': return <Video className="h-4 w-4 text-blue-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'no_show': return <UserX className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variant = status === 'completed' ? 'default' :
      status === 'confirmed' ? 'secondary' :
      status === 'cancelled' || status === 'no_show' ? 'destructive' : 'outline';
    return <Badge variant={variant}>{getStatusIcon(status)}<span className="ml-1">{(status || 'unknown').replace('_', ' ')}</span></Badge>;
  };

  if (loading) {
    return <Card><CardContent className="py-8 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Booking Management ({bookings.length})</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No bookings found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Expert</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.event_name}</TableCell>
                    <TableCell>{b.expert_name}</TableCell>
                    <TableCell>{b.customer_name || 'N/A'}</TableCell>
                    <TableCell>{b.event_date ? new Date(b.event_date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(b.status)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setSelectedBooking(b)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Booking Details</DialogTitle></DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="font-medium text-muted-foreground">Session</p><p>{selectedBooking.event_name}</p></div>
                <div><p className="font-medium text-muted-foreground">Expert</p><p>{selectedBooking.expert_name}</p></div>
                <div><p className="font-medium text-muted-foreground">Client</p><p>{selectedBooking.customer_name || 'N/A'}</p></div>
                <div><p className="font-medium text-muted-foreground">Email</p><p>{selectedBooking.customer_email || 'N/A'}</p></div>
                <div><p className="font-medium text-muted-foreground">Date</p><p>{selectedBooking.event_date ? new Date(selectedBooking.event_date).toLocaleString() : 'N/A'}</p></div>
                <div><p className="font-medium text-muted-foreground">Duration</p><p>{selectedBooking.duration_hours ? `${selectedBooking.duration_hours}h` : 'N/A'}</p></div>
              </div>
              {selectedBooking.notes && (
                <div><p className="text-sm font-medium text-muted-foreground">Notes</p><p className="text-sm">{selectedBooking.notes}</p></div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'confirmed', 'completed', 'no_show', 'cancelled'].map(status => (
                    <Button key={status} size="sm"
                      variant={selectedBooking.status === status ? 'default' : 'outline'}
                      onClick={() => updateBookingStatus(selectedBooking.id, status)}
                    >
                      {getStatusIcon(status)} <span className="ml-1">{status.replace('_', ' ')}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentTracking;
