import { useState, useEffect } from 'react';
import { api, unwrapString } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import AnimatedPage from '@/components/shared/AnimatedPage';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar, Plus, CheckCircle2, Trash2, Building2, Sparkles } from 'lucide-react';

export default function AcademicYearsPage() {
  const { t, language, formatDate, ethiopianYearOptions } = useLanguage();
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState<string>('');
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [modalTenantId, setModalTenantId] = useState<string>('');
  const [yearName, setYearName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    api.getTenants(1, 100)
      .then((tList) => {
        const list = Array.isArray(tList) ? tList : [];
        setTenants(list);
        if (list.length > 0) {
          setTenantId(list[0].id);
          setModalTenantId(list[0].id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAcademicYears();
  }, [tenantId]);

  const loadAcademicYears = async () => {
    setLoading(true);
    try {
      const list = await api.getAcademicYears(tenantId || undefined);
      setYears(Array.isArray(list) ? list : []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load academic years');
      setYears([]);
    }
    setLoading(false);
  };

  const handleSelectPreset = (preset: any) => {
    setYearName(preset.value);
    // Suggest default start/end dates based on Gregorian range
    const [startYear, endYear] = preset.gregorianRange.split(' - ').map((s: string) => s.trim());
    if (startYear && endYear) {
      setStartDate(`${startYear}-09-11`);
      setEndDate(`${endYear}-06-30`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName.trim()) {
      toast.error('Please enter academic year name (e.g. 2018 ዓ.ም. or 2025/2026)');
      return;
    }
    const targetTenant = modalTenantId || tenantId;
    if (!targetTenant) {
      toast.error('Please select a school tenant');
      return;
    }
    setCreating(true);
    try {
      await api.createAcademicYear({
        tenant_id: targetTenant,
        year_name: yearName.trim(),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      toast.success(`Academic Year ${yearName} created successfully`);
      setYearName('');
      setStartDate('');
      setEndDate('');
      setOpenModal(false);
      loadAcademicYears();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create academic year');
    }
    setCreating(false);
  };

  const handleSetActive = async (id: string, name: string) => {
    try {
      await api.setActiveAcademicYear(id);
      toast.success(`${name} is now the active academic year`);
      loadAcademicYears();
    } catch (e: any) {
      toast.error(e.message || 'Failed to set active year');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete academic year ${name}?`)) return;
    try {
      await api.deleteAcademicYear(id);
      toast.success(`Academic Year ${name} removed`);
      loadAcademicYears();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete academic year');
    }
  };

  const getTenantName = (id: string) => {
    const t = tenants.find((item) => item.id === id);
    if (!t) return id;
    return unwrapString(t.name) || t.name;
  };

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title={t('academic_years_nav', 'Academic Years & Terms')}
          description="Manage institutional multi-year academic terms (e.g. 2017 ዓ.ም., 2018 ዓ.ም., 2025/26)"
        />

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              {t('add_academic_year', 'New Academic Year')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {t('create_academic_year', 'Create Academic Year')}
                </DialogTitle>
                <DialogDescription>
                  Enter the academic term identifier and operational date boundaries.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{t('select_tenant', 'School Tenant')} *</Label>
                  <Select
                    value={modalTenantId || tenantId}
                    onValueChange={setModalTenantId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tenant school..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {unwrapString(t.name) || t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ethiopian Calendar Quick Presets */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    {t('ethiopian_academic_year', 'Ethiopian Calendar Presets (ዓ.ም.)')}
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {ethiopianYearOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectPreset(opt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          yearName === opt.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted/40 hover:bg-muted border-border/60 text-foreground'
                        }`}
                      >
                        {language === 'am' ? opt.labelAmharic : opt.labelEnglish}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('academic_year', 'Year Name / Term Code')} *</Label>
                  <Input
                    placeholder="e.g. 2018 ዓ.ም. or 2025/2026"
                    value={yearName}
                    onChange={(e) => setYearName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t('start_date', 'Start Date')}</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    {startDate && (
                      <span className="text-[10px] text-muted-foreground block">
                        {formatDate(startDate)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t('end_date', 'End Date')}</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    {endDate && (
                      <span className="text-[10px] text-muted-foreground block">
                        {formatDate(endDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>
                  {t('cancel', 'Cancel')}
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? t('saving', 'Creating...') : t('save', 'Create Term')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tenant filter bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/60 shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-primary shrink-0" />
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('select_tenant', 'Filtered School')}
            </div>
            <div className="text-sm font-bold text-foreground">
              {tenantId ? getTenantName(tenantId) : 'All Schools'}
            </div>
          </div>
        </div>
        <div className="w-full sm:w-64">
          <Select value={tenantId} onValueChange={setTenantId}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Filter by school..." />
            </SelectTrigger>
            <SelectContent>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {unwrapString(t.name) || t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t('academic_terms', 'Registered Academic Terms')}
          </CardTitle>
          <CardDescription>
            All classes, student enrollments, teacher assignments, examinations, and official transfer sheets are scoped to the active academic year.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Loading academic years...
            </div>
          ) : years.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No academic years found for this school. Click "New Academic Year" to initialize your first term.
            </div>
          ) : (
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>{t('academic_year', 'Academic Year')}</TableHead>
                    <TableHead>{t('start_date', 'Start Date')}</TableHead>
                    <TableHead>{t('end_date', 'End Date')}</TableHead>
                    <TableHead>{t('status', 'Status')}</TableHead>
                    <TableHead className="text-right">{t('actions', 'Actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {years.map((y: any) => (
                    <TableRow key={y.id} className={y.is_active ? 'bg-primary/5' : ''}>
                      <TableCell className="font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {y.year_name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {y.start_date ? formatDate(y.start_date) : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {y.end_date ? formatDate(y.end_date) : '—'}
                      </TableCell>
                      <TableCell>
                        {y.is_active ? (
                          <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600 text-white font-medium">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('current_year', 'Current Active Term')}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-normal">
                            {t('inactive', 'Inactive / Archived')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!y.is_active && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetActive(y.id, y.year_name)}
                              className="text-xs h-8"
                            >
                              {t('set_active_year', 'Set as Active')}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(y.id, y.year_name)}
                            className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AnimatedPage>
  );
}
