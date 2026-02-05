import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about GearForge and WoW player housing. Learn how to upload designs, use import strings, and more.",
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
    question: "What is an import string?",
    answer:
      "An import string is a code that contains your housing layout. In WoW, you can export your housing design to get this string. Others can then import it to recreate your design in their own home.",
  },
  {
    question: "How do I use someone else's design?",
    answer:
      "Find a design you like, click the 'Copy Import String' button, then paste it into WoW's housing import feature. Note that you'll need to own the decor items used in the design.",
  },
  {
    question: "Is GearForge free?",
    answer:
      "Yes! GearForge is completely free to use. You can browse designs, upload your own creations, and save your favorites without paying anything.",
  },
  {
    question: "Do I need a Battle.net account?",
    answer:
      "You need a Battle.net account to upload designs and save favorites. Browsing is available to everyone without logging in.",
  },
  {
    question: "Can I edit my uploaded designs?",
    answer:
      "Yes, you can edit or delete your designs at any time from your profile page.",
  },
  {
    question: "What categories are available?",
    answer:
      "We have categories for bedroom, tavern, garden, library, kitchen, great hall, workshop, shrine, outdoor, and more. Choose the one that best fits your design.",
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
        <div className="content-page">
          <h1 className="font-display" style={{ fontSize: "2rem", marginBottom: "var(--space-lg)" }}>
            Frequently Asked Questions
          </h1>

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
