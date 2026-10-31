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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, BookOpen, GraduationCap, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';

export default function SectionsPage() {
  const { user } = useAuth();
  const canManage = ['super_admin', 'school_admin', 'school_director', 'vice_director'].includes(user?.role || '');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', grade_level: '', academic_year: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData(await api.getSections(page) || []); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (editing) { await api.updateSection({ id: editing.id, name: form.name }); toast.success('Updated'); }
      else { await api.createSection(form); toast.success('Created'); }
      setDialogOpen(false); fetchData();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.deleteSection(deleteTarget); toast.success('Deleted'); setDeleteTarget(null); fetchData(); }
    catch (e: any) { toast.error(e.message); }
    setDeleting(false);
  };

  const filtered = data.filter(d => !search || d.name?.toLowerCase().includes(search.toLowerCase()));

  const columns: Column<any>[] = [
    { key: 'name', label: 'Name' },
    { key: 'grade_level', label: 'Grade Level' },
    { key: 'academic_year', label: 'Academic Year' },
  ];

  return (
    <AnimatedPage>
      <PageHeader
        title="Sections"
        description={canManage ? "Manage class sections" : "View class sections"}
        onAdd={canManage ? () => { setEditing(null); setForm({ name: '', grade_level: '', academic_year: '' }); setDialogOpen(true); } : undefined}
        addLabel="Add Section"
      >
        <ViewToggle view={view} onChange={setView} />
      </PageHeader>
      <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search sections..." />

      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{[1,2,3].map(i => <GridCardSkeleton key={i} />)}</div>
        ) : <TableSkeleton cols={3} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No sections" description={canManage ? "Create your first section." : "No sections found."} />
      ) : view === 'grid' ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map(item => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } }}
              whileHover={{ y: -4 }}
              className="glass-card rounded-xl p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-accent-foreground" />
                </div>
              </div>
              <h3 className="font-heading font-semibold text-foreground text-lg">{item.name}</h3>
              <div className="flex flex-wrap gap-2 mt-3">
                {unwrapString(item.grade_level) && (
                  <Badge variant="outline" className="gap-1"><GraduationCap className="w-3 h-3" /> Grade {unwrapString(item.grade_level)}</Badge>
                )}
                {unwrapString(item.academic_year) && (
                  <Badge variant="secondary" className="gap-1"><Calendar className="w-3 h-3" /> {unwrapString(item.academic_year)}</Badge>
                )}
              </div>
              {canManage && (
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                  <Button variant="ghost" size="sm" className="flex-1 gap-1.5" onClick={() => { setEditing(item); setForm({ name: item.name, grade_level: unwrapString(item.grade_level), academic_year: unwrapString(item.academic_year) }); setDialogOpen(true); }}>
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={false} page={page} onPageChange={setPage}
          actions={canManage ? (item) => (
            <div className="flex items-center gap-1 justify-end">
              <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setForm({ name: item.name, grade_level: unwrapString(item.grade_level), academic_year: unwrapString(item.academic_year) }); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ) : undefined}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Section' : 'Add Section'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            {!editing && <>
              <div className="space-y-2"><Label>Grade Level</Label><Input value={form.grade_level} onChange={e => setForm(f => ({ ...f, grade_level: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Academic Year</Label><Input placeholder="e.g. 2025-2026" value={form.academic_year} onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))} /></div>
            </>}
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
    </AnimatedPage>
  );
}
