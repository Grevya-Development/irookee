
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type BookingPayment = {
  id: string;
  expert_id: string;
  consumer_id: string;
  total_amount: number | null;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  payment_intent_id?: string | null;
};

const PaymentTracking = () => {
  const [payments, setPayments] = useState<BookingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("expertise_bookings" as never)
        .select("id, expert_id, consumer_id, total_amount, status, scheduled_at, created_at, payment_intent_id")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Failed to load booking payments:", fetchError);
        setError("Failed to load booking payments.");
        setPayments([]);
      } else {
        setPayments((data || []) as BookingPayment[]);
      }

      setLoading(false);
    };

    fetchPayments();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "confirmed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
      case "refunded":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getBadgeVariant = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (["completed", "confirmed"].includes(normalizedStatus)) return "default";
    if (["pending", "in_progress"].includes(normalizedStatus)) return "secondary";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Tracking & Disputes</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No booking payments found.</p>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Expert</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.payment_intent_id || payment.id}</TableCell>
                <TableCell>{payment.expert_id}</TableCell>
                <TableCell>{payment.consumer_id}</TableCell>
                <TableCell>${Number(payment.total_amount || 0).toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(payment.status)}
                    <Badge variant={getBadgeVariant(payment.status)}>
                      {payment.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{new Date(payment.scheduled_at || payment.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      View Details
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
  );
};

export default PaymentTracking;
