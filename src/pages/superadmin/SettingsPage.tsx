import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import AnimatedPage from '@/components/shared/AnimatedPage';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Sliders, Percent, KeyRound, UserCheck, Shield, Sparkles, Save, Palette,
  Building2, Image, Check, Sparkle, UploadCloud, Trash2, Link as LinkIcon
} from 'lucide-react';
import { useTheme, COLOR_PRESETS } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';

const SAMPLE_LOGOS = [
  { label: 'Academic Shield', url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=120&auto=format&fit=crop&q=80' },
  { label: 'Laurel Crest', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&auto=format&fit=crop&q=80' },
  { label: 'Tech Academy', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=120&auto=format&fit=crop&q=80' },
  { label: 'Modern University', url: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=120&auto=format&fit=crop&q=80' },
];

export default function SettingsPage() {
  const { branding, updateBranding, applyBrandColors } = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  // 1. Assessment Percentages
  const [quizPct, setQuizPct] = useState('10');
  const [midPct, setMidPct] = useState('15');
  const [assignmentPct, setAssignmentPct] = useState('10');
  const [projectPct, setProjectPct] = useState('5');
  const [finalPct, setFinalPct] = useState('60');

  // 2. Performance Thresholds
  const [passThreshold, setPassThreshold] = useState('50');
  const [goodThreshold, setGoodThreshold] = useState('70');
  const [excellentThreshold, setExcellentThreshold] = useState('85');

  // 3. Username & ID Generation Rules
  const [usernamePattern, setUsernamePattern] = useState('G{GRADE}{SEC}-{SEQ}');
  const [seqLength, setSeqLength] = useState('3');
  const [defaultPasswordPrefix, setDefaultPasswordPrefix] = useState('Pass');

  // 4. Security & Password Policies
  const [minPasswordLength, setMinPasswordLength] = useState('8');
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSpecialChar, setRequireSpecialChar] = useState(false);
  const [mustChangeFirstLogin, setMustChangeFirstLogin] = useState(true);

  // 5. Student Profile Field Permissions
  const [allowPhotoEdit, setAllowPhotoEdit] = useState(true);
  const [allowPhoneEdit, setAllowPhoneEdit] = useState(true);
  const [allowEmailEdit, setAllowEmailEdit] = useState(true);
  const [allowNameEdit, setAllowNameEdit] = useState(false);
  const [allowSectionEdit, setAllowSectionEdit] = useState(false);

  // 6. Tenant Custom Branding & Colors
  const [schoolName, setSchoolName] = useState(branding?.schoolName || 'ExamPrep Academy');
  const [tagline, setTagline] = useState(branding?.tagline || 'Excellence in Academic Assessment');
  const [logoUrl, setLogoUrl] = useState(branding?.logoUrl || '');
  const [selectedPreset, setSelectedPreset] = useState(branding?.themePreset || 'default');
  const [customHsl, setCustomHsl] = useState(branding?.primaryColor || '180 20% 29%');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const list = await api.getSystemSettings();
      if (Array.isArray(list)) {
        list.forEach((s: any) => {
          try {
            if (s.setting_key === 'assessment_weights') {
              const val = JSON.parse(s.setting_value);
              if (val.quiz) setQuizPct(String(val.quiz));
              if (val.mid) setMidPct(String(val.mid));
              if (val.assignment) setAssignmentPct(String(val.assignment));
              if (val.project) setProjectPct(String(val.project));
              if (val.final) setFinalPct(String(val.final));
            } else if (s.setting_key === 'performance_thresholds') {
              const val = JSON.parse(s.setting_value);
              if (val.pass) setPassThreshold(String(val.pass));
              if (val.good) setGoodThreshold(String(val.good));
              if (val.excellent) setExcellentThreshold(String(val.excellent));
            } else if (s.setting_key === 'username_policy') {
              const val = JSON.parse(s.setting_value);
              if (val.pattern) setUsernamePattern(val.pattern);
              if (val.seqLength) setSeqLength(String(val.seqLength));
              if (val.defaultPrefix) setDefaultPasswordPrefix(val.defaultPrefix);
            } else if (s.setting_key === 'security_policy') {
              const val = JSON.parse(s.setting_value);
              if (val.minLength) setMinPasswordLength(String(val.minLength));
              if (val.requireNumber !== undefined) setRequireNumber(val.requireNumber);
              if (val.requireSpecial !== undefined) setRequireSpecialChar(val.requireSpecial);
              if (val.mustChangeFirst !== undefined) setMustChangeFirstLogin(val.mustChangeFirst);
            } else if (s.setting_key === 'profile_permissions') {
              const val = JSON.parse(s.setting_value);
              if (val.photo !== undefined) setAllowPhotoEdit(val.photo);
              if (val.phone !== undefined) setAllowPhoneEdit(val.phone);
              if (val.email !== undefined) setAllowEmailEdit(val.email);
              if (val.name !== undefined) setAllowNameEdit(val.name);
              if (val.section !== undefined) setAllowSectionEdit(val.section);
            } else if (s.setting_key === 'tenant_branding') {
              const val = JSON.parse(s.setting_value);
              if (val.schoolName) setSchoolName(val.schoolName);
              if (val.tagline) setTagline(val.tagline);
              if (val.logoUrl) setLogoUrl(val.logoUrl);
              if (val.primaryColor) setCustomHsl(val.primaryColor);
              if (val.themePreset) setSelectedPreset(val.themePreset);
            }
          } catch (e) {
            console.error('Failed to parse setting', s.setting_key, e);
          }
        });
      }
    } catch (e) {
      // settings might be uninitialized initially
    }
    setLoading(false);
  };

  const [isDragging, setIsDragging] = useState(false);

  const processLogoFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file size must be less than 5MB');
      return;
    }

    setUploadingLogo(true);

    // 1. Instant local preview via Base64 data URL
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // 2. Upload to server storage
    try {
      const res = await api.uploadImage(file);
      if (res?.url) {
        setLogoUrl(res.url);
        toast.success('Logo uploaded to server successfully');
      }
    } catch (err) {
      // Data URL fallback already displayed
      toast.success('Logo loaded from local image file');
    }
    setUploadingLogo(false);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  const caTotal = Number(quizPct || 0) + Number(midPct || 0) + Number(assignmentPct || 0) + Number(projectPct || 0);
  const grandTotal = caTotal + Number(finalPct || 0);

  const handleSaveAssessment = async () => {
    if (grandTotal !== 100) {
      toast.error(`Total percentage must equal 100%. Currently: ${grandTotal}%`);
      return;
    }
    setSaving(true);
    try {
      await api.saveSystemSetting({
        key: 'assessment_weights',
        value: JSON.stringify({
          quiz: Number(quizPct),
          mid: Number(midPct),
          assignment: Number(assignmentPct),
          project: Number(projectPct),
          ca_total: caTotal,
          final: Number(finalPct),
        }),
      });
      await api.saveSystemSetting({
        key: 'performance_thresholds',
        value: JSON.stringify({
          pass: Number(passThreshold),
          good: Number(goodThreshold),
          excellent: Number(excellentThreshold),
        }),
      });
      toast.success('Assessment rules & grading thresholds saved successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save assessment settings');
    }
    setSaving(false);
  };

  const handleSaveUsernameSecurity = async () => {
    setSaving(true);
    try {
      await api.saveSystemSetting({
        key: 'username_policy',
        value: JSON.stringify({
          pattern: usernamePattern,
          seqLength: Number(seqLength),
          defaultPrefix: defaultPasswordPrefix,
        }),
      });
      await api.saveSystemSetting({
        key: 'security_policy',
        value: JSON.stringify({
          minLength: Number(minPasswordLength),
          requireNumber,
          requireSpecial: requireSpecialChar,
          mustChangeFirst: mustChangeFirstLogin,
        }),
      });
      toast.success('Account generation & security policies saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save security policies');
    }
    setSaving(false);
  };

  const handleSaveProfilePermissions = async () => {
    setSaving(true);
    try {
      await api.saveSystemSetting({
        key: 'profile_permissions',
        value: JSON.stringify({
          photo: allowPhotoEdit,
          phone: allowPhoneEdit,
          email: allowEmailEdit,
          name: allowNameEdit,
          section: allowSectionEdit,
        }),
      });
      toast.success('Student profile field permissions updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save profile permissions');
    }
    setSaving(false);
  };

  const handleSelectPreset = (key: string) => {
    setSelectedPreset(key);
    const preset = COLOR_PRESETS[key];
    if (preset) {
      setCustomHsl(preset.hsl);
      applyBrandColors(preset.hsl);
    }
  };

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      await updateBranding({
        schoolName,
        tagline,
        logoUrl,
        primaryColor: customHsl,
        themePreset: selectedPreset,
      });
      toast.success('Tenant custom branding & color theme applied successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update branding');
    }
    setSaving(false);
  };

  return (
    <AnimatedPage>
      <PageHeader
        title="Institution Settings & Academic Rules"
        description="Configure tenant branding, custom theme colors, school logo upload, assessment weighting, and account rules"
      />

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl bg-muted/60 p-1">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Branding & Logo
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Assessment & Grading
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            IDs & Security
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Profile Permissions
          </TabsTrigger>
        </TabsList>

        {/* 1. Custom Tenant Branding & Theme Colors */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 glass-card border-border/60">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="w-5 h-5 text-primary" />
                  School Identity & Theme Customization
                </CardTitle>
                <CardDescription>
                  Personalize the examination portal with your school's official name, emblem/logo, and collegiate brand colors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* School Name & Tagline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-medium text-sm">School / Academy Display Name</Label>
                    <Input
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. St. George International Academy"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-sm">Motto / Tagline</Label>
                    <Input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Striving for Academic Distinction"
                    />
                  </div>
                </div>

                {/* Direct Logo Upload Zone */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border/40">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm flex items-center gap-2">
                      <Image className="w-4 h-4 text-primary" />
                      School Logo / Official Emblem
                    </Label>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {showUrlInput ? 'Hide URL input' : 'Use image URL instead'}
                    </button>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoFileUpload}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                  />

                  {logoUrl ? (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/60">
                      <div className="flex items-center gap-3">
                        <img
                          src={logoUrl}
                          alt="Uploaded Logo"
                          className="w-14 h-14 rounded-lg object-contain bg-white/10 p-1 border border-border/60 shadow-sm"
                        />
                        <div>
                          <div className="text-xs font-semibold text-foreground">Current School Logo</div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                            <Check className="w-3 h-3" /> Logo loaded & ready
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="gap-1.5 text-xs"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          {uploadingLogo ? 'Uploading...' : 'Replace Logo'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setLogoUrl('')}
                          className="text-destructive hover:bg-destructive/10 text-xs gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all group ${
                        isDragging
                          ? 'border-primary bg-primary/10 scale-[1.01]'
                          : 'border-border/70 hover:border-primary/70 hover:bg-muted/30'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors ${
                        isDragging ? 'bg-primary/20 text-primary scale-110' : 'bg-primary/10 group-hover:bg-primary/20 text-primary'
                      }`}>
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {uploadingLogo ? 'Uploading file...' : isDragging ? 'Drop logo file here...' : 'Click to browse or drag & drop school emblem'}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, SVG, or WebP (transparent background recommended, max 5MB)
                      </p>
                    </div>
                  )}

                  {/* Manual URL Input (Conditional) */}
                  {showUrlInput && (
                    <div className="pt-2">
                      <Label className="text-xs text-muted-foreground mb-1 block">Direct Image URL</Label>
                      <Input
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://example.com/school-logo.png"
                        className="font-mono text-xs"
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Or choose a sample emblem:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SAMPLE_LOGOS.map((sample) => (
                        <button
                          key={sample.label}
                          type="button"
                          onClick={() => setLogoUrl(sample.url)}
                          className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                            logoUrl === sample.url ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border/60 hover:bg-muted/40'
                          }`}
                        >
                          <img src={sample.url} alt={sample.label} className="w-6 h-6 rounded object-cover" />
                          <span className="text-xs font-medium truncate">{sample.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Color Theme Presets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">Collegiate Primary Brand Color</Label>
                    <Badge variant="outline" className="text-xs font-mono">{customHsl}</Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(COLOR_PRESETS).map(([key, preset]) => {
                      const active = selectedPreset === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectPreset(key)}
                          className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                            active
                              ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-sm'
                              : 'border-border/60 hover:border-border hover:bg-muted/20'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <div
                              className="w-6 h-6 rounded-full shadow-sm border border-white/20 flex items-center justify-center text-white text-[10px]"
                              style={{ backgroundColor: preset.hex }}
                            >
                              {active && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground">{preset.hex}</span>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-foreground">{preset.label}</div>
                            <div className="text-[10px] text-muted-foreground line-clamp-1">{preset.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom HSL / Hex string */}
                <div className="p-3.5 rounded-lg bg-muted/20 border border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold">Custom CSS HSL Value</div>
                    <div className="text-[11px] text-muted-foreground">Format: <code>Hue Saturation% Lightness%</code> (e.g. 210 75% 40%)</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={customHsl}
                      onChange={(e) => {
                        setCustomHsl(e.target.value);
                        setSelectedPreset('custom');
                        applyBrandColors(e.target.value);
                      }}
                      className="w-40 font-mono text-xs text-center"
                    />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Applied instantly to sidebar, buttons, cards, report cards, and transfer sheets.
                  </p>
                  <Button onClick={handleSaveBranding} disabled={saving} className="gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Apply & Save Branding'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Interactive Branding Preview */}
            <div className="space-y-4">
              <Card className="glass-card border-border/60">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkle className="w-4 h-4 text-amber-500" />
                    Live Portal Preview
                  </CardTitle>
                  <CardDescription>Simulated view of the branded portal</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Simulated Header */}
                  <div className="p-4 rounded-xl bg-sidebar text-sidebar-foreground border border-sidebar-border shadow-md">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Preview"
                          className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1 border border-sidebar-border shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-sidebar-accent flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-sidebar-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-heading text-sm font-bold truncate text-sidebar-foreground">
                          {schoolName || 'School Name'}
                        </div>
                        <div className="text-[10px] text-sidebar-muted truncate">{tagline || 'School Tagline'}</div>
                      </div>
                    </div>
                  </div>

                  {/* UI Elements with brand color */}
                  <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">Official Examination</span>
                      <Badge className="text-[10px]">Active Term</Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Continuous Assessment: <strong>{caTotal}%</strong> | Final Exam: <strong>{finalPct}%</strong>
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <Button size="sm" className="w-full text-xs font-semibold shadow-sm">
                        Start Supervision
                      </Button>
                      <Button size="sm" variant="outline" className="w-full text-xs">
                        Report Card
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-lg text-[11px] text-muted-foreground">
                    💡 The uploaded logo will automatically appear on all exported <strong>Transfer Sheets</strong>, official <strong>Student Report Cards</strong>, and emergency printable exam packages.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 2. Assessment Weights & Performance Thresholds */}
        <TabsContent value="assessment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 glass-card border-border/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sliders className="w-5 h-5 text-primary" />
                      Continuous Assessment & Final Exam Weights
                    </CardTitle>
                    <CardDescription>
                      Standard: Quiz (10%) + Mid Exam (15%) + Assignment (10%) + Project (5%) = CA (40%) | Final Exam (60%)
                    </CardDescription>
                  </div>
                  <Badge variant={grandTotal === 100 ? 'default' : 'destructive'} className="text-xs px-2.5 py-1">
                    Total: {grandTotal}% {grandTotal === 100 ? '✓ Balanced' : '⚠️ Must be 100%'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 p-3.5 rounded-lg bg-muted/20 border border-border/40">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-sm">Quiz Weight (%)</Label>
                      <Badge variant="outline" className="text-xs">{quizPct}%</Badge>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={quizPct}
                      onChange={(e) => setQuizPct(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">Short regular classroom quizzes</p>
                  </div>

                  <div className="space-y-2 p-3.5 rounded-lg bg-muted/20 border border-border/40">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-sm">Mid Examination (%)</Label>
                      <Badge variant="outline" className="text-xs">{midPct}%</Badge>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={midPct}
                      onChange={(e) => setMidPct(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">Mid-term evaluation test</p>
                  </div>

                  <div className="space-y-2 p-3.5 rounded-lg bg-muted/20 border border-border/40">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-sm">Assignment Weight (%)</Label>
                      <Badge variant="outline" className="text-xs">{assignmentPct}%</Badge>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={assignmentPct}
                      onChange={(e) => setAssignmentPct(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">Individual or group homework</p>
                  </div>

                  <div className="space-y-2 p-3.5 rounded-lg bg-muted/20 border border-border/40">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-sm">Project Work (%)</Label>
                      <Badge variant="outline" className="text-xs">{projectPct}%</Badge>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={projectPct}
                      onChange={(e) => setProjectPct(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">Term project or practical lab</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-foreground">Final Examination Contribution (%)</h4>
                    <p className="text-xs text-muted-foreground">Standard institutional final exam evaluation</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={finalPct}
                      onChange={(e) => setFinalPct(e.target.value)}
                      className="w-24 text-center font-bold text-base"
                    />
                    <span className="font-bold text-lg text-primary">%</span>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Continuous Assessment (CA): <strong className="text-foreground">{caTotal}%</strong> | Final Exam: <strong className="text-foreground">{finalPct}%</strong>
                  </div>
                  <Button onClick={handleSaveAssessment} disabled={saving} className="gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Assessment Rules'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Performance Categories & Thresholds */}
            <Card className="glass-card border-border/60">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Performance Thresholds
                </CardTitle>
                <CardDescription>Configure minimum percentages for letter grades & alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Excellent (A Grade Threshold)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={excellentThreshold}
                      onChange={(e) => setExcellentThreshold(e.target.value)}
                    />
                    <span className="text-sm font-semibold">%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Students scoring $\ge$ {excellentThreshold}%</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-blue-600 dark:text-blue-400">Good (B/C Grade Threshold)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={goodThreshold}
                      onChange={(e) => setGoodThreshold(e.target.value)}
                    />
                    <span className="text-sm font-semibold">%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Students scoring $\ge$ {goodThreshold}%</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-amber-600 dark:text-amber-400">Passing Threshold (D Grade)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={passThreshold}
                      onChange={(e) => setPassThreshold(e.target.value)}
                    />
                    <span className="text-sm font-semibold">%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Scores below {passThreshold}% flagged as at-risk / failing</p>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
                  💡 Question Performance Analysis uses these thresholds to flag unusually difficult or ambiguous exam questions.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. Username Pattern & Password Security Policies */}
        <TabsContent value="accounts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card border-border/60">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Student Code / Username Format
                </CardTitle>
                <CardDescription>
                  Define configurable generation patterns for new student accounts (e.g. G9A-001, G9B-002)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Username Generation Pattern</Label>
                  <Input
                    value={usernamePattern}
                    onChange={(e) => setUsernamePattern(e.target.value)}
                    placeholder="G{GRADE}{SEC}-{SEQ}"
                  />
                  <p className="text-xs text-muted-foreground">
                    Available tags: <code className="bg-muted px-1 rounded">{'{GRADE}'}</code>, <code className="bg-muted px-1 rounded">{'{SEC}'}</code>, <code className="bg-muted px-1 rounded">{'{SEQ}'}</code>, <code className="bg-muted px-1 rounded">{'{YEAR}'}</code>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Sequence Number Digits (Padding)</Label>
                  <Input
                    type="number"
                    min="2"
                    max="6"
                    value={seqLength}
                    onChange={(e) => setSeqLength(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">E.g., 3 digits produces 001, 002, 003...</p>
                </div>

                <div className="space-y-2">
                  <Label>Default Temporary Password Prefix</Label>
                  <Input
                    value={defaultPasswordPrefix}
                    onChange={(e) => setDefaultPasswordPrefix(e.target.value)}
                    placeholder="Pass"
                  />
                  <p className="text-xs text-muted-foreground">Generated as: {defaultPasswordPrefix}@2026</p>
                </div>

                <div className="p-3 bg-secondary/15 rounded-lg border border-secondary/30">
                  <div className="text-xs font-semibold text-secondary-foreground mb-1">Preview Generated Student ID:</div>
                  <div className="font-mono text-sm font-bold text-primary">
                    {usernamePattern.replace('{GRADE}', '9').replace('{SEC}', 'A').replace('{SEQ}', '001').replace('{YEAR}', '26')}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-border/60">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Password & Access Security Policy
                </CardTitle>
                <CardDescription>
                  Enforce strong passwords and mandatory first-time password resets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Minimum Password Length</Label>
                  <Input
                    type="number"
                    min="6"
                    max="32"
                    value={minPasswordLength}
                    onChange={(e) => setMinPasswordLength(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Require at least one number</Label>
                    <p className="text-xs text-muted-foreground">Passwords must include digits 0-9</p>
                  </div>
                  <Switch checked={requireNumber} onCheckedChange={setRequireNumber} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/40">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Require special character (!@#$)</Label>
                    <p className="text-xs text-muted-foreground">Passwords must contain symbols</p>
                  </div>
                  <Switch checked={requireSpecialChar} onCheckedChange={setRequireSpecialChar} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-foreground">Mandatory Password Change on First Login</Label>
                    <p className="text-xs text-muted-foreground">Forces students to reset temporary password</p>
                  </div>
                  <Switch checked={mustChangeFirstLogin} onCheckedChange={setMustChangeFirstLogin} />
                </div>

                <div className="pt-2">
                  <Button onClick={handleSaveUsernameSecurity} disabled={saving} className="w-full gap-2">
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Policies & Rules'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 4. Student Profile Permissions */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="glass-card border-border/60 max-w-3xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                Student Profile Field Permissions
              </CardTitle>
              <CardDescription>
                School Admin controls which fields students are authorized to edit on their personal profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-muted/20 border border-border/40">
                <div>
                  <div className="font-medium text-sm">Profile Photo / Avatar</div>
                  <p className="text-xs text-muted-foreground">Allow students to upload or update profile picture</p>
                </div>
                <Switch checked={allowPhotoEdit} onCheckedChange={setAllowPhotoEdit} />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-muted/20 border border-border/40">
                <div>
                  <div className="font-medium text-sm">Phone Number</div>
                  <p className="text-xs text-muted-foreground">Allow students to update contact mobile number</p>
                </div>
                <Switch checked={allowPhoneEdit} onCheckedChange={setAllowPhoneEdit} />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-muted/20 border border-border/40">
                <div>
                  <div className="font-medium text-sm">Email Address</div>
                  <p className="text-xs text-muted-foreground">Allow students to edit personal notification email</p>
                </div>
                <Switch checked={allowEmailEdit} onCheckedChange={setAllowEmailEdit} />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <div>
                  <div className="font-medium text-sm text-foreground">Legal Full Name</div>
                  <p className="text-xs text-muted-foreground">Restricted institutional field (Keep disabled to prevent falsification)</p>
                </div>
                <Switch checked={allowNameEdit} onCheckedChange={setAllowNameEdit} />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg bg-destructive/10 border border-destructive/20">
                <div>
                  <div className="font-medium text-sm text-foreground">Grade & Section Allocation</div>
                  <p className="text-xs text-muted-foreground">Controlled by Vice School Director / Registrar only</p>
                </div>
                <Switch checked={allowSectionEdit} onCheckedChange={setAllowSectionEdit} />
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={handleSaveProfilePermissions} disabled={saving} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Profile Permissions'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AnimatedPage>
  );
}
