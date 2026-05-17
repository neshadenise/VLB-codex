import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Virtual Lookbook" },
      { name: "description", content: "The terms for using Virtual Lookbook — fair, plain-language rules for our AI fashion styling studio." },
      { property: "og:title", content: "Terms of Service — Virtual Lookbook" },
      { property: "og:description", content: "Fair, plain-language terms for using Virtual Lookbook." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="TERMS OF SERVICE" kicker="Fair use, plainly written" updated="May 16, 2026">
      <p className="text-muted-foreground mb-8">
        Virtual Lookbook is a small, independent AI styling studio currently in beta. These terms
        are intentionally simple — they describe how to use the platform responsibly and what to
        expect from us in return.
      </p>

      <LegalSection title="Acceptance of Terms">
        <p>
          By creating an account or using Virtual Lookbook, you agree to these terms and to our
          Privacy Policy. If you don't agree, please don't use the service.
        </p>
      </LegalSection>

      <LegalSection title="User Accounts">
        <p>
          You're responsible for keeping your login secure and for activity under your account.
          One account per person. Don't share credentials. You must be old enough to legally enter
          into this agreement in your country.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable Use">
        <p>
          Use Virtual Lookbook for fashion, styling, creative exploration, and personal projects.
          Don't use it to harass, deceive, scrape other users' content, or work around platform
          limits.
        </p>
      </LegalSection>

      <LegalSection title="AI Generated Content">
        <p>
          AI outputs vary. Results may not perfectly reflect your prompt, your uploads, or real-world
          anatomy. We continuously tune prompt safety, model selection, and rendering quality, but
          generations are not guaranteed.
        </p>
        <p>
          Generated images created in your account are yours to use, subject to the terms of the
          underlying AI providers (OpenAI, Google, etc.).
        </p>
      </LegalSection>

      <LegalSection title="Uploaded Images & Clothing">
        <p>
          Only upload images you have the right to use — your own clothing photos, your own
          reference shots, photos you've been given permission to use. Don't upload stolen images,
          paparazzi shots, or someone else's likeness without consent.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual Property">
        <p>
          You retain ownership of everything you upload. We retain ownership of the Virtual Lookbook
          brand, app, code, and design system. You may freely share images you create in your
          studio; a kind credit back to us is appreciated but never required.
        </p>
      </LegalSection>

      <LegalSection title="Credits & Purchases">
        <p>
          Credits are a digital, non-transferable balance used to render AI generations. Pricing,
          bonus credits, and pack contents may change over time. Purchases are handled by Stripe.
        </p>
      </LegalSection>

      <LegalSection title="Refund Policy">
        <p>
          Because credits unlock immediate AI generation costs from third-party providers, all
          purchases are generally final. If something genuinely goes wrong on our end — a failed
          generation we can't recover, a duplicate charge, a platform outage — email us and we'll
          make it right with replacement credits or a refund at our discretion.
        </p>
      </LegalSection>

      <LegalSection title="Prohibited Content">
        <p>You may not generate, upload, or share content that is:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Illegal in your jurisdiction or in ours</li>
          <li>Sexual content involving minors, in any form, ever</li>
          <li>Hateful, harassing, or targeted at protected groups</li>
          <li>Impersonating real people without consent</li>
          <li>Explicit pornography, exploitation, or non-consensual imagery</li>
          <li>Designed to defraud, deceive, or abuse other users</li>
        </ul>
        <p>Violations may result in immediate suspension and account termination.</p>
      </LegalSection>

      <LegalSection title="Accessibility & Inclusive Usage">
        <p>
          Generating models with mobility aids, prosthetics, limb differences, seated poses, or
          little-person representation is encouraged and protected. Our prompt safety system is
          tuned to preserve accessibility detail rather than strip it.
        </p>
      </LegalSection>

      <LegalSection title="Service Availability">
        <p>
          Virtual Lookbook is provided on an "as-is, as-available" basis while we're in beta.
          Features may change, ship, or be removed as we iterate. We aim for stability but can't
          guarantee uninterrupted service.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of Liability">
        <p>
          To the maximum extent allowed by law, Virtual Lookbook and its creator are not liable for
          indirect, incidental, or consequential damages arising from use of the platform. Our total
          liability is limited to the amount you've paid us in the last 12 months.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          You may close your account at any time. We may suspend or terminate accounts that violate
          these terms, abuse credit/refund systems, or put other users or the platform at risk.
          Admin and moderation rights are reserved.
        </p>
      </LegalSection>

      <LegalSection title="Changes to Terms">
        <p>
          We may update these terms as the platform grows. Significant changes will be announced in
          the app or by email. Continued use after changes means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact Information">
        <p>
          Questions, reports, or anything else — reach the creator directly at{" "}
          <a className="text-primary underline" href="mailto:neshadenise@gmail.com">neshadenise@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}