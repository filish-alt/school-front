import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Palette,
  Lock,
  Sun,
  Moon,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Languages,
  CalendarDays,
} from 'lucide-react';

interface PersonalSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'profile' | 'appearance' | 'security';
}

export default function PersonalSettingsDialog({
  open,
  onOpenChange,
  defaultTab = 'profile',
}: PersonalSettingsDialogProps) {
  const { user, displayName } = useAuth();
  const { isDark, toggle, branding } = useTheme();
  const { language, setLanguage, calendarSystem, setCalendarSystem, t, formatDate } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security'>(defaultTab);

  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Sync default tab if opened specifically
  React.useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  if (!user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      toast.success(t('success', 'Password changed successfully'));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = t(`role_${user.role}`, user.role.replace('_', ' '));
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden rounded-2xl border border-border/80 shadow-2xl">
        {/* Header with gradient accent */}
        <div className="p-6 bg-gradient-to-r from-primary/15 via-secondary/10 to-accent/20 border-b border-border/60">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-base shadow-sm">
                {initials}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
                  {displayName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {t('personal_settings', 'Personal preferences, appearance, and account security')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 pt-4 max-h-[75vh] overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as any)}
            className="w-full"
          >
            <TabsList className="grid grid-cols-3 mb-5 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger
                value="profile"
                className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                {t('profile', 'Profile')}
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-1.5"
              >
                <Palette className="w-3.5 h-3.5" />
                {t('appearance', 'Appearance')}
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="rounded-lg text-xs font-medium data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                {t('security', 'Security')}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Profile Details */}
            <TabsContent value="profile" className="space-y-4 focus-visible:outline-none">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-xs text-muted-foreground">{t('profile', 'Account ID')}</span>
                  <span className="font-mono text-xs font-medium text-foreground">{user.uid}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-xs text-muted-foreground">{t('search', 'Username')}</span>
                  <span className="font-mono text-xs font-bold text-foreground">
                    {user.username || displayName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/40">
                  <span className="text-xs text-muted-foreground">{t('designated_role', 'Assigned Role')}</span>
                  <Badge variant="secondary" className="capitalize text-xs font-medium">
                    {roleLabel}
                  </Badge>
                </div>
                {user.tid && (
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-xs text-muted-foreground">{t('select_tenant', 'School / Tenant')}</span>
                    <div className="flex items-center gap-1 text-xs font-medium text-foreground">
                      <Building2 className="w-3.5 h-3.5 text-primary" />
                      <span>{branding?.schoolName || user.tid}</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground">{t('status', 'Session Status')}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('active', 'Active')}
                  </span>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Appearance & Localization */}
            <TabsContent value="appearance" className="space-y-5 focus-visible:outline-none">
              {/* Language Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-primary" /> {t('language', 'Language')}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setLanguage('am')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                      language === 'am'
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                        : 'border-border/60 hover:bg-muted/30 opacity-70'
                    }`}
                  >
                    <span className="text-xl">🇪🇹</span>
                    <div className="text-left">
                      <div className="text-xs font-bold text-foreground">አማርኛ (Amharic)</div>
                      <div className="text-[10px] text-muted-foreground">የኢትዮጵያ ቋንቋ</div>
                    </div>
                  </div>
                  <div
                    onClick={() => setLanguage('en')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-2.5 ${
                      language === 'en'
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                        : 'border-border/60 hover:bg-muted/30 opacity-70'
                    }`}
                  >
                    <span className="text-xl">🇬🇧</span>
                    <div className="text-left">
                      <div className="text-xs font-bold text-foreground">English</div>
                      <div className="text-[10px] text-muted-foreground">Default international</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar System */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-primary" /> {t('calendar_system', 'Calendar System')}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    onClick={() => setCalendarSystem('ethiopian')}
                    className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1 ${
                      calendarSystem === 'ethiopian'
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                        : 'border-border/60 hover:bg-muted/30 opacity-70'
                    }`}
                  >
                    <span className="text-xs font-bold text-foreground">የኢትዮጵያ (ዓ.ም.)</span>
                    <span className="text-[10px] text-muted-foreground">Ethiopian Calendar</span>
                  </div>
                  <div
                    onClick={() => setCalendarSystem('dual')}
                    className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1 ${
                      calendarSystem === 'dual'
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                        : 'border-border/60 hover:bg-muted/30 opacity-70'
                    }`}
                  >
                    <span className="text-xs font-bold text-foreground">ሁለቱም (Dual)</span>
                    <span className="text-[10px] text-muted-foreground">ዓ.ም. + G.C.</span>
                  </div>
                  <div
                    onClick={() => setCalendarSystem('gregorian')}
                    className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-1 ${
                      calendarSystem === 'gregorian'
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                        : 'border-border/60 hover:bg-muted/30 opacity-70'
                    }`}
                  >
                    <span className="text-xs font-bold text-foreground">ጎርጎሮሳውያን</span>
                    <span className="text-[10px] text-muted-foreground">Gregorian (G.C.)</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Today: <span className="font-semibold text-foreground">{formatDate(new Date())}</span>
                </p>
              </div>

              {/* Theme Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">{t('appearance', 'Interface Theme')}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Light Mode Card */}
                  <div
                    onClick={() => {
                      if (isDark) toggle();
                    }}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-1.5 text-center ${
                      !isDark
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                        : 'border-border/60 hover:bg-muted/30 opacity-70'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t('theme_light', 'Light Mode')}</div>
                      <div className="text-[10px] text-muted-foreground">Crisp clean light theme</div>
                    </div>
                  </div>

                  {/* Dark Mode Card */}
                  <div
                    onClick={() => {
                      if (!isDark) toggle();
                    }}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center gap-1.5 text-center ${
                      isDark
                        ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary'
                        : 'border-border/60 hover:bg-muted/30 opacity-70'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">{t('theme_dark', 'Dark Mode')}</div>
                      <div className="text-[10px] text-muted-foreground">Modern sleek dark aesthetics</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Change Password */}
            <TabsContent value="security" className="focus-visible:outline-none">
              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">{t('old_password', 'Current Password')}</Label>
                  <div className="relative">
                    <Input
                      type={showOld ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-9 text-xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOld(!showOld)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">{t('new_password', 'New Password')}</Label>
                  <div className="relative">
                    <Input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 chars)"
                      className="pr-9 text-xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground font-medium">{t('confirm_password', 'Confirm New Password')}</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="text-xs"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gap-2 mt-2 text-xs font-semibold"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {loading ? t('saving', 'Updating Password...') : t('update_password', 'Save New Password')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
