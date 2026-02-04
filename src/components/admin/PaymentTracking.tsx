
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

const PaymentTracking = () => {
  const payments = [
    {
      id: "PAY001",
      expert: "Dr. Sarah Johnson",
      client: "Tech Corp",
      amount: "$500",
      status: "Completed",
      date: "2024-01-19",
      dispute: false
    },
    {
      id: "PAY002",
      expert: "Michael Chen",
      client: "StartupXYZ",
      amount: "$300",
      status: "Pending",
      date: "2024-01-18",
      dispute: false
    },
    {
      id: "PAY003",
      expert: "Emily Rodriguez",
      client: "Big Enterprise",
      amount: "$750",
      status: "Disputed",
      date: "2024-01-17",
      dispute: true
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "Disputed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Tracking & Disputes</CardTitle>
      </CardHeader>
      <CardContent>
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
                <TableCell className="font-medium">{payment.id}</TableCell>
                <TableCell>{payment.expert}</TableCell>
                <TableCell>{payment.client}</TableCell>
                <TableCell>{payment.amount}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(payment.status)}
                    <Badge variant={
                      payment.status === "Completed" ? "default" :
                      payment.status === "Pending" ? "secondary" : "destructive"
                    }>
                      {payment.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{payment.date}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                    {payment.dispute && (
                      <Button size="sm" variant="destructive">
                        Resolve Dispute
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PaymentTracking;
