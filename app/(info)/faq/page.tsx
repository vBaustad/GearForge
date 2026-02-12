import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "FAQ - WoW Housing Questions Answered",
  description:
    "Frequently asked questions about GearForge and WoW player housing. Learn how to upload designs, use import strings, export housing layouts, and share your creations.",
  keywords: [
    "WoW housing FAQ",
    "WoW import string how to",
    "World of Warcraft housing guide",
    "WoW housing export",
    "player housing help",
  ],
};

const faqs = [
  {
    question: "What is GearForge?",
    answer:
      "GearForge is a free community platform for sharing World of Warcraft housing designs. Players can upload their housing creations with screenshots and import strings for others to use.",
  },
  {
    question: "How do I upload a housing design?",
    answer:
      "Log in with your Battle.net account, click 'Upload', and fill in the details. Add screenshots of your design and paste the import string from the game. Choose a category and add tags to help others find your creation.",
  },
  {
    question: "What is an import string in WoW housing?",
    answer:
      "An import string is a code that contains your complete housing layout including furniture placement, decorations, and room setup. In WoW, you can export your housing design to generate this string. Others can then import it to instantly recreate your design in their own home.",
  },
  {
    question: "How do I use someone else's design?",
    answer:
      "Find a design you like on GearForge, click the 'Copy Import String' button, then open World of Warcraft and go to your housing interface. Use the import option and paste the string. The design will be loaded into your home. Note that you'll need to own the decor items used in the design.",
  },
  {
    question: "Is GearForge free?",
    answer:
      "Yes! GearForge is completely free to use. You can browse designs, upload your own creations, like and save favorites, follow creators, and comment on designs without paying anything.",
  },
  {
    question: "Do I need a Battle.net account to use GearForge?",
    answer:
      "You need a Battle.net account to upload designs, save favorites, follow creators, and leave comments. However, browsing all designs is available to everyone without logging in.",
  },
  {
    question: "Can I edit my uploaded designs?",
    answer:
      "Yes, you can edit or delete your designs at any time from your profile page. You can update screenshots, change the description, modify tags, and update the import string.",
  },
  {
    question: "What housing categories are available?",
    answer:
      "GearForge has categories for bedroom, living room, kitchen, garden, tavern, throne room, workshop, library, exterior, and more. Choose the category that best fits your design to help others find it.",
  },
  {
    question: "How do I export my housing design from WoW?",
    answer:
      "In World of Warcraft, open your housing interface and look for the export option. This will generate an import string that you can copy and paste into GearForge when uploading your design.",
  },
  {
    question: "What decor items do I need to recreate a design?",
    answer:
      "Each design on GearForge shows a list of all decor items used. Check the items list before importing to see what you'll need. Items can be obtained from vendors, quests, achievements, and professions.",
  },
  {
    question: "Can I connect my Twitch or YouTube channel?",
    answer:
      "Yes! GearForge lets you connect your Twitch, YouTube, or Kick channel to your profile. This helps viewers find your content and supports creators who stream their housing builds.",
  },
  {
    question: "When did WoW housing come out?",
    answer:
      "World of Warcraft player housing was introduced with The War Within expansion and is being expanded in the Midnight expansion. GearForge was created to help the community share and discover housing designs.",
  },
];

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />
      <div className="container page-section">
        <Breadcrumbs items={[{ label: "FAQ" }]} />
        <div className="content-page">
          <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "var(--space-lg)" }}>
            Frequently Asked Questions
          </h1>
          <p className="text-secondary" style={{ marginBottom: "var(--space-xl)" }}>
            Everything you need to know about WoW housing and GearForge
          </p>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h3 className="faq-question">{faq.question}</h3>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
