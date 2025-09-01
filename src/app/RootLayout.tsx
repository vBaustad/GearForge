import { Outlet } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { InfoBar } from "../components/InfoBar";


export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
        <Header />
        <InfoBar />  
        <main className="flex-1 shrink-0">
            <div className="max-w-7xl mx-auto w-full px-6 py-8">
                <Outlet />
            </div>
        </main>

        <Footer />
    </div>
  );
}
