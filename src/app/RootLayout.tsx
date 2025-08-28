import { Outlet } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";


export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
        <Header />
      
        <main className="flex-1 shrink-0">
            <div className="max-w-7xl mx-auto w-full px-6 py-8">
                <Outlet />
            </div>
        </main>

        <Footer />
    </div>
  );
}
