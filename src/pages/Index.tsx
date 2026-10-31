import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, BookOpen, Users, Shield, ChevronRight, Sparkles, BarChart3, Clock, ArrowRight, Globe, Calendar } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const floatingShapes = [
  { className: 'w-72 h-72 bg-primary/8 rounded-full blur-3xl', x: '10%', y: '15%', animY: [-30, 30], duration: 8 },
  { className: 'w-96 h-96 bg-accent/10 rounded-full blur-3xl', x: '70%', y: '10%', animY: [20, -20], duration: 10 },
  { className: 'w-64 h-64 bg-secondary/8 rounded-full blur-3xl', x: '50%', y: '60%', animY: [-25, 25], duration: 7 },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const { t, language, setLanguage, formatDate } = useLanguage();

  const features = [
    { icon: BookOpen, title: t('landing_feat_qb_title'), desc: t('landing_feat_qb_desc') },
    { icon: BarChart3, title: t('landing_feat_analytics_title'), desc: t('landing_feat_analytics_desc') },
    { icon: Shield, title: t('landing_feat_rbac_title'), desc: t('landing_feat_rbac_desc') },
    { icon: Clock, title: t('landing_feat_timed_title'), desc: t('landing_feat_timed_desc') },
    { icon: Users, title: t('landing_feat_tenant_title'), desc: t('landing_feat_tenant_desc') },
    { icon: Sparkles, title: t('landing_feat_ui_title'), desc: t('landing_feat_ui_desc') },
  ];

  const roles = [
    { role: t('role_super_admin'), desc: t('landing_role_super_admin_desc'), color: 'bg-primary' },
    { role: t('role_school_admin'), desc: t('landing_role_school_admin_desc'), color: 'bg-secondary' },
    { role: t('role_teacher'), desc: t('landing_role_teacher_desc'), color: 'bg-accent' },
    { role: t('role_student'), desc: t('landing_role_student_desc'), color: 'bg-muted' },
  ];

  const currentDateDisplay = formatDate(new Date().toISOString());

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 backdrop-blur-xl bg-background/85 border-b border-border/70"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <motion.div
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20"
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight">ExamPrep</span>
              <span className="text-[10px] text-muted-foreground font-medium -mt-1 hidden sm:block">
                {language === 'am' ? 'የትምህርትና ፈተና ፖርታል' : 'Online Assessment Portal'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Ethiopian / Gregorian Date Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{currentDateDisplay}</span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border">
              <button
                type="button"
                onClick={() => setLanguage('am')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  language === 'am'
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>🇪🇹</span>
                <span>አማርኛ</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  language === 'en'
                    ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>

            <Button onClick={() => navigate('/login')} size="sm" className="shadow-sm">
              {t('landing_sign_in')} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Animated floating shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingShapes.map((shape, i) => (
            <motion.div
              key={i}
              className={`absolute ${shape.className}`}
              style={{ left: shape.x, top: shape.y }}
              animate={{ y: shape.animY }}
              transition={{ duration: shape.duration, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            />
          ))}
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 border border-primary/20">
              <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Sparkles className="w-4 h-4" />
              </motion.span>
              {t('landing_badge')}
            </span>
          </motion.div>
          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.15] mb-6"
          >
            {t('landing_hero_title_1')}
            <br />
            <motion.span
              className="text-primary inline-block"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              {t('landing_hero_title_2')}
            </motion.span>
          </motion.h1>
          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t('landing_hero_desc')}
          </motion.p>
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" className="px-8 text-base group shadow-lg shadow-primary/20" onClick={() => navigate('/login')}>
                {t('landing_get_started')}
                <motion.span className="ml-1 inline-block" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" variant="outline" className="px-8 text-base border-border hover:bg-muted" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                {t('landing_explore_features')}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 text-center">
          {[
            { val: '10,000+', label: t('landing_stats_students') },
            { val: '500+', label: t('landing_stats_institutions') },
            { val: '50,000+', label: t('landing_stats_exams') },
            { val: '99.9%', label: t('landing_stats_uptime') },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-primary">{s.val}</div>
              <div className="text-sm font-medium text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing_features_title')}</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">{t('landing_features_desc')}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -6, boxShadow: '0 20px 40px -15px hsl(var(--primary) / 0.12)' }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors duration-300"
              >
                <motion.div
                  className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ rotate: 10 }}
                >
                  <f.icon className="w-6 h-6 text-primary" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing_roles_title')}</h2>
            <p className="text-muted-foreground text-base sm:text-lg">{t('landing_roles_desc')}</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((r, i) => (
              <motion.div
                key={r.role}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="p-6 rounded-2xl border border-border bg-card text-center"
              >
                <motion.div
                  className={`w-14 h-14 rounded-full ${r.color}/10 flex items-center justify-center mx-auto mb-4`}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, delay: i * 0.5, repeat: Infinity }}
                >
                  <Users className="w-7 h-7 text-foreground/70" />
                </motion.div>
                <h3 className="font-semibold text-lg mb-2">{r.role}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.5 }}
        >
          <motion.div
            className="absolute w-80 h-80 bg-primary/5 rounded-full blur-3xl"
            style={{ left: '20%', top: '20%' }}
            animate={{ x: [-20, 20], y: [-15, 15] }}
            transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse' }}
          />
          <motion.div
            className="absolute w-64 h-64 bg-accent/8 rounded-full blur-3xl"
            style={{ right: '15%', bottom: '10%' }}
            animate={{ x: [15, -15], y: [10, -10] }}
            transition={{ duration: 8, repeat: Infinity, repeatType: 'reverse' }}
          />
        </motion.div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing_cta_title')}</h2>
            <p className="text-muted-foreground text-base sm:text-lg mb-8">{t('landing_cta_desc')}</p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" className="px-10 text-base shadow-lg shadow-primary/25" onClick={() => navigate('/login')}>
                {t('landing_start_now')} <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 bg-card/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            <span>ExamPrep © {currentDateDisplay.split(' ')[currentDateDisplay.split(' ').length - 1] || new Date().getFullYear()}</span>
          </div>
          <span className="text-xs sm:text-sm">{t('landing_footer_text')}</span>
        </div>
      </footer>
    </div>
  );
}
