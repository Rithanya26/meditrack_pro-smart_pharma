import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import TopNav from "../components/layout/TopNav";
import ChatbotWidget from "../components/chatbot/ChatbotWidget";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 print:bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 print:p-0">
          <div className="max-w-7xl mx-auto print:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Floating MediTrack Chatbot Widget */}
      <div className="print:hidden">
        <ChatbotWidget />
      </div>
    </div>
  );
}
