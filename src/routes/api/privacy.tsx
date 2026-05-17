import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Virtual Lookbook" },
      { name: "description", content: "How Virtual Lookbook collects, uses, and protects your data — clear, human-readable privacy policy." },
      { property: "og:title", content: "Privacy Policy — Virtual Lookbook" },
      { property: "og:description", content: "How Virtual Lookbook collects, uses, and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="PRIVACY POLICY" kicker="Your studio, your data" updated="May 16, 2026">
      <p className="text-muted-foreground mb-8">
        Virtual Lookbook is an independently created fashion-tech studio currently in active beta.
        We built it for ourselves first — so we treat your data the way we'd want ours treated:
        privately, carefully, and never sold.
      </p>

      <LegalSection title="Information We Collect">
        <p>We collect only what we need to run your studio:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your email and authentication details when you sign up</li>
          <li>Content you upload (clothing photos, reference images, lookbooks)</li>
          <li>Studio activity — credits used, models created, looks generated</li>
          <li>Basic technical info (browser, device type) for stability and debugging</li>
        </ul>
      </LegalSection>

      <LegalSection title="User Uploaded Content">
        <p>
          Anything you upload — clothing, reference photos, self-photos, moodboard images — stays
          private to your authenticated account. Other users cannot see your uploads. We do not
          browse, share, or reuse your uploads for marketing or model training.
        </p>
      </LegalSection>

      <LegalSection title="AI Image Generation">
        <p>
          When you generate an image, your prompt and reference images are sent to third-party AI
          providers (such as OpenAI and Google) solely to render the result. Generated outputs are
          stored privately under your account. We do not publish or repurpose your generations.
        </p>
        <p>
          AI providers may briefly process content according to their own policies. We pre-filter
          prompts to reduce moderation issues and to protect inclusive/accessibility content.
        </p>
      </LegalSection>

      <LegalSection title="Account & Authentication">
        <p>
          Accounts are managed through a secure authentication provider. Passwords are never stored
          in plain text. You can sign out, reset your password, or request account deletion at any
          time by contacting us.
        </p>
      </LegalSection>

      <LegalSection title="Credits & Purchases">
        <p>
          Credit purchases are processed by Stripe. We never see or store your full card details —
          only a transaction reference and the credit balance attached to your account.
        </p>
      </LegalSection>

      <LegalSection title="Cookies & Local Storage">
        <p>
          We use a small amount of local storage to remember UI preferences (active theme, layout
          tweaks) and an authentication session. No advertising cookies. No cross-site tracking.
        </p>
      </LegalSection>

      <LegalSection title="Data Security">
        <p>
          Your studio data is protected with Row Level Security (RLS) so each user can only access
          their own rows in our database. Files are stored privately and served through signed,
          short-lived URLs. We use HTTPS everywhere.
        </p>
      </LegalSection>

      <LegalSection title="User Rights">
        <p>You can at any time:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Access the content under your account</li>
          <li>Delete individual items, looks, models, or collections</li>
          <li>Request full account and data deletion by emailing us</li>
          <li>Export your data on request</li>
        </ul>
      </LegalSection>

      <LegalSection title="Content Ownership">
        <p>
          You retain ownership of everything you upload — your clothing photos, your reference
          images, your own likeness. You also own the AI-generated images created in your account,
          subject to the terms of the underlying AI providers.
        </p>
      </LegalSection>

      <LegalSection title="Third-Party Services">
        <p>Virtual Lookbook is built on a small number of trusted providers:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Supabase</strong> — authentication, database, file storage</li>
          <li><strong>Stripe</strong> — payment processing</li>
          <li><strong>OpenAI &amp; Google</strong> — AI image generation</li>
          <li><strong>Cloud hosting</strong> — serving the app to your browser</li>
        </ul>
        <p>Each provider has its own privacy policy and security standards.</p>
      </LegalSection>

      <LegalSection title="Accessibility & Inclusivity">
        <p>
          We actively support inclusive model generation — including mobility aids, prosthetics,
          seated poses, limb differences, and little-person representation. Accessibility-related
          prompts and references are preserved during prompt safety filtering and are never
          treated as content to remove or downgrade.
        </p>
      </LegalSection>

      <LegalSection title="Children's Privacy">
        <p>
          Virtual Lookbook is not directed at children under 13. Accounts are intended for adults
          and older teens with parental permission. We do not knowingly collect data from young
          children, and we apply stricter prompt filtering to any child or infant references.
        </p>
      </LegalSection>

      <LegalSection title="Contact Information">
        <p>
          Questions, deletion requests, or privacy concerns — reach the creator directly at{" "}
          <a className="text-primary underline" href="mailto:neshadenise@gmail.com">neshadenise@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}