import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ThemeProvider } from "@/components/theme-provider";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import UpdatePassword from "./pages/auth/UpdatePassword";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";

import StudentSubmissions from "./pages/student/StudentSubmissions";
import AIAssistant from "./pages/student/AIAssistant";
import VirtualProfessor from "./pages/student/VirtualProfessor";
import StudentResearch from "./pages/student/StudentResearch";

// Mentor Pages
import MentorDashboard from "./pages/mentor/MentorDashboard";
import MyGroups from "./pages/mentor/MyGroups";
import Notices from "./pages/mentor/Notices";
import AssignTask from "./pages/mentor/AssignTask";
import Analytics from "./pages/mentor/Analytics";
import ResearchPapers from "./pages/mentor/ResearchPapers";


// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Shared Pages
import GroupDetail from "./pages/group/GroupDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    {/* Theme Provider handles Dark/Light mode across the whole app */}
    <ThemeProvider defaultTheme="system" storageKey="trackit-theme">
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
              <Route path="/update-password" element={<UpdatePassword />} />

              {/* Student Routes */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/submissions/*"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentSubmissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/ai-assistant"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <AIAssistant />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/research"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentResearch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/virtual-professor"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <VirtualProfessor />
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
              <Route
                path="/mentor/research"
                element={
                  <ProtectedRoute allowedRoles={["mentor"]}>
                    <ResearchPapers />
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
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;