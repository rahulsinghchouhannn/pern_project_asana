import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

const Layout = () => {
  return (
    <ToastProvider>
      <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "#1F1F1F" }}>
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 bg-white overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default Layout;
