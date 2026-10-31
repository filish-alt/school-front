import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { api, unwrapString } from '@/lib/api';
import { Building2, School } from 'lucide-react';

/**
 * Compact top banner that displays the current user's school (tenant) name.
 * Shown for school_admin, teacher, and student roles.
 */
export default function SchoolBanner() {
  const { user } = useAuth();
  const { branding } = useTheme();
  const [schoolName, setSchoolName] = useState<string>(branding?.schoolName || '');

  useEffect(() => {
    if (branding?.schoolName) {
      setSchoolName(branding.schoolName);
    }
  }, [branding?.schoolName]);

  useEffect(() => {
    if (!user || !user.tid) return;
    if (user.role === 'super_admin') return;

    let mounted = true;

    // For teachers, derive the school context from their assignments if branding not loaded yet
    if (user.role === 'teacher' && !branding?.schoolName) {
      api.getMyAssignments()
        .then((a: any[]) => {
          if (!mounted) return;
          const first = (a || [])[0];
          const n = first?.tenant_name || first?.school_name || '';
          if (n) setSchoolName(n);
        })
        .catch(() => {});
    }

    return () => {
      mounted = false;
    };
  }, [user, branding?.schoolName]);

  if (!user || user.role === 'super_admin' || !user.tid) return null;

  return (
    <div className="flex items-center justify-between gap-4 mb-6 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/30 border border-border/50 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 shadow-inner">
          <School className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Institutional Portal
          </p>
          <h2 className="font-heading font-bold text-foreground text-lg truncate">
            {schoolName || branding?.schoolName || 'Your School'}
          </h2>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-card/60 px-3 py-1.5 rounded-xl border border-border/40">
        <Building2 className="w-3.5 h-3.5 text-primary" />
        <span className="font-mono">{user.tid.slice(0, 8)}…</span>
      </div>
    </div>
  );
}
