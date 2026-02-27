// ─── Types ────────────────────────────────────────────────────────────────────

export type PolicyKey =
  | "policy_terms"
  | "policy_privacy"
  | "policy_return"
  | "policy_shipping";

export type PolicyData = {
  title: string;
  content: string;
  updated_at: string | null;
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

export const POLICY_META: Record<
  PolicyKey,
  { label: string; slug: string; description: string }
> = {
  policy_terms: {
    label: "Terms of Service",
    slug: "/terms",
    description: "Governs the use of your platform and services.",
  },
  policy_privacy: {
    label: "Privacy Policy",
    slug: "/privacy-policy",
    description: "Explains how you collect and handle customer data.",
  },
  policy_return: {
    label: "Return & Refund Policy",
    slug: "/return-policy",
    description: "Rules for returns, refunds, and exchanges.",
  },
  policy_shipping: {
    label: "Shipping Policy",
    slug: "/shipping-policy",
    description: "Delivery methods, timelines, and shipping fees.",
  },
};

// ─── Default content (fallback when not yet saved in DB) ─────────────────────

export const POLICY_DEFAULT_CONTENT: Record<PolicyKey, string> = {
  policy_terms: `1. Acceptance of Terms
By creating an account and using 13th Vapour Lounge, you agree to comply with all applicable laws and regulations, and these Terms of Service. If you do not agree, please do not use our services.

2. Age Requirement
You confirm that you are 18 years of age or older. Our products — including e-liquids, nicotine pouches, and vaping devices — are intended exclusively for legal-age adults. We reserve the right to verify your age and refuse service if you are underage.

3. Account Responsibilities
You are responsible for maintaining the confidentiality of your account credentials. You agree not to misrepresent your identity or age. Any activity under your account is your responsibility.

4. Purchases & Refunds
All purchases are subject to our return and refund policy. Products containing nicotine are addictive; we encourage responsible use. We reserve the right to cancel orders at our discretion.

5. Health Disclaimer
Nicotine and vaping products carry health risks. Our products are not intended to diagnose, treat, cure, or prevent any disease. Use at your own risk. Keep products away from children and pets.

6. Intellectual Property
All content on this website — including logos, images, and text — is owned by 13th Vapour Lounge and may not be reproduced without permission.

7. Limitation of Liability
13th Vapour Lounge is not liable for any indirect, incidental, or consequential damages arising from your use of our products or services.

8. Governing Law
These terms are governed by the laws of the Republic of the Philippines. Any disputes shall be resolved in the appropriate courts of Cavite.

9. Updates to Terms
We may update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.`,

  policy_privacy: `1. Information We Collect
We collect personal information including your name, email address, contact number, date of birth, and shipping address — solely for the purpose of order processing and account management.

2. ID Verification Documents
For age verification, we may collect government-issued ID documents. These are stored securely and used exclusively for verifying that you meet the legal age requirement (18+). Documents are not shared with third parties.

3. How We Use Your Data
Your data is used to process orders, manage your account, send transactional emails (order confirmations, shipping updates), and comply with legal obligations. We do not sell your personal information.

4. Data Sharing
We do not share your personal data with third parties without your consent, except as required by Philippine law (Republic Act 10173 — Data Privacy Act of 2012).

5. Cookies
We use cookies to improve your browsing experience, remember your preferences, and analyze site traffic. You can disable cookies in your browser settings, though some features may not work properly.

6. Data Security
We implement reasonable security measures to protect your personal information from unauthorized access, disclosure, or loss. However, no method of transmission over the internet is 100% secure.

7. Your Rights
Under the Data Privacy Act of 2012, you have the right to access, correct, or request deletion of your personal data. Contact us at our store to exercise these rights.

8. Retention
We retain your data only as long as necessary to fulfill the purposes outlined in this policy, or as required by law.

9. Changes to This Policy
We may update this Privacy Policy periodically. We will notify you of significant changes via email or a notice on our website.`,

  policy_return: `1. Return Eligibility
Items may be returned within 7 days of delivery, provided they are unused and in their original packaging. Products that have been opened, damaged, or show signs of use are not eligible for return.

2. Non-Returnable Items
For health and safety reasons, opened e-liquids, nicotine products, and coil heads cannot be returned once opened.

3. Defective or Damaged Items
If you receive a defective or damaged item, contact us within 48 hours of delivery with photos of the damage. We will arrange a replacement or full refund at no additional cost.

4. Refund Process
Approved refunds are processed within 5–7 business days. Refunds are issued via the original payment method or as store credit, at the customer's preference.

5. How to Request a Return
Log in to your account, go to My Orders, select the order, and click "Request Return." Provide the reason for the return and upload any supporting photos.

6. Shipping Costs
Return shipping costs are the customer's responsibility unless the return is due to our error (wrong item, defective product).`,

  policy_shipping: `1. Shipping Coverage
We currently ship within Metro Manila and selected provinces in the Philippines. Delivery availability is shown at checkout.

2. Processing Time
Orders are processed within 1–2 business days after payment confirmation. Orders placed on weekends or holidays will be processed on the next business day.

3. Delivery Timeframes
- Metro Manila: 1–3 business days
- Provincial: 3–7 business days
Delivery times are estimates and may vary due to courier delays or weather conditions.

4. Shipping Fees
Shipping fees are calculated at checkout based on your delivery address and order weight. Free shipping may be available for orders above a certain threshold.

5. Order Tracking
Once your order is shipped, you will receive a tracking number via email. You can track your order through the courier's website or in your account under My Orders.

6. Failed Deliveries
If a delivery attempt fails, the courier will leave a notice. Please coordinate with the courier within 3 days. Unclaimed packages may be returned to us and reshipping fees will apply.`,
};
