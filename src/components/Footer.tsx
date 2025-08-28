// src/components/Footer.tsx
import { Link } from "react-router-dom";
import { Github, Linkedin, Mail, Coffee } from "lucide-react";

// --- Customize here ---
const EMAIL = ""; // e.g. "hello@gearforge.dev" (leave empty to hide)
const LINKS = {
  githubRepo: "https://github.com/vBaustad/GearForge",
  linkedin: "https://www.linkedin.com/in/vBaustad/",
  coffee: "https://buymeacoffee.com/vbaustad",
  faq: "/faq",
  terms: "/terms",
  privacy: "/privacy",
};

// Build info (injected by Vite define; with safe fallbacks)
const appVersion =
  typeof __APP_VERSION__ !== "undefined" && __APP_VERSION__ ? __APP_VERSION__ : "0.0.0";
const gitSha =
  typeof __GIT_SHA__ !== "undefined" && __GIT_SHA__ ? __GIT_SHA__.slice(0, 7) : "local";

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-md border border-gray-800 bg-gray-900/60 open:bg-gray-900">
      <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-md px-4 py-3 text-gray-200 hover:text-yellow-500">
        <span>{q}</span>
        <svg
          className="h-4 w-4 transition-transform group-open:rotate-180"
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </summary>
      <div className="px-4 pb-4 text-sm text-gray-400">{a}</div>
    </details>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* About (DGRoutePlanner-inspired copy structure) */}
          <section>
            <h3 className="text-white text-lg font-semibold">About</h3>
            <p className="mt-4 leading-relaxed text-gray-400">
              <span className="font-semibold text-yellow-500">GearForge</span> helps you
              analyze and optimize your game gear and content workflows—fast, clear,
              and focused.
            </p>
            <ul className="mt-4 space-y-2 text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                <span>Actionable optimizers and analyzers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                <span>Free to use while in active development</span>
              </li>
            </ul>
          </section>

          {/* Quick Links */}
          <section>
            <h3 className="text-white text-lg font-semibold">Quick Links</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to={LINKS.faq} className="hover:text-yellow-500 transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to={LINKS.terms} className="hover:text-yellow-500 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to={LINKS.privacy} className="hover:text-yellow-500 transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </section>

          {/* FAQ (three compact items like DGRP) */}
          <section>
            <h3 className="text-white text-lg font-semibold">FAQ</h3>
            <div className="mt-4 space-y-3">
              <FaqItem q="What is GearForge?" a="A growing set of optimizers and analyzers to help you min-max smarter." />
              <FaqItem q="Is GearForge free?" a="Yes, during active development. Some advanced features may become premium later." />
              <FaqItem q="How do I report an issue?" a="Open an issue on the GitHub repo or send us an email." />
            </div>
          </section>
        </div>

        {/* Divider */}
        <div className="mt-10 border-t border-gray-800" />

        {/* Bottom bar (left: copyright + version + legal · right: socials like DGRP) */}
        <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm">
          <div className="text-gray-400">
            © {year} GearForge
            <span className="mx-2">·</span> v{appVersion}
            <span className="mx-2">·</span> {gitSha}
            <span className="mx-2">·</span>
            <Link to={LINKS.terms} className="hover:text-yellow-500">Terms</Link>
            <span className="mx-2">·</span>
            <Link to={LINKS.privacy} className="hover:text-yellow-500">Privacy</Link>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-gray-400">
            {EMAIL && (
              <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 hover:text-yellow-500">
                <Mail className="h-4 w-4" /> Email
              </a>
            )}
            <a href={LINKS.githubRepo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-yellow-500">
              <Github className="h-4 w-4" /> GitHub Repo
            </a>
            <a href={LINKS.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-yellow-500">
              <Linkedin className="h-4 w-4" /> LinkedIn
            </a>
            <a href={LINKS.coffee} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-yellow-500">
              <Coffee className="h-4 w-4" /> Buy Me a Coffee
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
