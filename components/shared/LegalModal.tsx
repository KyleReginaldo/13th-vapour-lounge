"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, FileText, Shield } from "lucide-react";
import { useRef, useState } from "react";

const TERMS_CONTENT = (
  <div className="space-y-5 text-sm leading-relaxed text-gray-700">
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">
        1. Acceptance of Terms
      </h3>
      <p>
        By creating an account and using 13th Vapour Lounge, you agree to comply
        with all applicable laws and regulations, and these Terms of Service. If
        you do not agree, please do not use our services.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">2. Age Requirement</h3>
      <p>
        You confirm that you are <strong>18 years of age or older</strong>. Our
        products — including e-liquids, nicotine pouches, and vaping devices —
        are intended exclusively for legal-age adults. We reserve the right to
        verify your age and refuse service if you are underage.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">
        3. Account Responsibilities
      </h3>
      <p>
        You are responsible for maintaining the confidentiality of your account
        credentials. You agree not to misrepresent your identity or age. Any
        activity under your account is your responsibility.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">
        4. Purchases & Refunds
      </h3>
      <p>
        All purchases are subject to our return and refund policy. Products
        containing nicotine are addictive; we encourage responsible use. We
        reserve the right to cancel orders at our discretion.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">5. Health Disclaimer</h3>
      <p>
        Nicotine and vaping products carry health risks. Our products are not
        intended to diagnose, treat, cure, or prevent any disease. Use at your
        own risk. Keep products away from children and pets.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">
        6. Intellectual Property
      </h3>
      <p>
        All content on this website — including logos, images, and text — is
        owned by 13th Vapour Lounge and may not be reproduced without
        permission.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">
        7. Limitation of Liability
      </h3>
      <p>
        13th Vapour Lounge is not liable for any indirect, incidental, or
        consequential damages arising from your use of our products or services.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">8. Governing Law</h3>
      <p>
        These terms are governed by the laws of the Republic of the Philippines.
        Any disputes shall be resolved in the appropriate courts of Cavite.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">9. Updates to Terms</h3>
      <p>
        We may update these Terms at any time. Continued use of the platform
        after changes constitutes acceptance of the new terms.
      </p>
    </section>
    <p className="text-xs text-gray-400 pt-2">Last updated: February 2026</p>
  </div>
);

const PRIVACY_CONTENT = (
  <div className="space-y-5 text-sm leading-relaxed text-gray-700">
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">
        1. Information We Collect
      </h3>
      <p>
        We collect personal information including your name, email address,
        contact number, date of birth, and shipping address — solely for the
        purpose of order processing and account management.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">
        2. ID Verification Documents
      </h3>
      <p>
        For age verification, we may collect government-issued ID documents.
        These are stored securely and used exclusively for verifying that you
        meet the legal age requirement (18+). Documents are not shared with
        third parties.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">
        3. How We Use Your Data
      </h3>
      <p>
        Your data is used to process orders, manage your account, send
        transactional emails (order confirmations, shipping updates), and comply
        with legal obligations. We do not sell your personal information.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">4. Data Sharing</h3>
      <p>
        We do not share your personal data with third parties without your
        consent, except as required by Philippine law (Republic Act 10173 — Data
        Privacy Act of 2012).
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">5. Cookies</h3>
      <p>
        We use cookies to improve your browsing experience, remember your
        preferences, and analyze site traffic. You can disable cookies in your
        browser settings, though some features may not work properly.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">6. Data Security</h3>
      <p>
        We implement reasonable security measures to protect your personal
        information from unauthorized access, disclosure, or loss. However, no
        method of transmission over the internet is 100% secure.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">7. Your Rights</h3>
      <p>
        Under the Data Privacy Act of 2012, you have the right to access,
        correct, or request deletion of your personal data. Contact us at our
        store to exercise these rights.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">8. Retention</h3>
      <p>
        We retain your data only as long as necessary to fulfill the purposes
        outlined in this policy, or as required by law.
      </p>
    </section>
    <section>
      <h3 className="font-semibold text-gray-900 mb-2">
        9. Changes to This Policy
      </h3>
      <p>
        We may update this Privacy Policy periodically. We will notify you of
        significant changes via email or a notice on our website.
      </p>
    </section>
    <p className="text-xs text-gray-400 pt-2">Last updated: February 2026</p>
  </div>
);

// ─── Read-only modal (for footer / profile links) ────────────────────────────
interface LegalModalProps {
  type: "terms" | "privacy";
  trigger: React.ReactNode;
}

export function LegalModal({ type, trigger }: LegalModalProps) {
  const [open, setOpen] = useState(false);
  const isTerms = type === "terms";

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-full p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gray-50">
            <DialogTitle className="flex items-center gap-2 text-base">
              {isTerms ? (
                <FileText className="h-4 w-4 text-gray-600" />
              ) : (
                <Shield className="h-4 w-4 text-gray-600" />
              )}
              {isTerms ? "Terms of Service" : "Privacy Policy"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] px-6 py-5">
            {isTerms ? TERMS_CONTENT : PRIVACY_CONTENT}
          </ScrollArea>
          <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
            <Button size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Accept modal (for sign-up — requires scrolling to enable) ───────────────
interface LegalAcceptModalProps {
  type: "terms" | "privacy";
  trigger: React.ReactNode;
  onAccepted: () => void;
  accepted: boolean;
}

export function LegalAcceptModal({
  type,
  trigger,
  onAccepted,
  accepted,
}: LegalAcceptModalProps) {
  const [open, setOpen] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isTerms = type === "terms";

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setScrolledToBottom(true);
    }
  }

  function handleAccept() {
    onAccepted();
    setOpen(false);
  }

  function handleOpen() {
    setScrolledToBottom(false);
    setOpen(true);
  }

  return (
    <>
      <span onClick={handleOpen} className="cursor-pointer">
        {trigger}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-full p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gray-50">
            <DialogTitle className="flex items-center gap-2 text-base">
              {isTerms ? (
                <FileText className="h-4 w-4 text-gray-600" />
              ) : (
                <Shield className="h-4 w-4 text-gray-600" />
              )}
              {isTerms ? "Terms of Service" : "Privacy Policy"}
            </DialogTitle>
            {!scrolledToBottom && (
              <p className="text-xs text-amber-600 mt-1">
                Scroll to the bottom to enable acceptance
              </p>
            )}
          </DialogHeader>

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="overflow-y-auto px-6 py-5"
            style={{ maxHeight: "60vh" }}
          >
            {isTerms ? TERMS_CONTENT : PRIVACY_CONTENT}
          </div>

          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!scrolledToBottom}
              onClick={handleAccept}
              className="gap-2 disabled:opacity-50"
            >
              {accepted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Accepted
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  I&apos;ve Read &amp; Accept
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
