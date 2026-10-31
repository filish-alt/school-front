import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Languages,
  CalendarDays,
  Menu,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TopHeaderProps {
  onOpenSettings: (tab?: 'profile' | 'appearance' | 'security') => void;
  onToggleSidebar?: () => void;
}

const routeTitleKeys: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/tenants': 'tenants_nav',
  '/sa-students': 'students_nav',
  '/academic-years': 'academic_years_nav',
  '/settings': 'settings_nav',
  '/audit-logs': 'audit_logs_nav',
  '/backups': 'backups_nav',
  '/departments': 'departments_nav',
  '/sections': 'sections_nav',
  '/subjects': 'subjects_nav',
  '/teachers': 'teachers_nav',
  '/assignments': 'assignments_nav',
  '/violations': 'violations_nav',
  '/transfer-sheets': 'transfer_sheets_nav',
  '/final-approvals': 'final_approvals_nav',
  '/complaints': 'complaints_nav',
  '/question-banks': 'question_banks_nav',
  '/exams': 'exams_nav',
  '/coursework': 'coursework_nav',
  '/t-students': 'my_students_nav',
  '/my-exams': 'my_exams_nav',
  '/my-results': 'my_results_nav',
  '/my-complaints': 'my_complaints_nav',
};

export default function TopHeader({ onOpenSettings, onToggleSidebar }: TopHeaderProps) {
  const { user, displayName, logout } = useAuth();
  const { isDark, toggle, branding } = useTheme();
  const { language, setLanguage, formatDate, t } = useLanguage();
  const location = useLocation();

  if (!user) return null;

  const titleKey = routeTitleKeys[location.pathname] || 'dashboard';
  const currentTitle = t(titleKey, 'Dashboard');
  const roleLabel = t(`role_${user.role}`, user.role.replace('_', ' '));

  // Today in Ethiopian date
  const todayFormatted = formatDate(new Date());

  // Avatar initials from displayName or role
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'am' : 'en');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/85 backdrop-blur-md border-b border-border/60 px-3 sm:px-6 flex items-center justify-between transition-all">
      {/* Left Context / Title + Mobile Menu Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span className="truncate">{branding?.schoolName || t('system_name', 'School System')}</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
        </div>
        <h1 className="text-sm sm:text-base font-bold font-heading text-foreground truncate">
          {currentTitle}
        </h1>
      </div>

      {/* Right Controls: Ethiopian Date, Language Switcher, Theme, User Profile, Logout */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Ethiopian Date Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/60 text-xs font-medium text-foreground select-none cursor-default">
              <CalendarDays className="w-3.5 h-3.5 text-primary" />
              <span>{todayFormatted}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {t('calendar_system', 'Ethiopian & Gregorian Calendar')}
          </TooltipContent>
        </Tooltip>

        {/* Language Switcher */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleLanguage}
              className="h-9 px-2 sm:px-2.5 rounded-xl border-border/60 hover:bg-muted/60 text-xs font-semibold gap-1 sm:gap-1.5 transition-all"
              aria-label="Toggle language"
            >
              <Languages className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] sm:text-xs">{language === 'en' ? '🇬🇧 EN' : '🇪🇹 አማ'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {language === 'en' ? 'Switch to አማርኛ (Amharic)' : 'Switch to English'}
          </TooltipContent>
        </Tooltip>

        {/* Theme Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-transform duration-300 rotate-0 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500 hover:text-indigo-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {isDark ? t('theme_light', 'Switch to Light Mode') : t('theme_dark', 'Switch to Dark Mode')}
          </TooltipContent>
        </Tooltip>

        {/* User Profile Chip (opens Personal Settings modal) */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onOpenSettings('profile')}
              className="flex items-center gap-2 sm:gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-xl bg-card border border-border/60 hover:border-primary/40 hover:bg-muted/40 transition-all text-left group shadow-sm"
              aria-label="Open settings"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/15 group-hover:bg-primary/25 text-primary flex items-center justify-center font-bold text-xs uppercase transition-colors shrink-0">
                {initials}
              </div>
              <div className="hidden sm:flex flex-col text-left min-w-0 max-w-[120px]">
                <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {displayName}
                </span>
                <span className="text-[10px] text-muted-foreground capitalize truncate leading-none mt-0.5">
                  {roleLabel}
                </span>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {t('personal_settings', 'Personal Settings & Security')}
          </TooltipContent>
        </Tooltip>

        <div className="h-5 w-[1px] bg-border/80 mx-0.5 hidden xs:block" />

        {/* Logout Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive transition-all"
              aria-label="Log out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t('logout', 'Logout')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {t('logout', 'Log Out')}
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
