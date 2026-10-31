import { useState, useEffect, useCallback } from 'react';
import { api, unwrapString, unwrapTime } from '@/lib/api';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Trash2, Power, PowerOff, Building2, Phone, MapPin, Calendar, Eye, GraduationCap, UserCog, Users, Hash, Copy, Check, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function TenantsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: '', admin_username: '', address: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<{ admin_username: string; admin_password: string } | null>(null);
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
    const text = `School Admin Login\nUsername: ${credentials.admin_username}\nPassword: ${credentials.admin_password}`;
    navigator.clipboard.writeText(text);
    setCopiedField('all');
    toast.success('All credentials copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Tenant detail state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTenant, setDetailTenant] = useState<any>(null);
  const [tenantStudents, setTenantStudents] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData(await api.getTenants(page) || []); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditing(null); setForm({ name: '', admin_username: '', address: '', phone: '' }); setDialogOpen(true); };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({ name: item.name, admin_username: '', address: unwrapString(item.address), phone: unwrapString(item.phone) });
    setDialogOpen(true);
  };

  const viewTenantDetail = async (item: any) => {
    setDetailTenant(item);
    setDetailOpen(true);
    setLoadingDetail(true);
    try {
      const students = await api.getStudentsSuperAdmin(item.id, 1, 100);
      setTenantStudents(students || []);
    } catch { setTenantStudents([]); }
    setLoadingDetail(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.updateTenant({ id: editing.id, name: form.name, address: form.address, phone: form.phone });
        toast.success('Tenant updated');
      } else {
        const payload: any = { name: form.name, address: form.address, phone: form.phone };
        if (form.admin_username.trim()) payload.admin_username = form.admin_username.trim();
        const res = await api.createTenant(payload);
        setCredentials({ admin_username: res.admin_username, admin_password: res.admin_password });
        toast.success('Tenant created');
      }
      setDialogOpen(false); fetchData();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.deleteTenant(deleteTarget); toast.success('Tenant deleted'); setDeleteTarget(null); fetchData(); }
    catch (e: any) { toast.error(e.message); }
    setDeleting(false);
  };

  const toggleStatus = async (item: any) => {
    try {
      const status = unwrapString(item.status);
      if (status === 'active') { await api.deactivateTenant(item.id); toast.success('Deactivated'); }
      else { await api.activateTenant(item.id); toast.success('Activated'); }
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = data.filter(item => {
    const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase()) || unwrapString(item.address)?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || unwrapString(item.status) === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'address', label: 'Address' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'status', label: 'Status',
      render: (item) => {
        const s = unwrapString(item.status);
        return <Badge variant={s === 'active' ? 'default' : 'secondary'}>{s || '—'}</Badge>;
      },
    },
  ];

  return (
    <AnimatedPage>
      <PageHeader title="Tenants" description="Manage schools and institutions" onAdd={openAdd} addLabel="Add Tenant">
        <ViewToggle view={view} onChange={setView} />
      </PageHeader>

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        placeholder="Search tenants..."
        filters={[{
          label: 'Status',
          value: statusFilter,
          onChange: setStatusFilter,
          options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }],
        }]}
      />

      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <GridCardSkeleton key={i} />)}
          </div>
        ) : <TableSkeleton cols={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No tenants found" description={search ? 'Try adjusting your search.' : 'Add your first tenant to get started.'} action={!search ? <Button onClick={openAdd}>Add Tenant</Button> : undefined} />
      ) : view === 'grid' ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {filtered.map(item => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-card rounded-xl p-5 group cursor-pointer"
              onClick={() => viewTenantDetail(item)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center group-hover:bg-secondary/25 transition-colors">
                    <Building2 className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{item.name}</h3>
                    <Badge variant={unwrapString(item.status) === 'active' ? 'default' : 'secondary'} className="mt-1 text-xs">
                      {unwrapString(item.status)}
                    </Badge>
                  </div>
                </div>
                <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              <div className="space-y-2 mb-4">
                {unwrapString(item.address) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{unwrapString(item.address)}</span>
                  </div>
                )}
                {unwrapString(item.phone) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{unwrapString(item.phone)}</span>
                  </div>
                )}
                {unwrapTime(item.created_at) && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{format(new Date(unwrapTime(item.created_at)), 'MMM d, yyyy')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border/50" onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="flex-1 gap-1.5" onClick={() => toggleStatus(item)}>
                  {unwrapString(item.status) === 'active' ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5 text-success" />}
                  {unwrapString(item.status) === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
              <Button variant="ghost" size="icon" onClick={() => viewTenantDetail(item)} title="View Details"><Eye className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => toggleStatus(item)} title={unwrapString(item.status) === 'active' ? 'Deactivate' : 'Activate'}>
                {unwrapString(item.status) === 'active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4 text-success" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          )}
        />
      )}

      {/* Tenant Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-secondary" />
              {detailTenant?.name}
            </DialogTitle>
          </DialogHeader>
          {detailTenant && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 pb-4">
                {/* Tenant info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant={unwrapString(detailTenant.status) === 'active' ? 'default' : 'secondary'}>{unwrapString(detailTenant.status)}</Badge>
                  </div>
                  {unwrapString(detailTenant.address) && (
                    <div className="bg-muted/10 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Address</p>
                      <p className="text-sm font-medium text-foreground">{unwrapString(detailTenant.address)}</p>
                    </div>
                  )}
                  {unwrapString(detailTenant.phone) && (
                    <div className="bg-muted/10 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Phone</p>
                      <p className="text-sm font-medium text-foreground">{unwrapString(detailTenant.phone)}</p>
                    </div>
                  )}
                  {unwrapTime(detailTenant.created_at) && (
                    <div className="bg-muted/10 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Created</p>
                      <p className="text-sm font-medium text-foreground">{format(new Date(unwrapTime(detailTenant.created_at)), 'MMM d, yyyy')}</p>
                    </div>
                  )}
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Students</p>
                    <p className="text-2xl font-bold text-foreground">{tenantStudents.length}</p>
                  </div>
                </div>

                {/* Students list */}
                <div className="border border-border/50 rounded-lg">
                  <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-secondary" />
                      Students ({tenantStudents.length})
                    </h4>
                  </div>
                  {loadingDetail ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
                  ) : tenantStudents.length > 0 ? (
                    <div className="divide-y divide-border/30">
                      {tenantStudents.map((s: any, i: number) => (
                        <div key={s.id || i} className="flex items-center gap-3 p-3 hover:bg-muted/5 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                            <span className="text-xs font-bold text-accent-foreground">
                              {((unwrapString(s.first_name)?.[0] || '') + (unwrapString(s.last_name)?.[0] || '')).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{unwrapString(s.first_name)} {unwrapString(s.last_name)}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {unwrapString(s.student_code) && <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{unwrapString(s.student_code)}</span>}
                            </div>
                          </div>
                          <Badge variant={unwrapString(s.status) === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {unwrapString(s.status)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">No students in this school yet</div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Tenant' : 'Add Tenant'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Soressa" /></div>
            {!editing && (
              <div className="space-y-2">
                <Label>Admin Username</Label>
                <Input value={form.admin_username} onChange={e => setForm(f => ({ ...f, admin_username: e.target.value }))} placeholder="soressa_admin (optional — auto-generated if empty)" />
              </div>
            )}
            <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Debre Berhan" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+251926716804" /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={!!credentials} onOpenChange={() => setCredentials(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Shield className="w-5 h-5 text-primary" /> School Admin Credentials
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mb-1">
            Please copy and save these credentials. They will not be displayed again.
          </p>

          <div className="space-y-3 bg-muted/50 p-4 rounded-xl font-mono text-sm border border-border/70">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs font-sans">Username:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground bg-background px-2 py-1 rounded border border-border/50 select-all">
                  {credentials?.admin_username}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleCopy(credentials?.admin_username || '', 'admin_username', 'Username')}
                  title="Copy Username"
                >
                  {copiedField === 'admin_username' ? (
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
                  {credentials?.admin_password}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => handleCopy(credentials?.admin_password || '', 'admin_password', 'Password')}
                  title="Copy Password"
                >
                  {copiedField === 'admin_password' ? (
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

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} title="Delete Tenant" description="This will permanently delete the tenant and all associated data." />
    </AnimatedPage>
  );
}
