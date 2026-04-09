import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

const Layout = () => {
  return (
    <ToastProvider>
      <div className="relative flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "#2A2C2E" }}>
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 bg-white overflow-hidden flex flex-col">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default Layout;
