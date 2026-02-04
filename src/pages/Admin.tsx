
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

const Admin = () => {
  return (
    <AdminProtectedRoute>
      <AdminDashboard />
    </AdminProtectedRoute>
  );
};

export default Admin;
