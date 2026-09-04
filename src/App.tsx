import React, { useState } from 'react';
import CtaFooter from './components/CtaFooter';
import { X, Calendar, Check, ArrowRight, ShieldCheck, Mail, Sparkles } from 'lucide-react';

export default function App() {
  const [modalType, setModalType] = useState<'call' | 'pricing' | 'terms' | 'privacy' | 'contact' | null>(null);
  const [submittedCall, setSubmittedCall] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '', timeline: '2-4 weeks' });

  const handleBookCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedCall(true);
    setTimeout(() => {
      setSubmittedCall(false);
      setModalType(null);
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black flex flex-col justify-center">
      {/* Main Cinematic CTA & Footer Section Component */}
      <main className="w-full">
        <CtaFooter
          onBookCall={() => setModalType('call')}
          onViewPricing={() => setModalType('pricing')}
          onOpenModal={(type) => setModalType(type as any)}
        />
      </main>

      {/* Interactive Modal Layer */}
      {modalType && (
        <div
          id="cta-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setModalType(null)}
        >
          <div
            id="cta-modal-card"
            className="liquid-glass-strong w-full max-w-lg rounded-3xl p-6 sm:p-8 bg-[#0a0a0a]/90 text-white relative shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              id="cta-modal-close-btn"
              onClick={() => setModalType(null)}
              className="absolute top-5 right-5 text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Book a Strategy Call Modal */}
            {modalType === 'call' && (
              <div id="modal-book-call">
                <div className="flex items-center gap-2 text-white/60 text-xs uppercase tracking-wider font-body mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>Discovery & Strategy</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-heading italic text-white mb-3">
                  Book a Strategy Call
                </h3>
                <p className="text-sm text-white/60 font-body mb-6">
                  Schedule a direct session with our design & engineering team. We'll map your digital transformation without fluff.
                </p>

                {submittedCall ? (
                  <div className="py-8 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                      <Check className="w-6 h-6" />
                    </div>
                    <h4 className="text-xl font-heading italic">Call Request Confirmed!</h4>
                    <p className="text-xs text-white/60 mt-1 font-body">
                      We've dispatched calendar slots to your inbox.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleBookCallSubmit} className="space-y-4 font-body">
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1">Your Name</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Alex Morgan"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1">Work Email</label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="alex@company.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/70 mb-1">Target Timeline</label>
                      <select
                        value={formData.timeline}
                        onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                        className="w-full bg-[#111] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 transition"
                      >
                        <option value="Urgent (1-2 weeks)">Urgent (1-2 weeks)</option>
                        <option value="2-4 weeks">Standard (2-4 weeks)</option>
                        <option value="1-2 months">Quarterly planning (1-2 months)</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-white text-black font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition cursor-pointer mt-2"
                    >
                      Confirm Booking
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* View Pricing Modal */}
            {modalType === 'pricing' && (
              <div id="modal-view-pricing">
                <div className="flex items-center gap-2 text-white/60 text-xs uppercase tracking-wider font-body mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Simple Transparent Investment</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-heading italic text-white mb-2">
                  Studio Pricing
                </h3>
                <p className="text-xs text-white/60 font-body mb-6">
                  Predictable scopes, lightning iterations, and production-grade craftsmanship.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-body">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white/60 uppercase">Sprint</span>
                      <div className="text-2xl font-bold text-white mt-1">$4,800</div>
                      <p className="text-xs text-white/60 mt-1">Full landing page or web app re-architecture in 2 weeks.</p>
                      <ul className="mt-3 space-y-1.5 text-xs text-white/80">
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-white/60" /> Bespoke UI & Motion</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-white/60" /> Video & Liquid Shaders</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-white/60" /> Full Code Handover</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => setModalType('call')}
                      className="mt-4 w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition cursor-pointer"
                    >
                      Reserve Sprint
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-white text-black flex flex-col justify-between shadow-xl">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-black/60">Retainer</span>
                        <span className="text-[10px] uppercase font-bold bg-black text-white px-2 py-0.5 rounded-full">Popular</span>
                      </div>
                      <div className="text-2xl font-black text-black mt-1">$7,500<span className="text-xs font-normal text-black/60">/mo</span></div>
                      <p className="text-xs text-black/70 mt-1">Dedicated team for ongoing design, product expansion, and rapid ship cycles.</p>
                      <ul className="mt-3 space-y-1.5 text-xs text-black/80 font-medium">
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-black" /> Continuous Design & Code</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-black" /> 48-Hour Async Turnaround</li>
                        <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-black" /> Pause or Cancel Anytime</li>
                      </ul>
                    </div>
                    <button
                      onClick={() => setModalType('call')}
                      className="mt-4 w-full py-2 rounded-xl bg-black text-white hover:bg-black/90 text-xs font-semibold transition cursor-pointer"
                    >
                      Start Membership
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Modal */}
            {modalType === 'privacy' && (
              <div id="modal-privacy" className="font-body">
                <div className="flex items-center gap-2 text-white/60 text-xs uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Legal & Compliance</span>
                </div>
                <h3 className="text-3xl font-heading italic text-white mb-3">Privacy Policy</h3>
                <div className="text-xs text-white/70 space-y-3 leading-relaxed max-h-60 overflow-y-auto pr-2">
                  <p>We respect your privacy unconditionally. All telemetry and booking interactions are handled with end-to-end TLS encryption.</p>
                  <p>We never sell, rent, or distribute personal data or email records to third parties. Data entered into consultation requests is strictly utilized to coordinate your session.</p>
                  <p>Cookies are utilized exclusively for session preservation and performance rendering. You may request record deletion at any moment.</p>
                </div>
              </div>
            )}

            {/* Terms Modal */}
            {modalType === 'terms' && (
              <div id="modal-terms" className="font-body">
                <div className="flex items-center gap-2 text-white/60 text-xs uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Terms of Service</span>
                </div>
                <h3 className="text-3xl font-heading italic text-white mb-3">Terms of Engagement</h3>
                <div className="text-xs text-white/70 space-y-3 leading-relaxed max-h-60 overflow-y-auto pr-2">
                  <p>1. <strong>Intellectual Property</strong>: All custom code, assets, and design systems generated for clients are transferred 100% upon final milestone sign-off.</p>
                  <p>2. <strong>Delivery Guarantees</strong>: Sprints operate on fixed timelines with continuous staging deployments.</p>
                  <p>3. <strong>Confidentiality</strong>: Mutual non-disclosure agreements are standard across all engagements prior to repository access.</p>
                </div>
              </div>
            )}

            {/* Contact Modal */}
            {modalType === 'contact' && (
              <div id="modal-contact" className="font-body">
                <div className="flex items-center gap-2 text-white/60 text-xs uppercase tracking-wider mb-2">
                  <Mail className="w-4 h-4" />
                  <span>Direct Inquiries</span>
                </div>
                <h3 className="text-3xl font-heading italic text-white mb-3">Contact the Studio</h3>
                <p className="text-xs text-white/70 mb-4 leading-relaxed">
                  Have a specific inquiry or custom enterprise requirement? Reach our executive creative director directly.
                </p>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs text-white/80">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Email</span>
                    <span className="font-semibold text-white">hello@studio2026.design</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-white/50">Location</span>
                    <span className="font-semibold text-white">San Francisco • Tokyo • Remote</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-white/50">Response Time</span>
                    <span className="font-semibold text-emerald-400">Within 4 Business Hours</span>
                  </div>
                </div>
                <button
                  onClick={() => setModalType('call')}
                  className="mt-5 w-full py-2.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 transition cursor-pointer"
                >
                  Schedule Strategy Call Instead
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
