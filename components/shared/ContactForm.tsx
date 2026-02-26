"use client";

import {
  submitContactForm,
  type ContactFormState,
} from "@/app/actions/contact";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { useState } from "react";

const SUBJECTS = [
  "Order Inquiry",
  "Product Question",
  "Age Verification",
  "Returns & Refunds",
  "Technical Issue",
  "Partnership / Wholesale",
  "Other",
];

export function ContactForm() {
  const [state, setState] = useState<ContactFormState>({ status: "idle" });
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const set =
    (k: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setState({ status: "idle" });
    const result = await submitContactForm(form);
    setState(result);
    setLoading(false);
    if (result.status === "success") {
      setForm({ name: "", email: "", subject: "", message: "" });
    }
  };

  const inputCls =
    "w-full h-11 px-4 text-[14px] rounded-xl border border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] outline-none focus:border-[#0A0A0A] transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-[#0A0A0A] uppercase tracking-wide">
            Your Name
          </label>
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="Juan dela Cruz"
            required
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] font-semibold text-[#0A0A0A] uppercase tracking-wide">
            Email Address
          </label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="juan@example.com"
            required
            className={inputCls}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[#0A0A0A] uppercase tracking-wide">
          Subject
        </label>
        <select
          value={form.subject}
          onChange={set("subject")}
          required
          className={`${inputCls} cursor-pointer`}
        >
          <option value="">Select a topic…</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[12px] font-semibold text-[#0A0A0A] uppercase tracking-wide">
          Message
        </label>
        <textarea
          value={form.message}
          onChange={set("message")}
          placeholder="Write your message here…"
          required
          rows={5}
          className="w-full px-4 py-3 text-[14px] rounded-xl border border-[#E8E8E8] bg-white placeholder:text-[#CDCDCD] outline-none focus:border-[#0A0A0A] transition-all resize-none"
        />
      </div>

      {state.status === "error" && (
        <div className="flex items-start gap-2 text-[13px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {state.message}
        </div>
      )}

      {state.status === "success" && (
        <div className="flex items-start gap-2 text-[13px] text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          Message sent! We&apos;ll get back to you as soon as possible.
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl bg-[#0A0A0A] text-white text-[14px] font-semibold hover:bg-[#1A1A1A] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message
          </>
        )}
      </button>
    </form>
  );
}
