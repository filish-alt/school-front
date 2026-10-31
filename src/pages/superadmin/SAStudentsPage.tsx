import { useState, useEffect, useCallback } from 'react';
import { api, unwrapString } from '@/lib/api';
import DataTable, { Column } from '@/components/shared/DataTable';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import AnimatedPage from '@/components/shared/AnimatedPage';
import ViewToggle from '@/components/shared/ViewToggle';
import SearchFilter from '@/components/shared/SearchFilter';
import EmptyState from '@/components/shared/EmptyState';
import { GridCardSkeleton, TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Upload, Download, Edit, Trash2, Hash, Building2, CheckCircle2, AlertTriangle, KeyRound, Copy, Check, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function SAStudentsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const [tenants, setTenants] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState<string>(user?.tenant_id || '');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ student_code: '', first_name: '', last_name: '', email: '', section_id: '' });
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [importSummary, setImportSummary] = useState<any[] | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    if (!credentials) return;
    const text = `Student Login\nUsername: ${credentials.username}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text);
    setCopiedField('all');
    toast.success('All credentials copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyImported = () => {
    if (!importSummary) return;
    const valid = importSummary.filter((r) => !r.error && r.username && r.password);
    if (valid.length === 0) {
      toast.error('No credentials available to copy');
      return;
    }
    const text = valid.map((r) => `Student: ${r.student_code || '—'} | Username: ${r.username} | Password: ${r.password}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedField('import_all');
    toast.success(`Copied credentials for ${valid.length} students!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Sections for the selected tenant
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      api.getTenants(1, 100)
        .then((tList) => {
          const list = Array.isArray(tList) ? tList : [];
          setTenants(list);
          if (list.length > 0 && !tenantId) {
            setTenantId(list[0].id);
          }
        })
        .catch(() => {});
    } else if (user?.tenant_id && !tenantId) {
      setTenantId(user.tenant_id);
    }
  }, [isSuperAdmin, user?.tenant_id, tenantId]);

  // Fetch sections
  useEffect(() => {
    if (!tenantId) return;
    const fetchSecs = isSuperAdmin
      ? api.getSectionsSuperAdmin(tenantId, 1, 100)
      : api.getSections(1, 100);

    fetchSecs
      .then((d) => setSections(Array.isArray(d) ? d : []))
      .catch(() => setSections([]));
  }, [tenantId, isSuperAdmin]);

  const fetchStudents = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await api.getStudentsSuperAdmin(tenantId, page, 100);
      setData(Array.isArray(res) ? res : []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load students');
      setData([]);
    }
    setLoading(false);
  }, [tenantId, page]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.updateStudentSuperAdmin(editing.id, {
          id: editing.id,
          first_name: form.first_name,
          last_name: form.last_name,
          section_id: form.section_id || undefined,
        });
        toast.success('Student updated successfully');
      } else {
        const payload: any = {
          tenant_id: tenantId,
          student_code: form.student_code,
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
        };
        if (form.section_id) payload.section_id = form.section_id;
        const res = await api.createStudentSuperAdmin(payload);
        setCredentials({ username: res.username, password: res.password });
        toast.success('Student created successfully');
      }
      setDialogOpen(false);
      fetchStudents();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save student');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteStudentSuperAdmin(deleteTarget);
      toast.success('Student deactivated');
      setDeleteTarget(null);
      fetchStudents();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete student');
    }
    setDeleting(false);
  };

  const [importing, setImporting] = useState(false);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!tenantId) {
      toast.error('Please select a school tenant first');
      e.target.value = '';
      return;
    }
    setImporting(true);
    try {
      const res = await api.importStudentsSuperAdmin(tenantId, file);
      const results = Array.isArray(res) ? res : [];
      const successes = results.filter((r) => !r.error);
      const failures = results.filter((r) => r.error);

      if (failures.length > 0 && successes.length === 0) {
        toast.error(`Import failed: ${failures[0].error || 'Invalid CSV data'}`);
      } else if (failures.length > 0) {
        toast.warning(`Imported ${successes.length} students, but ${failures.length} rows failed.`);
      } else {
        toast.success(`Successfully imported ${successes.length} students!`);
      }

      setImportSummary(results);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    }
    setImporting(false);
    e.target.value = '';
  };

  const getString = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return unwrapString(val) || '';
  };

  const filtered = (data || []).filter((item) => {
    const status = getString(item.status) || 'active';
    if (statusFilter !== 'all' && status !== statusFilter) return false;
    if (!search) return true;
    const text = `${getString(item.first_name)} ${getString(item.last_name)} ${getString(item.student_code)}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const getSectionName = (item: any) => {
    const secId = getString(item.section_id);
    if (!secId) return 'Unassigned';
    const match = sections.find((s) => s.id === secId);
    if (match) return unwrapString(match.name) || match.name;
    return unwrapString(item.section_name) || item.section_name || 'Unassigned';
  };

  const columns: Column<any>[] = [
    { key: 'student_code', label: 'Student Code', render: (item) => getString(item.student_code) || '—' },
    { key: 'first_name', label: 'First Name', render: (item) => getString(item.first_name) || '—' },
    { key: 'last_name', label: 'Last Name', render: (item) => getString(item.last_name) || '—' },
    {
      key: 'section',
      label: 'Section Class',
      render: (item) => {
        const sec = getSectionName(item);
        return sec === 'Unassigned' ? (
          <span className="text-muted-foreground text-xs italic">Unassigned</span>
        ) : (
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
            {sec}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={(getString(item.status) || 'active') === 'active' ? 'default' : 'secondary'} className="capitalize">
          {getString(item.status) || 'active'}
        </Badge>
      ),
    },
  ];

  const initials = (item: any) =>
    ((getString(item.first_name)?.[0] || '') + (getString(item.last_name)?.[0] || '')).toUpperCase() || 'S';

  const downloadSampleCsv = () => {
    const csvContent =
      'student_code,first_name,last_name,email,year\n' +
      'STU-2026-001,John,Doe,john.doe@example.com,2026\n' +
      'STU-2026-002,Jane,Smith,jane.smith@example.com,2026\n' +
      'STU-2026-003,Michael,Brown,michael.brown@example.com,2026\n' +
      'STU-2026-004,Sarah,Johnson,sarah.johnson@example.com,2026\n' +
      'STU-2026-005,David,Wilson,david.wilson@example.com,2026\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_students.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample student CSV downloaded');
  };

  const activeCount = (data || []).filter((i) => (getString(i.status) || 'active') === 'active').length;
  const inactiveCount = (data || []).filter((i) => getString(i.status) === 'inactive').length;

  return (
    <AnimatedPage>
      <PageHeader
        title="Student Directory"
        description="Manage students and bulk import rosters across institutional tenants"
        onAdd={
          tenantId
            ? () => {
                setEditing(null);
                setForm({ student_code: '', first_name: '', last_name: '', email: '', section_id: '' });
                setDialogOpen(true);
              }
            : undefined
        }
        addLabel="Add Student"
      >
        <Button variant="outline" onClick={downloadSampleCsv} className="gap-2">
          <Download className="w-4 h-4 text-primary" />
          Template
        </Button>
        <label className="cursor-pointer">
          <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
          <Button variant="outline" asChild disabled={importing} className="gap-2">
            <span>
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import CSV'}
              {!tenantId && <Badge variant="secondary" className="text-xs ml-1">Select tenant first</Badge>}
            </span>
          </Button>
        </label>
        <ViewToggle view={view} onChange={setView} />
      </PageHeader>

      {/* Tenant Selector */}
      <div className="mb-6 max-w-md p-4 rounded-xl bg-card border border-border/60 shadow-sm space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-primary" /> Active School Tenant
        </Label>
        <Select value={tenantId} onValueChange={setTenantId}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select school tenant..." />
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search by name or code..." className="w-full sm:w-72" />
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-muted/60">
            <TabsTrigger value="active" className="text-xs">
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs">
              Inactive ({inactiveCount})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All ({(data || []).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!tenantId ? (
        <EmptyState icon={Building2} title="No tenant selected" description="Please choose a school tenant above to inspect and manage student rosters." />
      ) : loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <GridCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <TableSkeleton cols={4} />
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No students found"
          description="Add a student manually or import a CSV roster to enroll students in this school."
          action={
            <Button
              onClick={() => {
                setEditing(null);
                setForm({ student_code: '', first_name: '', last_name: '', email: '', section_id: '' });
                setDialogOpen(true);
              }}
              className="gap-2"
            >
              Add First Student
            </Button>
          }
        />
      ) : view === 'grid' ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
              whileHover={{ y: -4 }}
              className="glass-card rounded-xl p-5 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center group-hover:scale-105 transition-transform">
                  <span className="text-sm font-heading">{initials(item)}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-heading font-semibold text-foreground truncate">
                    {getString(item.first_name)} {getString(item.last_name)}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Hash className="w-3 h-3" />
                    {getString(item.student_code)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={(getString(item.status) || 'active') === 'active' ? 'default' : 'secondary'} className="capitalize">
                  {getString(item.status) || 'active'}
                </Badge>
                {getSectionName(item) !== 'Unassigned' && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {getSectionName(item)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(item);
                    setForm({
                      student_code: getString(item.student_code),
                      first_name: getString(item.first_name),
                      last_name: getString(item.last_name),
                      email: '',
                      section_id: getString(item.section_id),
                    });
                    setDialogOpen(true);
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Button>
                {statusFilter === 'active' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(item.id)}
                    className="text-destructive hover:bg-destructive/10 gap-1.5 text-xs ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Deactivate
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={false}
          page={page}
          onPageChange={setPage}
          actions={(item) => (
            <div className="flex items-center gap-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditing(item);
                  setForm({
                    student_code: getString(item.student_code),
                    first_name: getString(item.first_name),
                    last_name: getString(item.last_name),
                    email: '',
                    section_id: getString(item.section_id),
                  });
                  setDialogOpen(true);
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              {statusFilter === 'active' && (
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        />
      )}

      {/* Manual Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Student' : 'Add New Student'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update student personal details and section assignment.' : 'Fill in the details to enroll a new student.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {!editing && (
              <div className="space-y-2">
                <Label>Student Code / ID <span className="text-destructive">*</span></Label>
                <Input
                  value={form.student_code}
                  onChange={(e) => setForm((f) => ({ ...f, student_code: e.target.value }))}
                  placeholder="e.g. STU-2025-001"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First Name <span className="text-destructive">*</span></Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name <span className="text-destructive">*</span></Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Section Class Assignment</Label>
              <Select
                value={form.section_id || 'none'}
                onValueChange={(v) => setForm((f) => ({ ...f, section_id: v === 'none' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Section (Unassigned)</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {unwrapString(s.name) || s.name} {unwrapString(s.grade_level) ? `(Grade ${unwrapString(s.grade_level)})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!editing && (
              <div className="space-y-2">
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="student@example.com"
                />
              </div>
            )}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : editing ? 'Update Student' : 'Save Student'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generated Single Credentials Modal */}
      <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <KeyRound className="w-5 h-5 text-primary" /> Student Account Created
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mb-1">
            Please copy and provide these initial login credentials to the student:
          </p>

          <div className="space-y-3 bg-muted/50 p-4 rounded-xl font-mono text-sm border border-border/70">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs font-sans">Username:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground bg-background px-2 py-1 rounded border border-border/50 select-all">
                  {credentials?.username}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleCopy(credentials?.username || '', 'student_username', 'Username')}
                  title="Copy Username"
                >
                  {copiedField === 'student_username' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs font-sans">Temporary Password:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 select-all">
                  {credentials?.password}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleCopy(credentials?.password || '', 'student_password', 'Password')}
                  title="Copy Password"
                >
                  {copiedField === 'student_password' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              onClick={handleCopyAll}
              className="flex-1 gap-2 border-primary/30 hover:bg-primary/5 text-xs font-semibold"
            >
              {copiedField === 'all' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 text-primary" />
              )}
              Copy All Credentials
            </Button>
            <Button onClick={() => setCredentials(null)} className="flex-1 text-xs">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk CSV Import Summary Dialog */}
      <Dialog open={!!importSummary} onOpenChange={() => setImportSummary(null)}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> CSV Import Summary
            </DialogTitle>
            <DialogDescription>
              Results and generated credentials for the imported student batch
            </DialogDescription>
          </DialogHeader>

          {importSummary && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <div className="text-xs text-muted-foreground">Successfully Created</div>
                      <div className="text-base font-bold text-emerald-600">
                        {importSummary.filter((r) => !r.error).length}
                      </div>
                    </div>
                  </div>
                  {importSummary.some((r) => !r.error && r.username) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyImported}
                      className="text-xs gap-1.5 h-8 bg-background border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                    >
                      {copiedField === 'import_all' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      Copy Roster
                    </Button>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <div>
                    <div className="text-xs text-muted-foreground">Failed Rows</div>
                    <div className="text-base font-bold text-destructive">
                      {importSummary.filter((r) => r.error).length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 sticky top-0 border-b">
                      <tr>
                        <th className="p-2.5 text-left font-semibold">Row</th>
                        <th className="p-2.5 text-left font-semibold">Code</th>
                        <th className="p-2.5 text-left font-semibold">Username</th>
                        <th className="p-2.5 text-left font-semibold">Password</th>
                        <th className="p-2.5 text-left font-semibold">Status</th>
                        <th className="p-2.5 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {importSummary.map((r, i) => (
                        <tr key={i} className={r.error ? 'bg-destructive/5' : 'hover:bg-muted/30'}>
                          <td className="p-2.5 font-mono">{r.row || i + 1}</td>
                          <td className="p-2.5 font-mono font-medium">{r.student_code || '—'}</td>
                          <td className="p-2.5 font-mono">{r.username || '—'}</td>
                          <td className="p-2.5 font-mono font-bold text-primary">{r.password || '—'}</td>
                          <td className="p-2.5">
                            {r.error ? (
                              <span className="text-destructive font-medium">{r.error}</span>
                            ) : (
                              <Badge className="bg-emerald-600 text-white text-[10px]">Created</Badge>
                            )}
                          </td>
                          <td className="p-2.5 text-right">
                            {r.username && r.password ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopy(`${r.username} / ${r.password}`, `row_${i}`, `Student ${r.student_code || i + 1}`)}
                                title="Copy username and password"
                              >
                                {copiedField === `row_${i}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3 text-muted-foreground" />
                                )}
                              </Button>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Button onClick={() => setImportSummary(null)} className="w-full">
                Close Summary
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Deactivate Student"
        description="This will deactivate the student account. They can be reactivated later."
      />
    </AnimatedPage>
  );
}
