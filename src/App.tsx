import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";

// Mentor Pages
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MyGroups from "./pages/mentor/MyGroups";
import Notices from "./pages/mentor/Notices";
import AssignTask from "./pages/mentor/AssignTask";
import Analytics from "./pages/mentor/Analytics";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Shared Pages
import GroupDetail from "./pages/group/GroupDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Student Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Mentor Routes */}
            <Route
              path="/mentor/dashboard"
              element={
                <ProtectedRoute allowedRoles={["mentor"]}>
                  <MentorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/groups"
              element={
                <ProtectedRoute allowedRoles={["mentor"]}>
                  <MyGroups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/notices"
              element={
                <ProtectedRoute allowedRoles={["mentor"]}>
                  <Notices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/tasks/assign"
              element={
                <ProtectedRoute allowedRoles={["mentor"]}>
                  <AssignTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mentor/analytics"
              element={
                <ProtectedRoute allowedRoles={["mentor"]}>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Shared Routes */}
            <Route
              path="/group/:id"
              element={
                <ProtectedRoute allowedRoles={["student", "mentor", "admin"]}>
                  <GroupDetail />
                </ProtectedRoute>
              }
            />

            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
