import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
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
import { Edit, Trash2, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

import { useAuth } from '@/contexts/AuthContext';

const subjectIcons = ['📐', '🧬', '📚', '🌍', '🎨', '⚗️', '💻', '📝'];

export default function SubjectsPage() {
  const { user } = useAuth();
  const canManage = ['super_admin', 'school_admin', 'school_director', 'vice_director'].includes(user?.role || '');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData(await api.getSubjects(page) || []); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    try {
      if (editing) { await api.updateSubject({ id: editing.id, name }); toast.success('Updated'); }
      else { await api.createSubject({ name }); toast.success('Created'); }
      setDialogOpen(false); fetchData();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.deleteSubject(deleteTarget); toast.success('Deleted'); setDeleteTarget(null); fetchData(); }
    catch (e: any) { toast.error(e.message); }
    setDeleting(false);
  };

  const filtered = data.filter(d => !search || d.name?.toLowerCase().includes(search.toLowerCase()));
  const columns: Column<any>[] = [{ key: 'name', label: 'Name' }];

  return (
    <AnimatedPage>
      <PageHeader
        title="Subjects"
        description={canManage ? "Manage academic subjects" : "View academic subjects"}
        onAdd={canManage ? () => { setEditing(null); setName(''); setDialogOpen(true); } : undefined}
        addLabel="Add Subject"
      >
        <ViewToggle view={view} onChange={setView} />
      </PageHeader>
      <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search subjects..." />

      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{[1,2,3,4].map(i => <GridCardSkeleton key={i} />)}</div>
        ) : <TableSkeleton cols={1} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No subjects" description={canManage ? "Add your first subject." : "No subjects found."} />
      ) : view === 'grid' ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-card rounded-xl p-6 text-center group cursor-default"
            >
              <div className="text-4xl mb-3">{subjectIcons[i % subjectIcons.length]}</div>
              <h3 className="font-heading text-lg font-semibold text-foreground">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">Subject</p>
              {canManage && (
                <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-border/50">
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { setEditing(item); setName(item.name); setDialogOpen(true); }}>
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={false} page={page} onPageChange={setPage} searchKey="name"
          actions={canManage ? (item) => (
            <div className="flex items-center gap-1 justify-end">
              <Button variant="ghost" size="icon" onClick={() => { setEditing(item); setName(item.name); setDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ) : undefined}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Subject' : 'Add Subject'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
    </AnimatedPage>
  );
}
