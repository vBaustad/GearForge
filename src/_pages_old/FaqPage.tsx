import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { SEO, createFaqSchema } from "@/components/SEO";

interface FaqItem {
  question: string;
  answer: string | React.ReactNode;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is GearForge?",
    answer: "GearForge is a community platform for sharing World of Warcraft housing designs. Players can upload their creations with screenshots and import strings, allowing others to easily recreate designs in their own game."
  },
  {
    question: "Is GearForge free to use?",
    answer: "Yes! GearForge is completely free and always will be. There are no premium features, paywalls, or subscriptions."
  },
  {
    question: "Do I need an account to browse designs?",
    answer: "No, you can browse and view all designs without logging in. However, you'll need to log in with your Battle.net account to upload designs, like designs, or save favorites."
  },
  {
    question: "Is it safe to log in with Battle.net?",
    answer: "Yes. We use Blizzard's official OAuth system, which means we never see your password. We only receive your BattleTag and a unique identifier - we cannot access your WoW account, characters, or any sensitive information."
  },
  {
    question: "How do I export my housing design from WoW?",
    answer: (
      <span>
        Open your housing in edit mode, find the Export option in the housing UI, and copy the export string.
        Check our <Link to="/help#exporting" className="text-accent">detailed guide</Link> for step-by-step instructions.
      </span>
    )
  },
  {
    question: "How do I import a design I found on GearForge?",
    answer: (
      <span>
        Copy the import string from the design page, open your housing in WoW, go to the Import option,
        and paste the string. See our <Link to="/help#importing" className="text-accent">importing guide</Link> for details.
      </span>
    )
  },
  {
    question: "Will importing a design delete my current housing?",
    answer: "Yes, importing a design will replace your current housing layout. We recommend exporting your current design first as a backup before importing something new."
  },
  {
    question: "Can I edit or delete my uploaded designs?",
    answer: "Yes! When viewing a design you uploaded, you'll see an \"Edit Design\" button that lets you update the title, description, category, and tags. You can also delete the design from the edit page."
  },
  {
    question: "Someone stole my design. What can I do?",
    answer: "If someone has uploaded your design without permission, please use the \"Report\" button on the design page and select \"Stolen design (not original)\" as the reason. We'll review the report and take appropriate action."
  },
  {
    question: "What categories are available?",
    answer: "We currently support: Bedroom, Tavern, Garden, Library, Kitchen, Great Hall, Workshop, Shrine, Outdoor, and Other. Choose the one that best fits your design's primary theme."
  },
  {
    question: "How many images can I upload?",
    answer: "You can upload 1-5 screenshots per design. The first image becomes your thumbnail, so make sure it's a good one that showcases your design!"
  },
  {
    question: "Is GearForge affiliated with Blizzard?",
    answer: "No. GearForge is a fan-made community project and is not affiliated with or endorsed by Blizzard Entertainment. World of Warcraft is a trademark of Blizzard Entertainment, Inc."
  },
  {
    question: "I found a bug or have a suggestion. How do I report it?",
    answer: (
      <span>
        We'd love to hear from you! You can report bugs or suggest features on our{" "}
        <a href="https://github.com/vBaustad/GearForge/issues" target="_blank" rel="noopener noreferrer" className="text-accent">
          GitHub Issues page
        </a>{" "}
        or reach out via the links on our <Link to="/about" className="text-accent">About page</Link>.
      </span>
    )
  }
];

function FaqAccordion({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="faq-item">
      <button
        className="faq-question"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {isOpen && (
        <div className="faq-answer">
          <p>{item.answer}</p>
        </div>
      )}
    </div>
  );
}

// Plain text versions for JSON-LD schema (Google rich snippets)
const FAQ_SCHEMA_ITEMS = [
  {
    question: "What is GearForge?",
    answer: "GearForge is a community platform for sharing World of Warcraft housing designs. Players can upload their creations with screenshots and import strings, allowing others to easily recreate designs in their own game.",
  },
  {
    question: "Is GearForge free to use?",
    answer: "Yes! GearForge is completely free and always will be. There are no premium features, paywalls, or subscriptions.",
  },
  {
    question: "Do I need an account to browse designs?",
    answer: "No, you can browse and view all designs without logging in. However, you'll need to log in with your Battle.net account to upload designs, like designs, or save favorites.",
  },
  {
    question: "Is it safe to log in with Battle.net?",
    answer: "Yes. We use Blizzard's official OAuth system, which means we never see your password. We only receive your BattleTag and a unique identifier.",
  },
  {
    question: "How do I export my housing design from WoW?",
    answer: "Open your housing in edit mode, find the Export option in the housing UI, and copy the export string. Check our help guide for step-by-step instructions.",
  },
  {
    question: "How do I import a design I found on GearForge?",
    answer: "Copy the import string from the design page, open your housing in WoW, go to the Import option, and paste the string.",
  },
  {
    question: "Will importing a design delete my current housing?",
    answer: "Yes, importing a design will replace your current housing layout. We recommend exporting your current design first as a backup before importing something new.",
  },
  {
    question: "Is GearForge affiliated with Blizzard?",
    answer: "No. GearForge is a fan-made community project and is not affiliated with or endorsed by Blizzard Entertainment.",
  },
];

export function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqSchema = createFaqSchema(FAQ_SCHEMA_ITEMS);

  return (
    <>
      <SEO
        title="FAQ - GearForge"
        description="Frequently asked questions about GearForge. Learn how to upload, browse, and share WoW housing designs. Get help with import strings and Battle.net login."
        url="/faq"
        keywords="WoW housing FAQ, GearForge help, World of Warcraft housing questions, WoW import string help, WoW housing how to, is WoW housing free, WoW housing Battle.net login, WoW housing export import, TWW housing FAQ"
        jsonLd={faqSchema}
      />
      <div className="container page-section">
        {/* Hero */}
        <div style={{ maxWidth: '720px', marginBottom: 'var(--space-3xl)' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', marginBottom: 'var(--space-md)' }}>
            Frequently Asked Questions
          </h1>
        <p className="text-secondary" style={{ fontSize: '1.125rem', lineHeight: 1.7 }}>
          Everything you need to know about using GearForge.
        </p>
      </div>

      {/* FAQ List */}
      <div style={{ maxWidth: '800px' }}>
        {FAQ_ITEMS.map((item, index) => (
          <FaqAccordion
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>

      {/* Still Have Questions */}
      <div style={{ maxWidth: '800px', marginTop: 'var(--space-3xl)' }}>
        <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
          <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Still have questions?</h3>
          <p className="text-secondary" style={{ marginBottom: 'var(--space-lg)' }}>
            Can't find what you're looking for? Check our help guide or get in touch.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <Link to="/help" className="btn btn-primary">
              View Help Guide
            </Link>
            <Link to="/about" className="btn btn-secondary">
              Contact Us
            </Link>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
