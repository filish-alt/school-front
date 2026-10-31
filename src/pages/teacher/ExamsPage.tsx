import { useState, useEffect, useCallback } from 'react';
import { api, unwrapString, unwrapInt, unwrapTime } from '@/lib/api';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Eye, Send, ClipboardList, Clock, CheckCircle2, FileQuestion, Plus, Trash2, Shuffle, ListOrdered, BookOpen, Users, Award, Download, CalendarIcon, XCircle, ShieldAlert, Play, Sliders } from 'lucide-react';
import { getSubjectEmoji } from '@/lib/subjectIcon';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import LiveExamControlsModal from './LiveExamControlsModal';

function toLocalDatetimeString(isoOrLocal: string): string {
  if (!isoOrLocal) return '';
  try {
    const d = new Date(isoOrLocal);
    if (isNaN(d.getTime())) return isoOrLocal;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  } catch { return isoOrLocal; }
}

function localToISO(local: string): string {
  if (!local) return '';
  const d = new Date(local);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

export default function ExamsPage() {
  const { user } = useAuth();
  const isDeptHeadOrLeadership = ['super_admin', 'school_admin', 'school_director', 'vice_director', 'department_head'].includes(user?.role || '');
  const isTeacherOnly = user?.role === 'teacher';

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', subject_id: '', section_id: '', duration_minutes: 60, start_time: '', end_time: '' });
  const [saving, setSaving] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [examDetail, setExamDetail] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Add questions state
  const [addQuestionsOpen, setAddQuestionsOpen] = useState(false);
  const [addQuestionsExamId, setAddQuestionsExamId] = useState('');
  const [questionBanks, setQuestionBanks] = useState<any[]>([]);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [manualMarks, setManualMarks] = useState(1);
  const [randomCount, setRandomCount] = useState(5);
  const [randomMarks, setRandomMarks] = useState(1);
  const [addingQuestions, setAddingQuestions] = useState(false);
  const [deleteExamQId, setDeleteExamQId] = useState<{ eqId: string; examId: string } | null>(null);
  const [deletingEQ, setDeletingEQ] = useState(false);

  // Marks state
  const [marksOpen, setMarksOpen] = useState(false);
  const [marksData, setMarksData] = useState<any>(null);
  const [marksLoading, setMarksLoading] = useState(false);

  // Live Supervision state
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [selectedLiveExam, setSelectedLiveExam] = useState<any>(null);

  const openLiveSupervision = (exam: any) => {
    setSelectedLiveExam(exam);
    setLiveModalOpen(true);
  };

  useEffect(() => {
    api.getTeacherSubjects().then(setSubjects).catch(() => {});
    api.getTeacherSections().then(setSections).catch(() => {});
    api.getQuestionBanks(1, 100).then(d => setQuestionBanks(d || [])).catch(() => {});
    api.getMyAssignments().then(a => setAssignments(a || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedBankId) {
      api.getQuestions(selectedBankId, 1, 100).then(d => setBankQuestions(d || [])).catch(() => {});
    } else {
      setBankQuestions([]);
    }
  }, [selectedBankId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { setData(await api.getExams(page) || []); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Build lookup maps from assignments
  const subjectMap = new Map(subjects.map(s => [s.subject_id, s.subject_name]));
  const sectionMap = new Map(sections.map(s => [s.section_id, s.section_name]));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.createExam({
        ...form,
        start_time: localToISO(form.start_time),
        end_time: localToISO(form.end_time),
      });
      toast.success('Exam created');
      setDialogOpen(false);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const viewDetail = async (id: string) => {
    try { const res = await api.getExam(id); setExamDetail(res); setDetailOpen(true); }
    catch (e: any) { toast.error(e.message); }
  };

  const submitForApproval = async (id: string) => {
    try {
      await api.updateExamControls(id, { approval_status: 'under_review', status: 'under_review' });
      toast.success('Exam submitted to Department Head for review & approval');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit exam for approval');
    }
  };

  const approveAndPublish = async (id: string) => {
    try {
      await api.updateExamControls(id, { approval_status: 'approved', is_locked: true, status: 'published' });
      toast.success('Exam approved and published for students');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve and publish exam');
    }
  };

  const rejectExam = async (id: string) => {
    try {
      await api.updateExamControls(id, { approval_status: 'rejected', is_locked: false, status: 'draft' });
      toast.warning('Exam returned to teacher for revisions');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to reject exam');
    }
  };

  const unpublishExam = async (id: string) => {
    try {
      await api.updateExamControls(id, { approval_status: 'draft', is_locked: false, status: 'draft' });
      toast.success('Exam unpublished');
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openAddQuestions = (examId: string) => {
    setAddQuestionsExamId(examId);
    setSelectedBankId('');
    setSelectedQuestions([]);
    setAddQuestionsOpen(true);
  };

  const addManualQuestions = async () => {
    if (!selectedQuestions.length) { toast.error('Select at least one question'); return; }
    setAddingQuestions(true);
    try {
      await api.addExamQuestions({
        exam_id: addQuestionsExamId,
        questions: selectedQuestions.map((qid, i) => ({ question_id: qid, marks: manualMarks, order_index: i + 1 })),
      });
      toast.success(`${selectedQuestions.length} questions added`);
      setAddQuestionsOpen(false);
      if (detailOpen) viewDetail(addQuestionsExamId);
    } catch (e: any) { toast.error(e.message); }
    setAddingQuestions(false);
  };

  const addRandomQuestions = async () => {
    if (!selectedBankId) { toast.error('Select a question bank'); return; }
    setAddingQuestions(true);
    try {
      await api.addRandomExamQuestions({
        exam_id: addQuestionsExamId,
        question_bank_id: selectedBankId,
        count: randomCount,
        marks: randomMarks,
      });
      toast.success(`${randomCount} random questions added`);
      setAddQuestionsOpen(false);
      if (detailOpen) viewDetail(addQuestionsExamId);
    } catch (e: any) { toast.error(e.message); }
    setAddingQuestions(false);
  };

  const handleDeleteExamQuestion = async () => {
    if (!deleteExamQId) return;
    setDeletingEQ(true);
    try {
      await api.deleteExamQuestion(deleteExamQId.eqId, deleteExamQId.examId);
      toast.success('Question removed from exam');
      setDeleteExamQId(null);
      viewDetail(deleteExamQId.examId);
    } catch (e: any) { toast.error(e.message); }
    setDeletingEQ(false);
  };

  const toggleQuestion = (qid: string) => {
    setSelectedQuestions(prev => prev.includes(qid) ? prev.filter(id => id !== qid) : [...prev, qid]);
  };

  const viewMarks = async (examId: string) => {
    setMarksLoading(true);
    setMarksOpen(true);
    try {
      const data = await api.getExamMarks(examId);
      setMarksData({ ...data, examId });
    } catch (e: any) { toast.error(e.message); setMarksData(null); }
    setMarksLoading(false);
  };

  const downloadMarks = async (examId: string) => {
    try {
      const blob = await api.downloadExamMarks(examId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam-marks-${examId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = data.filter(item => {
    const matchSearch = !search || unwrapString(item.title)?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || unwrapString(item.status) === statusFilter;
    return matchSearch && matchStatus;
  });

  const getExamSubject = (item: any) => {
    const sid = unwrapString(item.subject_id) || item.subject_id;
    return subjectMap.get(sid) || '';
  };
  const getExamSection = (item: any) => {
    const sid = unwrapString(item.section_id) || item.section_id;
    return sectionMap.get(sid) || '';
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
      case 'approved':
        return <Badge className="bg-emerald-600 text-white gap-1"><CheckCircle2 className="w-3 h-3" /> Published</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1"><Clock className="w-3 h-3" /> Under Review</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Revisions Needed</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Draft</Badge>;
    }
  };

  const columns: Column<any>[] = [
    { key: 'title', label: 'Title' },
    { key: 'subject_id', label: 'Subject', render: (item) => getExamSubject(item) || '—' },
    { key: 'section_id', label: 'Section', render: (item) => getExamSection(item) || '—' },
    { key: 'status', label: 'Status', render: (item) => renderStatusBadge(unwrapString(item.status)) },
    { key: 'duration_minutes', label: 'Duration', render: (item) => `${unwrapInt(item.duration_minutes)} min` },
    { key: 'total_marks', label: 'Marks', render: (item) => unwrapInt(item.total_marks) },
    { key: 'start_time', label: 'Start', render: (item) => { const t = unwrapTime(item.start_time); return t ? format(new Date(t), 'MMM d HH:mm') : '—'; } },
  ];

  return (
    <AnimatedPage>
      <PageHeader title="Exams" description="Create and manage exams" onAdd={() => { setForm({ title: '', subject_id: '', section_id: '', duration_minutes: 60, start_time: '', end_time: '' }); setDialogOpen(true); }} addLabel="Create Exam">
        <ViewToggle view={view} onChange={setView} />
      </PageHeader>
      <SearchFilter
        search={search} onSearchChange={setSearch} placeholder="Search exams..."
        filters={[{
          label: 'Status',
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Pending Approval', value: 'under_review' },
            { label: 'Published', value: 'published' },
          ],
        }]}
      />

      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3].map(i => <GridCardSkeleton key={i} />)}</div>
        ) : <TableSkeleton cols={7} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No exams found" description="Create your first exam." />
      ) : view === 'grid' ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {filtered.map(item => {
            const status = unwrapString(item.status);
            const marks = unwrapInt(item.total_marks);
            const duration = unwrapInt(item.duration_minutes);
            const startT = unwrapTime(item.start_time);
            const endT = unwrapTime(item.end_time);
            const subjectName = getExamSubject(item);
            const sectionName = getExamSection(item);
            const isPublished = status === 'published' || status === 'approved';
            const isUnderReview = status === 'under_review';
            const isDraft = status === 'draft' || status === 'rejected' || !status;
            return (
              <motion.div
                key={item.id}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -4 }}
                className="glass-card rounded-xl overflow-hidden group"
              >
                <div className={`h-2 ${isPublished ? 'bg-success' : isUnderReview ? 'bg-amber-500' : 'bg-warning'}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-semibold text-foreground text-lg">{unwrapString(item.title)}</h3>
                      <div className="mt-1">
                        {renderStatusBadge(status)}
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-2xl">
                      {getSubjectEmoji(subjectName) || <FileQuestion className="w-6 h-6 text-secondary" />}
                    </div>
                  </div>

                  {/* Subject & Section info */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {subjectName && (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <BookOpen className="w-3 h-3" /> {subjectName}
                      </Badge>
                    )}
                    {sectionName && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Users className="w-3 h-3" /> {sectionName}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/10 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-semibold text-foreground">{duration} min</p>
                    </div>
                    <div className="bg-muted/10 rounded-lg p-2.5 text-center">
                      <p className="text-xs text-muted-foreground">Total Marks</p>
                      <p className="font-semibold text-foreground">{marks}</p>
                    </div>
                  </div>

                  {startT && (
                    <p className="text-xs text-muted-foreground mt-3">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {format(new Date(startT), 'MMM d, yyyy · HH:mm')}
                      {endT && ` — ${format(new Date(endT), 'HH:mm')}`}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50 flex-wrap">
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                      onClick={() => openLiveSupervision(item)}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> Supervise
                    </Button>

                    {/* Teacher Workflow */}
                    {isTeacherOnly && isDraft && (
                      <Button variant="outline" size="sm" className="gap-1.5 text-primary border-primary/40 hover:bg-primary/10" onClick={() => submitForApproval(item.id)}>
                        <Send className="w-3.5 h-3.5" /> Submit for Approval
                      </Button>
                    )}

                    {/* Department Head & Leadership Workflow */}
                    {isDeptHeadOrLeadership && isUnderReview && (
                      <>
                        <Button variant="default" size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => approveAndPublish(item.id)}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => rejectExam(item.id)}>
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </>
                    )}

                    {isDeptHeadOrLeadership && isDraft && (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => approveAndPublish(item.id)}>
                        <Send className="w-3.5 h-3.5" /> Publish
                      </Button>
                    )}

                    {isPublished && (!endT || new Date(endT) > new Date()) && (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => unpublishExam(item.id)} title="Unpublish">
                        <XCircle className="w-3.5 h-3.5" /> Unpublish
                      </Button>
                    )}

                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openAddQuestions(item.id)}>
                      <Plus className="w-3.5 h-3.5" /> Questions
                    </Button>
                    {isPublished && (
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => viewMarks(item.id)}>
                        <Award className="w-3.5 h-3.5" /> Marks
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => viewDetail(item.id)}>
                      <Eye className="w-3.5 h-3.5" /> Details
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={false} page={page} onPageChange={setPage}
          actions={(item) => {
            const status = unwrapString(item.status);
            const endT = unwrapTime(item.end_time);
            const isPublished = status === 'published' || status === 'approved';
            const isUnderReview = status === 'under_review';
            const isDraft = status === 'draft' || status === 'rejected' || !status;
            const canUnpublish = isPublished && (!endT || new Date(endT) > new Date());
            return (
              <div className="flex items-center gap-1 justify-end">
                <Button variant="default" size="sm" className="h-8 gap-1 text-xs" onClick={() => openLiveSupervision(item)} title="Live Supervision & Controls">
                  <ShieldAlert className="w-3.5 h-3.5" /> Supervise
                </Button>
                {isTeacherOnly && isDraft && (
                  <Button variant="ghost" size="icon" onClick={() => submitForApproval(item.id)} title="Submit for Approval">
                    <Send className="w-4 h-4 text-primary" />
                  </Button>
                )}
                {isDeptHeadOrLeadership && isUnderReview && (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => approveAndPublish(item.id)} title="Approve & Publish">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => rejectExam(item.id)} title="Reject">
                      <XCircle className="w-4 h-4 text-destructive" />
                    </Button>
                  </>
                )}
                {isDeptHeadOrLeadership && isDraft && (
                  <Button variant="ghost" size="icon" onClick={() => approveAndPublish(item.id)} title="Publish">
                    <Send className="w-4 h-4 text-primary" />
                  </Button>
                )}
                {canUnpublish && (
                  <Button variant="ghost" size="icon" onClick={() => unpublishExam(item.id)} title="Unpublish">
                    <XCircle className="w-4 h-4 text-warning" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => openAddQuestions(item.id)} title="Add Questions"><Plus className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => viewDetail(item.id)}><Eye className="w-4 h-4" /></Button>
              </div>
            );
          }}
        />
      )}

      {/* Create Exam Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Exam</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={form.subject_id} onValueChange={v => setForm(f => ({ ...f, subject_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select subject..." /></SelectTrigger>
                <SelectContent>{subjects.map(s => (<SelectItem key={s.subject_id} value={s.subject_id}>{s.subject_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={form.section_id} onValueChange={v => setForm(f => ({ ...f, section_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select section..." /></SelectTrigger>
                <SelectContent>{sections.map(s => (<SelectItem key={s.section_id} value={s.section_id}>{s.section_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Duration (minutes)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} /></div>
            <div className="space-y-2">
              <Label>Start Date & Time</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !form.start_time && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.start_time ? format(new Date(form.start_time), 'MMM d, yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.start_time ? new Date(form.start_time) : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        const existing = form.start_time ? new Date(form.start_time) : new Date();
                        date.setHours(existing.getHours(), existing.getMinutes());
                        setForm(f => ({ ...f, start_time: toLocalDatetimeString(date.toISOString()) }));
                      }}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  className="w-28"
                  value={form.start_time ? form.start_time.split('T')[1] || '' : ''}
                  onChange={e => {
                    const date = form.start_time ? form.start_time.split('T')[0] : new Date().toISOString().split('T')[0];
                    setForm(f => ({ ...f, start_time: `${date}T${e.target.value}` }));
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>End Date & Time</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !form.end_time && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.end_time ? format(new Date(form.end_time), 'MMM d, yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.end_time ? new Date(form.end_time) : undefined}
                      onSelect={(date) => {
                        if (!date) return;
                        const existing = form.end_time ? new Date(form.end_time) : new Date();
                        date.setHours(existing.getHours(), existing.getMinutes());
                        setForm(f => ({ ...f, end_time: toLocalDatetimeString(date.toISOString()) }));
                      }}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  className="w-28"
                  value={form.end_time ? form.end_time.split('T')[1] || '' : ''}
                  onChange={e => {
                    const date = form.end_time ? form.end_time.split('T')[0] : new Date().toISOString().split('T')[0];
                    setForm(f => ({ ...f, end_time: `${date}T${e.target.value}` }));
                  }}
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? 'Saving...' : 'Create'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Exam Detail Dialog - SCROLLABLE & LARGE */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>Exam Details</DialogTitle></DialogHeader>
          {examDetail && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 pb-4">
                {/* Exam info grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Title</p>
                    <p className="font-semibold text-foreground">{unwrapString(examDetail.exam?.title)}</p>
                  </div>
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <Badge variant={unwrapString(examDetail.exam?.status) === 'published' ? 'default' : 'secondary'}>{unwrapString(examDetail.exam?.status)}</Badge>
                  </div>
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                    <p className="font-semibold text-foreground">{unwrapInt(examDetail.exam?.duration_minutes)} min</p>
                  </div>
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Marks</p>
                    <p className="font-semibold text-foreground">{unwrapInt(examDetail.exam?.total_marks)}</p>
                  </div>
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Subject</p>
                    <p className="font-semibold text-foreground">{subjectMap.get(unwrapString(examDetail.exam?.subject_id) || examDetail.exam?.subject_id) || '—'}</p>
                  </div>
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-1">Section</p>
                    <p className="font-semibold text-foreground">{sectionMap.get(unwrapString(examDetail.exam?.section_id) || examDetail.exam?.section_id) || '—'}</p>
                  </div>
                </div>

                {/* Time info */}
                {(unwrapTime(examDetail.exam?.start_time) || unwrapTime(examDetail.exam?.end_time)) && (
                  <div className="bg-muted/10 rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-2">Schedule</p>
                    <div className="flex gap-6 text-sm">
                      {unwrapTime(examDetail.exam?.start_time) && (
                        <div>
                          <span className="text-muted-foreground">Start: </span>
                          <span className="font-medium text-foreground">{format(new Date(unwrapTime(examDetail.exam?.start_time)), 'MMM d, yyyy · HH:mm')}</span>
                        </div>
                      )}
                      {unwrapTime(examDetail.exam?.end_time) && (
                        <div>
                          <span className="text-muted-foreground">End: </span>
                          <span className="font-medium text-foreground">{format(new Date(unwrapTime(examDetail.exam?.end_time)), 'MMM d, yyyy · HH:mm')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Questions in exam */}
                <div className="border border-border/50 rounded-lg">
                  <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <h4 className="font-semibold text-foreground">Questions ({examDetail.questions?.length || 0})</h4>
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { setDetailOpen(false); openAddQuestions(examDetail.exam?.id); }}>
                      <Plus className="w-3.5 h-3.5" /> Add More
                    </Button>
                  </div>
                  {examDetail.questions?.length > 0 ? (
                    <div className="divide-y divide-border/30">
                      {examDetail.questions.map((q: any, i: number) => (
                        <div key={q.exam_question_id || q.id || i} className="flex items-center gap-3 p-3 hover:bg-muted/5 transition-colors">
                          <div className="w-8 h-8 rounded-md bg-secondary/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-secondary">{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{unwrapString(q.question_text) || q.question_text || 'Question'}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{unwrapInt(q.marks) || q.marks || 0} marks</Badge>
                              {(unwrapString(q.difficulty_level) || q.difficulty_level) && (
                                <Badge variant="secondary" className="text-xs">{unwrapString(q.difficulty_level) || q.difficulty_level}</Badge>
                              )}
                              {(unwrapString(q.type) || q.type) && (
                                <Badge variant="outline" className="text-xs">{unwrapString(q.type) || q.type}</Badge>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => setDeleteExamQId({ eqId: q.exam_question_id || q.id, examId: examDetail.exam?.id })}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">No questions added yet</div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Questions Dialog */}
      <Dialog open={addQuestionsOpen} onOpenChange={setAddQuestionsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader><DialogTitle>Add Questions to Exam</DialogTitle></DialogHeader>
          <Tabs defaultValue="manual" className="mt-2 flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="gap-1.5"><ListOrdered className="w-4 h-4" /> Manual Select</TabsTrigger>
              <TabsTrigger value="random" className="gap-1.5"><Shuffle className="w-4 h-4" /> Random</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 mt-4 flex-1 min-h-0">
              <div className="space-y-2">
                <Label>Question Bank</Label>
                <Select value={selectedBankId} onValueChange={v => { setSelectedBankId(v); setSelectedQuestions([]); }}>
                  <SelectTrigger><SelectValue placeholder="Select bank..." /></SelectTrigger>
                  <SelectContent>{questionBanks.map(b => (<SelectItem key={b.id} value={b.id}>{unwrapString(b.title) || b.title}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marks per question</Label>
                <Input type="number" min={1} value={manualMarks} onChange={e => setManualMarks(Number(e.target.value))} />
              </div>
              {bankQuestions.length > 0 && (
                <ScrollArea className="max-h-60 border border-border/50 rounded-lg">
                  <div className="divide-y divide-border/30">
                    {bankQuestions.map((q: any, i: number) => (
                      <label key={q.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/5 transition-colors ${selectedQuestions.includes(q.id) ? 'bg-primary/5' : ''}`}>
                        <input type="checkbox" checked={selectedQuestions.includes(q.id)} onChange={() => toggleQuestion(q.id)} className="rounded border-border" />
                        <span className="text-sm text-foreground flex-1">{unwrapString(q.question_text)}</span>
                        <Badge variant="outline" className="text-xs">{unwrapString(q.difficulty_level)}</Badge>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
              <Button onClick={addManualQuestions} disabled={addingQuestions || !selectedQuestions.length} className="w-full">
                {addingQuestions ? 'Adding...' : `Add ${selectedQuestions.length} Questions`}
              </Button>
            </TabsContent>

            <TabsContent value="random" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Question Bank</Label>
                <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                  <SelectTrigger><SelectValue placeholder="Select bank..." /></SelectTrigger>
                  <SelectContent>{questionBanks.map(b => (<SelectItem key={b.id} value={b.id}>{unwrapString(b.title) || b.title}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of questions</Label>
                  <Input type="number" min={1} value={randomCount} onChange={e => setRandomCount(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Marks each</Label>
                  <Input type="number" min={1} value={randomMarks} onChange={e => setRandomMarks(Number(e.target.value))} />
                </div>
              </div>
              <Button onClick={addRandomQuestions} disabled={addingQuestions || !selectedBankId} className="w-full">
                {addingQuestions ? 'Adding...' : `Add ${randomCount} Random Questions`}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteExamQId} onClose={() => setDeleteExamQId(null)} onConfirm={handleDeleteExamQuestion} loading={deletingEQ} title="Remove Question" description="Remove this question from the exam?" />

      {/* Marks Dialog */}
      <Dialog open={marksOpen} onOpenChange={setMarksOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Exam Marks</span>
              {marksData?.examId && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => downloadMarks(marksData.examId)}>
                  <Download className="w-3.5 h-3.5" /> Download Excel
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {marksLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading marks...</div>
          ) : marksData ? (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 pb-4">
                <div className="bg-muted/10 rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground">{marksData.exam_title || 'Exam'}</p>
                </div>
                {marksData.marks && marksData.marks.length > 0 ? (
                  <div className="border border-border/50 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/10 border-b border-border/50">
                          <th className="text-left p-3 font-medium text-muted-foreground">Student</th>
                          <th className="text-left p-3 font-medium text-muted-foreground">Code</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Score</th>
                          <th className="text-right p-3 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {marksData.marks.map((m: any, i: number) => (
                          <tr key={i} className="hover:bg-muted/5 transition-colors">
                            <td className="p-3 text-foreground">{m.student_name || m.first_name || '—'}</td>
                            <td className="p-3 text-muted-foreground">{m.student_code || '—'}</td>
                            <td className="p-3 text-right font-semibold text-foreground">{m.total_score ?? m.score ?? '—'}</td>
                            <td className="p-3 text-right">
                              <Badge variant={m.status === 'submitted' ? 'default' : 'secondary'}>{m.status || '—'}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-sm">No marks data available yet</div>
                )}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">No data</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Live Exam Supervision & Controls Modal */}
      <LiveExamControlsModal
        open={liveModalOpen}
        onOpenChange={setLiveModalOpen}
        exam={selectedLiveExam}
        onExamUpdated={fetchData}
      />
    </AnimatedPage>
  );
}
