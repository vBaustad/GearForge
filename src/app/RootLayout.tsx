// RootLayout.tsx
import { Outlet } from "react-router-dom";
import { Header } from "../components/Header";

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        <Outlet />
      </main>
      {/* <Footer /> */}
    </div>
  );
}
