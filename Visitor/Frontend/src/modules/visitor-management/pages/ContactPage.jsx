import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import PublicNavbar from '../../../components/PublicNavbar';
import PublicFooter from '../../../components/PublicFooter';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useOrganization } from '../../../contexts/OrganizationContext';
export default function ContactPage() {
    const { t } = useLanguage();
    const { organization, orgPhone, orgEmail, orgWebsite } = useOrganization();
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        await new Promise((r) => setTimeout(r, 1200));
        setLoading(false);
        setSubmitted(true);
        setForm({ fullName: '', email: '', phone: '', subject: '', message: '' });
        setTimeout(() => setSubmitted(false), 4000);
    };
    return (<div className="min-h-screen flex flex-col" style={{ background: '#070b13', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <PublicNavbar />

      {/* ═══════════════════════════════════════════════════════════════
            HERO BANNER — Dark navy with "Get In Touch"
           ═══════════════════════════════════════════════════════════════ */}
      <section className="relative flex flex-col items-center justify-center text-center overflow-hidden" style={{ paddingTop: '140px', paddingBottom: '100px', background: 'linear-gradient(180deg, #070b13 0%, #0c1424 50%, #0f1a2e 100%)' }}>
        {/* Subtle background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
        }}/>
        {/* Glow orbs */}
        <div className="absolute top-[-15%] left-[20%] h-[400px] w-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)' }}/>
        <div className="absolute bottom-[-20%] right-[15%] h-[500px] w-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(127,119,221,0.05) 0%, transparent 70%)' }}/>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
            <span style={{ color: '#06b6d4', fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t('nav.contact')}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight" style={{ color: '#f8fafc' }}>
            {t('contact.title1')} <span style={{ color: '#06b6d4' }}>{t('contact.title2')}</span>
          </h1>
          <p className="mt-4 max-w-lg mx-auto" style={{ color: '#8899b0', fontSize: '0.9375rem', lineHeight: '1.7' }}>
            {t('contact.subtitle')}
          </p>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
            CONTACT CARDS SECTION
           ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#f0f4f8', paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ── Left Card: Contact Information ──────────────── */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="rounded-2xl p-8 md:p-10" style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e8ecf2',
        }}>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a', marginBottom: '2rem' }}>
                {t('contact.info')}
              </h3>

              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center shrink-0" style={{
            width: '44px', height: '44px', borderRadius: '12px',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
        }}>
                    <Phone className="h-5 w-5" style={{ color: '#06b6d4' }}/>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                      {t('contact.phone')}
                    </p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>
                      {orgPhone || '+251-111-24-20-00'}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center shrink-0" style={{
            width: '44px', height: '44px', borderRadius: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
        }}>
                    <Mail className="h-5 w-5" style={{ color: '#3b82f6' }}/>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                      {t('contact.email')}
                    </p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>
                      {orgEmail || 'contact@visitor.com'}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center shrink-0" style={{
            width: '44px', height: '44px', borderRadius: '12px',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
        }}>
                    <MapPin className="h-5 w-5" style={{ color: '#22c55e' }}/>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                      {t('contact.address')}
                    </p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b', lineHeight: '1.5' }}>
                      {organization.address || `${organization.city || 'Addis Ababa'}, ${organization.country || 'Ethiopia'}` || t('contact.addressVal')}
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center shrink-0" style={{
            width: '44px', height: '44px', borderRadius: '12px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
        }}>
                    <Clock className="h-5 w-5" style={{ color: '#f59e0b' }}/>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                      {t('contact.hours')}
                    </p>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1e293b' }}>
                      {t('contact.hoursVal')}<br />
                      <span style={{ color: '#94a3b8' }}>{t('contact.hoursSub')}</span>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Right Card: Send us a Message ──────────────── */}
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }} className="rounded-2xl p-8 md:p-10" style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e8ecf2',
        }}>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.375rem' }}>
                {t('contact.sendMsg')}
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.75rem' }}>
                {t('contact.formDesc')}
              </p>

              {submitted && (<div className="flex items-center gap-2 rounded-lg p-3 mb-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <span style={{ color: '#22c55e', fontSize: '0.8125rem', fontWeight: 600 }}>
                    {t('contact.success')}
                  </span>
                </div>)}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
                    {t('contact.fullName')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder={t('contact.placeholderName')} required style={{
            width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem',
            backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
            color: '#1e293b', outline: 'none', transition: 'border-color 0.2s',
        }} onFocus={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}/>
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
                    {t('contact.emailAddr')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required style={{
            width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem',
            backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
            color: '#1e293b', outline: 'none', transition: 'border-color 0.2s',
        }} onFocus={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}/>
                </div>

                {/* Phone Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
                    {t('contact.phoneNum')}
                  </label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder={t('contact.placeholderPhone')} style={{
            width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem',
            backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
            color: '#1e293b', outline: 'none', transition: 'border-color 0.2s',
        }} onFocus={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}/>
                </div>

                {/* Subject */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
                    {t('contact.subject')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input type="text" name="subject" value={form.subject} onChange={handleChange} placeholder={t('contact.placeholderSubject')} required style={{
            width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem',
            backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
            color: '#1e293b', outline: 'none', transition: 'border-color 0.2s',
        }} onFocus={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}/>
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>
                    {t('contact.message')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea name="message" value={form.message} onChange={handleChange} placeholder={t('contact.placeholderMsg')} required rows={4} style={{
            width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.8125rem',
            backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
            color: '#1e293b', outline: 'none', transition: 'border-color 0.2s',
            resize: 'vertical', minHeight: '100px',
        }} onFocus={(e) => { e.currentTarget.style.borderColor = '#06b6d4'; }} onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; }}/>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-1">
                  <button type="submit" disabled={loading} className="flex items-center gap-2 transition-all duration-200" style={{
            backgroundColor: '#0891b2',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.8125rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '8px',
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
        }} onMouseEnter={(e) => { if (!loading)
        e.currentTarget.style.backgroundColor = '#0e7490'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0891b2'; }}>
                    {loading ? (<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"/>) : (<>
                        {t('contact.sendBtn')}
                        <Send className="h-4 w-4"/>
                      </>)}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
            MAP SECTION — Our Location
           ═══════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#f0f4f8', paddingBottom: '4rem' }}>
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="rounded-2xl overflow-hidden" style={{
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e8ecf2',
        }}>
            {/* Map header overlay */}
            <div className="relative">
              {/* OpenStreetMap iframe — Addis Ababa area */}
              <iframe title="Our Location" src="https://www.openstreetmap.org/export/embed.html?bbox=38.75%2C8.95%2C38.82%2C9.02&layer=mapnik&marker=8.9806%2C38.7578" style={{ width: '100%', height: '600px', border: 'none' }} loading="lazy"/>

              {/* Location info card overlaid on map */}
              <div className="absolute top-6 left-6 rounded-xl p-5" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            maxWidth: '260px',
            border: '1px solid rgba(255, 255, 255, 0.8)',
        }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  {t('contact.location')}
                </h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                  {t('contact.addressVal')}
                </p>
                <a href="https://maps.google.com/?q=8.9806,38.7578" target="_blank" rel="noreferrer" className="flex items-center gap-1.5" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0891b2', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }} onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}>
                  {t('contact.directions')}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <PublicFooter />
    </div>);
}
