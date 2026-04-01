import React from "react";

const Navbar = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <nav className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="text-xl font-bold text-gray-900">Asana</div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">
            Home
          </a>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
