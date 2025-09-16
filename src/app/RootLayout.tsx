import { Outlet } from "react-router-dom";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { InfoBar } from "../components/InfoBar";
import { GoogleAd } from "../components/ads/GoogleAd";
import { AD_SLOTS } from "../config/ads";


export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col">
        <Header />
        <InfoBar />  

        <div className="px-6 mt-6">
          <div className="max-w-5xl mx-auto">
            <GoogleAd slot={AD_SLOTS.layoutTop} placeholderLabel="Top banner" />
          </div>
        </div>

        <main className="flex-1 shrink-0">
            <div className="max-w-7xl mx-auto w-full px-6 py-8">
                <Outlet />
            </div>
        </main>

        <div className="px-6 mb-6">
          <div className="max-w-5xl mx-auto">
            <GoogleAd slot={AD_SLOTS.layoutFooter} placeholderLabel="Footer banner" />
          </div>
        </div>

        <Footer />
    </div>
  );
}
