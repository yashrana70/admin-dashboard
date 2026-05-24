import { useState } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import DashboardHome from "./pages/DashboardHome";
import ProfilePanel from "./pages/ProfilePanel";
import SadhnaPanel from "./pages/SadhnaPanel";
import SevaPanel from "./pages/SevaPanel";
import UsersPanel from "./pages/UsersPanel";
import AttendancePanel from "./pages/AttendancePanel";
import Leaderboard from "./pages/Leaderboard";
import EventsPanel from "./pages/EventsPanel";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <I18nProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/" element={<DashboardHome />} />
                  <Route path="/profile" element={<ProfilePanel />} />
                  <Route path="/attendance" element={<AttendancePanel />} />
                  <Route path="/sadhna" element={<SadhnaPanel />} />
                  <Route path="/seva" element={<SevaPanel />} />
                  <Route path="/users" element={<UsersPanel />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/events" element={<EventsPanel />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
