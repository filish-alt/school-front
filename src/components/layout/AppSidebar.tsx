import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, GraduationCap, BookOpen, Layers, UserCog,
  LayoutDashboard, ClipboardList, FileQuestion, School, ShieldAlert,
  Calendar, Sliders, ShieldCheck, Database, FileSpreadsheet, MessageSquare, Award,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface NavItem {
  key: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const schoolLeadershipNav: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'students_nav', label: 'Students', icon: GraduationCap, path: '/sa-students' },
  { key: 'settings_nav', label: 'Assessment & Grading', icon: Sliders, path: '/settings' },
  { key: 'transfer_sheets_nav', label: 'Transfer Sheets', icon: FileSpreadsheet, path: '/transfer-sheets' },
  { key: 'final_approvals_nav', label: 'Exam Approvals', icon: ShieldCheck, path: '/final-approvals' },
  { key: 'complaints_nav', label: 'Complaints', icon: MessageSquare, path: '/complaints' },
  { key: 'departments_nav', label: 'Departments', icon: Layers, path: '/departments' },
  { key: 'sections_nav', label: 'Sections', icon: BookOpen, path: '/sections' },
  { key: 'subjects_nav', label: 'Subjects', icon: ClipboardList, path: '/subjects' },
  { key: 'teachers_nav', label: 'Staff & Teachers', icon: UserCog, path: '/teachers' },
  { key: 'assignments_nav', label: 'Assignments', icon: School, path: '/assignments' },
  { key: 'violations_nav', label: 'Violations', icon: ShieldAlert, path: '/violations' },
];

const navByRole: Record<UserRole, NavItem[]> = {
  super_admin: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { key: 'tenants_nav', label: 'Tenants', icon: Building2, path: '/tenants' },
    { key: 'teachers_nav', label: 'Staff & Teachers', icon: UserCog, path: '/teachers' },
    { key: 'students_nav', label: 'Students', icon: GraduationCap, path: '/sa-students' },
    { key: 'academic_years_nav', label: 'Academic Years', icon: Calendar, path: '/academic-years' },
    { key: 'settings_nav', label: 'System Settings', icon: Sliders, path: '/settings' },
    { key: 'audit_logs_nav', label: 'Audit Logs', icon: ShieldCheck, path: '/audit-logs' },
    { key: 'backups_nav', label: 'Backups', icon: Database, path: '/backups' },
  ],
  school_admin: schoolLeadershipNav,
  school_director: schoolLeadershipNav,
  vice_director: schoolLeadershipNav,
  department_head: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { key: 'assignments_nav', label: 'Teacher Assignments', icon: School, path: '/assignments' },
    { key: 'question_banks_nav', label: 'Question Banks', icon: FileQuestion, path: '/question-banks' },
    { key: 'exams_nav', label: 'Exams', icon: ClipboardList, path: '/exams' },
    { key: 'final_approvals_nav', label: 'Exam Approvals', icon: ShieldCheck, path: '/final-approvals' },
    { key: 'complaints_nav', label: 'Complaints', icon: MessageSquare, path: '/complaints' },
    { key: 'coursework_nav', label: 'Coursework (CA)', icon: Award, path: '/coursework' },
    { key: 'transfer_sheets_nav', label: 'Transfer Sheets', icon: FileSpreadsheet, path: '/transfer-sheets' },
    { key: 'my_students_nav', label: 'Students', icon: GraduationCap, path: '/t-students' },
    { key: 'sections_nav', label: 'Sections (View)', icon: BookOpen, path: '/sections' },
    { key: 'subjects_nav', label: 'Subjects (View)', icon: ClipboardList, path: '/subjects' },
  ],
  teacher: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { key: 'coursework_nav', label: 'Coursework (CA)', icon: Award, path: '/coursework' },
    { key: 'question_banks_nav', label: 'Question Banks', icon: FileQuestion, path: '/question-banks' },
    { key: 'exams_nav', label: 'Exams', icon: ClipboardList, path: '/exams' },
    { key: 'transfer_sheets_nav', label: 'Transfer Sheets', icon: FileSpreadsheet, path: '/transfer-sheets' },
    { key: 'my_students_nav', label: 'Students', icon: GraduationCap, path: '/t-students' },
  ],
  student: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { key: 'my_exams_nav', label: 'My Exams', icon: ClipboardList, path: '/my-exams' },
    { key: 'my_results_nav', label: 'My Results', icon: TrophyIcon, path: '/my-results' },
    { key: 'my_complaints_nav', label: 'Inquiries & Complaints', icon: MessageSquare, path: '/my-complaints' },
  ],
};

function TrophyIcon(props: any) {
  return <Award {...props} />;
}

interface AppSidebarProps {
  open?: boolean;
  onClose?: () => void;
  onOpenSettings?: (tab?: 'profile' | 'appearance' | 'security') => void;
}

export default function AppSidebar({ open = false, onClose, onOpenSettings }: AppSidebarProps) {
  const { user } = useAuth();
  const { branding } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [location.pathname]);

  if (!user) return null;

  const items = navByRole[user.role] || [];
  const roleLabel = t(`role_${user.role}`, user.role.replace('_', ' '));

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col sidebar-glow z-50 border-r border-sidebar-border select-none transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-sidebar-border shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt="School Logo"
                className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1 border border-sidebar-border shrink-0 shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center shrink-0 shadow-inner border border-sidebar-border/40">
                <GraduationCap className="w-5 h-5 text-sidebar-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1
                className="font-heading text-base font-bold text-sidebar-foreground truncate tracking-tight leading-tight"
                title={branding?.schoolName || t('system_name', 'ExamPrep Academy')}
              >
                {branding?.schoolName || t('system_name', 'ExamPrep Academy')}
              </h1>
              <p className="text-xs text-sidebar-muted capitalize truncate mt-0.5 font-medium">
                {roleLabel}
              </p>
            </div>
          </div>

          {/* Close button for mobile screens */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto no-scrollbar">
          {items.map((item) => {
            const active =
              location.pathname === item.path ||
              (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (onClose) onClose();
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group text-left',
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary shadow-sm font-semibold'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 shrink-0 transition-transform duration-150 group-hover:scale-105',
                    active ? 'text-sidebar-primary' : 'text-sidebar-muted group-hover:text-sidebar-foreground'
                  )}
                />
                <span className="truncate">{t(item.key, item.label)}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
