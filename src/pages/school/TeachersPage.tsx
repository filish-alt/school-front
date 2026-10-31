import { useState, useEffect, useCallback } from 'react';
import { api, unwrapString } from '@/lib/api';
import DataTable, { Column } from '@/components/shared/DataTable';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Edit, Trash2, UserCog, Plus, Users, Shield, Crown, Award, GraduationCap, Building2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const roleMeta: Record<string, { label: string; color: string; icon: any }> = {
  school_director: {
    label: 'School Director',
    color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/40',
    icon: Crown,
  },
  vice_director: {
    label: 'Vice Director',
    color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-300/40',
    icon: Shield,
  },
  department_head: {
    label: 'Department Head',
    color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/40',
    icon: Award,
  },
  teacher: {
    label: 'Teacher',
    color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/40',
    icon: GraduationCap,
  },
};

const avatarColors = [
  'bg-primary/15 text-primary',
  'bg-success/15 text-success',
  'bg-warning/15 text-warning',
  'bg-destructive/15 text-destructive',
  'bg-accent text-accent-foreground',
  'bg-secondary/15 text-secondary',
];

export default function TeachersPage() {
  const [data, setData] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    teacher_code: '',
    role_name: 'teacher',
    department_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string; role_name?: string } | null>(null);
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
    const roleName = roleMeta[credentials.role_name || 'teacher']?.label || credentials.role_name || 'Staff';
    const text = `Staff Role: ${roleName}\nUsername: ${credentials.username}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text);
    setCopiedField('all');
    toast.success('All credentials copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [teachersRes, deptsRes] = await Promise.allSettled([
        api.getTeachers(page),
        api.getDepartments(1, 100),
      ]);

      if (teachersRes.status === 'fulfilled') {
        setData(teachersRes.value || []);
      }
      if (deptsRes.status === 'fulfilled') {
        setDepartments(deptsRes.value || []);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch data');
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setEditing(null);
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      teacher_code: '',
      role_name: 'teacher',
      department_id: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditing(item);
    setForm({
      first_name: unwrapString(item.first_name) || '',
      last_name: unwrapString(item.last_name) || '',
      email: unwrapString(item.email) || '',
      teacher_code: unwrapString(item.teacher_code) || '',
      role_name: unwrapString(item.role_name) || 'teacher',
      department_id: unwrapString(item.department_id) || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error('First and Last name are required');
      return;
    }
    if (!editing && !form.teacher_code.trim()) {
      toast.error('Staff/Teacher code is required');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.updateTeacher({
          id: editing.id,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          role_name: form.role_name,
          department_id: form.department_id || undefined,
        });
        toast.success('Staff profile updated');
      } else {
        const payload: any = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          teacher_code: form.teacher_code.trim(),
          role_name: form.role_name,
        };
        if (form.department_id) payload.department_id = form.department_id;
        const res = await api.createTeacher(payload);
        setCredentials({
          username: res.username,
          password: res.password,
          role_name: form.role_name,
        });
        toast.success('Staff member created successfully');
      }
      setDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save staff member');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteTeacher(deleteTarget);
      toast.success('Staff member removed');
      setDeleteTarget(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete staff member');
    }
    setDeleting(false);
  };

  const getRole = (item: any) => unwrapString(item.role_name) || 'teacher';

  const filtered = data.filter((item) => {
    const role = getRole(item);
    if (roleFilter !== 'all' && role !== roleFilter) return false;
    if (!search) return true;
    const name = `${unwrapString(item.first_name)} ${unwrapString(item.last_name)} ${unwrapString(item.teacher_code)}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const columns: Column<any>[] = [
    {
      key: 'teacher_code',
      label: 'Staff Code',
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-primary">
          {unwrapString(item.teacher_code) || '—'}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Full Name',
      render: (item) => (
        <span className="font-medium text-foreground">
          {unwrapString(item.first_name)} {unwrapString(item.last_name)}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (item) => {
        const role = getRole(item);
        const meta = roleMeta[role] || roleMeta.teacher;
        const Icon = meta.icon;
        return (
          <Badge variant="outline" className={`gap-1.5 py-0.5 text-xs font-medium border ${meta.color}`}>
            <Icon className="w-3 h-3" />
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: 'email',
      label: 'Email',
      render: (item) => (
        <span className="text-muted-foreground text-xs">
          {unwrapString(item.email) || '—'}
        </span>
      ),
    },
  ];

  const initials = (item: any) => {
    const f = unwrapString(item.first_name)?.[0] || '';
    const l = unwrapString(item.last_name)?.[0] || '';
    return (f + l).toUpperCase() || 'S';
  };

  const countByRole = (role: string) => data.filter((i) => getRole(i) === role).length;

  return (
    <AnimatedPage>
      {/* Directory header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background">
              {data.length}
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">
              Staff & Faculty Directory
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage school leadership, department heads, and teaching faculty
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <ViewToggle view={view} onChange={setView} />
          <Button onClick={handleOpenCreate} className="gap-2 shadow-sm flex-1 sm:flex-initial">
            <Plus className="w-4 h-4" /> Add Staff / Teacher
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          placeholder="Search by name or staff code..."
          className="w-full md:w-80"
        />

        <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-full md:w-auto">
          <TabsList className="bg-muted/60 flex-wrap h-auto p-1">
            <TabsTrigger value="all" className="text-xs">
              All ({data.length})
            </TabsTrigger>
            <TabsTrigger value="school_director" className="text-xs gap-1.5">
              <Crown className="w-3 h-3 text-purple-500" />
              Directors ({countByRole('school_director')})
            </TabsTrigger>
            <TabsTrigger value="vice_director" className="text-xs gap-1.5">
              <Shield className="w-3 h-3 text-indigo-500" />
              Vice Directors ({countByRole('vice_director')})
            </TabsTrigger>
            <TabsTrigger value="department_head" className="text-xs gap-1.5">
              <Award className="w-3 h-3 text-amber-500" />
              Dept Heads ({countByRole('department_head')})
            </TabsTrigger>
            <TabsTrigger value="teacher" className="text-xs gap-1.5">
              <GraduationCap className="w-3 h-3 text-emerald-500" />
              Teachers ({countByRole('teacher')})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <GridCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <TableSkeleton cols={4} />
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No staff members found"
          description={
            roleFilter !== 'all'
              ? `No members found matching the selected role.`
              : 'Add your first director, department head, or teacher to get started.'
          }
        />
      ) : view === 'grid' ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {filtered.map((item, i) => {
            const role = getRole(item);
            const meta = roleMeta[role] || roleMeta.teacher;
            const RoleIcon = meta.icon;
            return (
              <motion.div
                key={item.id}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -4 }}
                className="glass-card rounded-2xl p-4 flex flex-col justify-between group relative overflow-hidden border border-border/70 hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className={`w-12 h-12 rounded-2xl ${avatarColors[i % avatarColors.length]} flex items-center justify-center font-heading font-bold text-base shadow-sm shrink-0`}
                    >
                      {initials(item)}
                    </motion.div>

                    <Badge variant="outline" className={`gap-1 py-0.5 px-2 text-[11px] font-semibold border ${meta.color}`}>
                      <RoleIcon className="w-3 h-3" />
                      {meta.label}
                    </Badge>
                  </div>

                  <h3 className="font-heading font-semibold text-foreground text-base truncate">
                    {unwrapString(item.first_name)} {unwrapString(item.last_name)}
                  </h3>

                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-muted/80 text-foreground font-medium">
                      {unwrapString(item.teacher_code) || 'NO-CODE'}
                    </span>
                    {unwrapString(item.email) && (
                      <span className="truncate max-w-[140px]" title={unwrapString(item.email)}>
                        {unwrapString(item.email)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">ID: {item.id.slice(0, 8)}...</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenEdit(item)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
              <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget(item.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        />
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              {editing ? 'Edit Staff Member' : 'Add Staff / Faculty Member'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Role Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Designated Role</Label>
              <Select
                value={form.role_name}
                onValueChange={(val) => setForm((f) => ({ ...f, role_name: val }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-emerald-500" />
                      <span>Teacher</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="department_head">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>Department Head</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="vice_director">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-500" />
                      <span>Vice Director</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">First Name *</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  placeholder="e.g. John"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Last Name *</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  placeholder="e.g. Doe"
                />
              </div>
            </div>

            {!editing && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Staff / Login Code *</Label>
                <Input
                  value={form.teacher_code}
                  onChange={(e) => setForm((f) => ({ ...f, teacher_code: e.target.value }))}
                  placeholder="e.g. DIR-2026-001 or TCH-MATH-01"
                />
                <p className="text-[11px] text-muted-foreground">
                  This code will serve as the initial login username for this staff member.
                </p>
              </div>
            )}

            {!editing && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email Address (Optional)</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="staff.member@school.edu"
                />
              </div>
            )}

            {departments.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  Department (Optional)
                </Label>
                <Select
                  value={form.department_id || 'none'}
                  onValueChange={(val) => setForm((f) => ({ ...f, department_id: val === 'none' ? '' : val }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / School-wide</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {unwrapString(d.name) || d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full mt-2">
              {saving ? 'Saving...' : editing ? 'Update Staff Member' : 'Create Staff Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Generated Credentials Dialog */}
      <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Shield className="w-5 h-5 text-primary" />
              Staff Login Credentials
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Please copy these credentials and share them securely with the staff member.
          </p>

          <div className="space-y-3 bg-muted/50 p-4 rounded-xl font-mono text-sm border border-border/80">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <span className="text-muted-foreground text-xs font-sans">Role:</span>
              <span className="font-sans font-semibold text-xs capitalize">
                {roleMeta[credentials?.role_name || 'teacher']?.label || credentials?.role_name}
              </span>
            </div>

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
                  onClick={() => handleCopy(credentials?.username || '', 'username', 'Username')}
                  title="Copy Username"
                >
                  {copiedField === 'username' ? (
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
                <span className="font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 select-all">
                  {credentials?.password}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleCopy(credentials?.password || '', 'password', 'Password')}
                  title="Copy Password"
                >
                  {copiedField === 'password' ? (
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

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </AnimatedPage>
  );
}
