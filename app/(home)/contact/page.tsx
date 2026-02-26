import {
  getBusinessHours,
  type WeeklySchedule,
} from "@/app/actions/business-hours";
import { ContactForm } from "@/components/shared/ContactForm";
import { Clock, Facebook, MapPin, MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | 13th Vapour Lounge",
  description:
    "Get in touch with 13th Vapour Lounge. We're here to help with orders, products, and more.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const DAYS: { key: keyof WeeklySchedule; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function fmt12(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ContactPage() {
  const hoursResult = await getBusinessHours();
  const hours = hoursResult.data ?? null;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Hero */}
      <div className="bg-[#0A0A0A] text-white">
        <div className="max-w-5xl mx-auto px-4 py-14 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#888] mb-3">
            Get in Touch
          </p>
          <h1 className="text-[32px] sm:text-[40px] font-bold tracking-tight leading-tight">
            We&apos;d love to hear from you
          </h1>
          <p className="mt-3 text-[15px] text-[#ADADAD] max-w-md mx-auto">
            Questions about your order, products, or anything else? Send us a
            message and we&apos;ll get back to you quickly.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left sidebar: info cards */}
          <div className="lg:col-span-2 space-y-5">
            {/* Visit us */}
            <div className="rounded-2xl border border-[#EBEBEB] bg-white px-6 py-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-[#0A0A0A]" />
                </div>
                <h2 className="text-[14px] font-bold text-[#0A0A0A]">
                  Visit Our Store
                </h2>
              </div>
              <div className="text-[14px] text-[#444] leading-relaxed space-y-1">
                <p className="font-medium text-[#0A0A0A]">13th Vapour Lounge</p>
                <p>Trece Martires City</p>
                <p>Cavite, Philippines</p>
              </div>
              <div className="mt-4">
                <a
                  href="https://maps.google.com/?q=Trece+Martires+City+Cavite+Philippines"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#0A0A0A] border border-[#E8E8E8] rounded-lg px-3 py-2 hover:bg-[#F5F5F5] transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Open in Maps
                </a>
              </div>
            </div>

            {/* Message us */}
            <div className="rounded-2xl border border-[#EBEBEB] bg-white px-6 py-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0">
                  <MessageCircle className="h-4 w-4 text-[#0A0A0A]" />
                </div>
                <h2 className="text-[14px] font-bold text-[#0A0A0A]">
                  Message Us
                </h2>
              </div>
              <p className="text-[13px] text-[#666] mb-4 leading-relaxed">
                For the fastest response, reach us directly on Facebook
                Messenger.
              </p>
              <a
                href="https://www.facebook.com/profile.php?id=61553552038082"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-[#1877F2] text-white text-[13px] font-semibold hover:bg-[#1565D8] transition-colors"
              >
                <Facebook className="h-4 w-4" />
                Message on Facebook
              </a>
            </div>

            {/* Business hours */}
            {hours && (
              <div className="rounded-2xl border border-[#EBEBEB] bg-white px-6 py-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-[#F5F5F5] flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-[#0A0A0A]" />
                  </div>
                  <h2 className="text-[14px] font-bold text-[#0A0A0A]">
                    Store Hours
                  </h2>
                </div>
                <div className="space-y-2">
                  {DAYS.map(({ key, label }) => {
                    const day = hours[key];
                    const today =
                      new Date()
                        .toLocaleDateString("en-US", {
                          weekday: "long",
                        })
                        .toLowerCase() === label.toLowerCase();
                    return (
                      <div
                        key={key}
                        className={`flex justify-between text-[13px] py-1.5 px-2 rounded-lg ${
                          today ? "bg-[#F5F5F5] font-semibold" : "text-[#444]"
                        }`}
                      >
                        <span
                          className={today ? "text-[#0A0A0A]" : "text-[#888]"}
                        >
                          {label}
                          {today && (
                            <span className="ml-1.5 text-[10px] font-semibold text-white bg-[#0A0A0A] rounded-full px-1.5 py-0.5">
                              Today
                            </span>
                          )}
                        </span>
                        <span>
                          {day.isOpen ? (
                            `${fmt12(day.openTime)} – ${fmt12(day.closeTime)}`
                          ) : (
                            <span className="text-red-500 text-[12px]">
                              Closed
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: Contact form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-[#EBEBEB] bg-white px-6 py-7">
              <h2 className="text-[18px] font-bold text-[#0A0A0A] mb-1">
                Send Us a Message
              </h2>
              <p className="text-[13px] text-[#888] mb-6">
                Fill out the form and we&apos;ll get back to you within 24
                hours.
              </p>
              <ContactForm />
            </div>

            {/* FAQ nudge */}
            <div className="mt-4 rounded-2xl border border-[#EBEBEB] bg-white px-6 py-5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="h-4 w-4 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#0A0A0A]">
                  Questions about an order?
                </p>
                <p className="text-[12px] text-[#888] mt-0.5">
                  You can also check the status of your order directly from your{" "}
                  <a
                    href="/profile?tab=orders"
                    className="text-[#0A0A0A] font-medium underline underline-offset-2 hover:no-underline"
                  >
                    account page
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
