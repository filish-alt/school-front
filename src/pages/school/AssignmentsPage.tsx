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
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, School, UserCog, BookOpen, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AssignmentsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ teacher_id: '', subject_id: '', section_id: '' });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    api.getTeachers(1, 100)
      .then((res) => setTeachers(Array.isArray(res) ? res : []))
      .catch(() => setTeachers([]));

    api.getSubjects(1, 100)
      .then((res) => setSubjects(Array.isArray(res) ? res : []))
      .catch(() => setSubjects([]));

    api.getSections(1, 100)
      .then((res) => setSections(Array.isArray(res) ? res : []))
      .catch(() => setSections([]));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAssignments();
      setData(Array.isArray(res) ? res : []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load assignments');
      setData([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!form.teacher_id || !form.subject_id || !form.section_id) {
      toast.error('Please select a teacher, subject, and section');
      return;
    }
    setSaving(true);
    try {
      await api.createAssignment(form);
      toast.success('Assignment created successfully');
      setDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create assignment');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteAssignment({
        teacher_id: deleteTarget.teacher_id,
        subject_id: deleteTarget.subject_id,
        section_id: deleteTarget.section_id,
      });
      toast.success('Assignment deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete assignment');
    }
    setDeleting(false);
  };

  const getName = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    return unwrapString(val) || '';
  };

  const filtered = (data || []).filter((item) => {
    if (!search) return true;
    const teacherName = `${getName(item.first_name)} ${getName(item.last_name)}`.trim();
    const subjectName = getName(item.subject_name);
    const sectionName = getName(item.section_name);
    const text = `${teacherName} ${subjectName} ${sectionName}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const columns: Column<any>[] = [
    {
      key: 'first_name',
      label: 'Teacher',
      render: (item) => `${getName(item.first_name)} ${getName(item.last_name)}`.trim() || 'Teacher',
    },
    { key: 'subject_name', label: 'Subject', render: (item) => getName(item.subject_name) || 'Subject' },
    { key: 'section_name', label: 'Section', render: (item) => getName(item.section_name) || 'Section' },
  ];

  return (
    <AnimatedPage>
      <PageHeader
        title="Teacher Assignments"
        description="Assign teachers to subjects and section classes"
        onAdd={() => {
          setForm({ teacher_id: '', subject_id: '', section_id: '' });
          setDialogOpen(true);
        }}
        addLabel="Add Assignment"
      >
        <ViewToggle view={view} onChange={setView} />
      </PageHeader>
      <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search assignments..." />

      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <GridCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <TableSkeleton cols={3} />
        )
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={School}
          title="No assignments found"
          description="Assign a teacher to a subject and section to get started."
        />
      ) : view === 'grid' ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map((item, i) => (
            <motion.div
              key={item.id || `${item.teacher_id}-${item.subject_id}-${item.section_id}` || i}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              whileHover={{ y: -4 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center font-bold text-secondary text-sm">
                  {getName(item.first_name)?.[0] || 'T'}
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">
                    {getName(item.first_name)} {getName(item.last_name)}
                  </h3>
                  <p className="text-xs text-muted-foreground">Assigned Teacher</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="gap-1">
                  <ClipboardList className="w-3 h-3" /> {getName(item.subject_name) || 'Subject'}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <BookOpen className="w-3 h-3" /> {getName(item.section_name) || 'Section'}
                </Badge>
              </div>
              <div className="pt-3 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive gap-1.5"
                  onClick={() => setDeleteTarget(item)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={false}
          actions={(item) => (
            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          )}
        />
      )}

      {/* Assignment creation dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Create Teacher Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Teacher</Label>
              <Select value={form.teacher_id} onValueChange={(v) => setForm((f) => ({ ...f, teacher_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {(teachers || []).length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">No teachers available</div>
                  ) : (
                    (teachers || []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {getName(t.first_name)} {getName(t.last_name)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={form.subject_id} onValueChange={(v) => setForm((f) => ({ ...f, subject_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject..." />
                </SelectTrigger>
                <SelectContent>
                  {(subjects || []).length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">No subjects available</div>
                  ) : (
                    (subjects || []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {getName(s.name)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={form.section_id} onValueChange={(v) => setForm((f) => ({ ...f, section_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section..." />
                </SelectTrigger>
                <SelectContent>
                  {(sections || []).length === 0 ? (
                    <div className="p-2 text-xs text-muted-foreground text-center">No sections available</div>
                  ) : (
                    (sections || []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {getName(s.name)} {s.grade_level ? `(Grade ${getName(s.grade_level)})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Create Assignment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove Assignment"
      />
    </AnimatedPage>
  );
}
