import React from "react";
import Button from "@/components/ui/Button";

const HomePage = () => {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Asana</h1>
      <p className="text-gray-600 mb-8">PERN stack boilerplate — ready for Phase 2</p>
      <Button variant="primary">Get Started</Button>
    </main>
  );
};

export default HomePage;
