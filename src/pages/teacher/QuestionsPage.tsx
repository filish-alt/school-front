import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api, unwrapString, unwrapInt } from '@/lib/api';
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
import { Switch } from '@/components/ui/switch';
import { Edit, Trash2, Upload, Download, HelpCircle, Star, Plus, CheckCircle2, XCircle, ChevronDown, ChevronUp, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const difficultyColors: Record<string, string> = {
  easy: 'bg-success/15 text-success',
  medium: 'bg-warning/15 text-warning',
  hard: 'bg-destructive/15 text-destructive',
};

interface InlineOption {
  text: string;
  is_correct: boolean;
}

export default function QuestionsPage() {
  const { bankId } = useParams<{ bankId: string }>();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<{ question_text: string; type: string; marks: number; difficulty_level: string; image_url?: string }>({ question_text: '', type: 'mcq', marks: 1, difficulty_level: 'easy', image_url: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [inlineOptions, setInlineOptions] = useState<InlineOption[]>([
    { text: '', is_correct: true },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
  ]);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Options state
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<string, any[]>>({});
  const [optionsLoading, setOptionsLoading] = useState<string | null>(null);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [optionForm, setOptionForm] = useState({ option_text: '', is_correct: false });
  const [editingOption, setEditingOption] = useState<any>(null);
  const [optionQuestionId, setOptionQuestionId] = useState('');
  const [savingOption, setSavingOption] = useState(false);
  const [deleteOptionTarget, setDeleteOptionTarget] = useState<string | null>(null);
  const [deletingOption, setDeletingOption] = useState(false);

  const fetchData = useCallback(async () => {
    if (!bankId) return;
    setLoading(true);
    try { setData(await api.getQuestions(bankId, page) || []); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }, [bankId, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchOptions = async (questionId: string) => {
    setOptionsLoading(questionId);
    try {
      const opts = await api.getOptions(questionId, 1, 50);
      setOptions(prev => ({ ...prev, [questionId]: opts || [] }));
    } catch (e: any) { toast.error(e.message); }
    setOptionsLoading(null);
  };

  const toggleExpand = (questionId: string) => {
    if (expandedQuestion === questionId) {
      setExpandedQuestion(null);
    } else {
      setExpandedQuestion(questionId);
      if (!options[questionId]) fetchOptions(questionId);
    }
  };

  const resetInlineOptions = (type: string) => {
    if (type === 'true_false') {
      setInlineOptions([
        { text: 'True', is_correct: true },
        { text: 'False', is_correct: false },
      ]);
    } else {
      setInlineOptions([
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
      ]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const validOptions = inlineOptions.filter(o => o.text.trim());
      if (validOptions.length < 2) {
        toast.error('Add at least 2 options');
        setSaving(false);
        return;
      }
      const correctCount = validOptions.filter(o => o.is_correct).length;
      if (correctCount !== 1) {
        toast.error('Exactly one option must be marked as correct');
        setSaving(false);
        return;
      }

      if (editing) {
        // Update question fields
        const updatePayload: any = {
          id: editing.id,
          question_text: form.question_text,
          type: form.type,
          marks: form.marks,
          difficulty_level: form.difficulty_level,
        };
        if (form.image_url) updatePayload.image_url = form.image_url;
        await api.updateQuestion(updatePayload);

        // Sync options: update existing in place by index, create new, delete extras
        const existing = options[editing.id] || [];
        const maxLen = Math.max(existing.length, validOptions.length);
        for (let i = 0; i < maxLen; i++) {
          const newOpt = validOptions[i];
          const oldOpt = existing[i];
          if (newOpt && oldOpt) {
            await api.updateOption({ id: oldOpt.id, option_text: newOpt.text, is_correct: newOpt.is_correct });
          } else if (newOpt && !oldOpt) {
            await api.createOption({ question_id: editing.id, option_text: newOpt.text, is_correct: newOpt.is_correct });
          } else if (!newOpt && oldOpt) {
            await api.deleteOption(oldOpt.id);
          }
        }
        // Refresh options cache for this question
        await fetchOptions(editing.id);
        toast.success('Question updated');
      } else {
        const payload: any = { question_bank_id: bankId!, ...form };
        if (!form.image_url) delete payload.image_url;
        const res = await api.createQuestion(payload);
        const questionId = res.id;
        for (const opt of validOptions) {
          await api.createOption({ question_id: questionId, option_text: opt.text, is_correct: opt.is_correct });
        }
        toast.success('Question created with options');
      }
      setDialogOpen(false);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await api.uploadQuestionImage(file);
      setForm(f => ({ ...f, image_url: res.url }));
      toast.success('Image uploaded');
    } catch (err: any) { toast.error(err.message); }
    setUploadingImage(false);
    e.target.value = '';
  };

  const openEditQuestion = async (item: any) => {
    setEditing(item);
    setForm({
      question_text: unwrapString(item.question_text),
      type: unwrapString(item.type) || 'mcq',
      marks: unwrapInt(item.marks),
      difficulty_level: unwrapString(item.difficulty_level) || 'easy',
      image_url: unwrapString(item.image_url) || '',
    });
    // Load options into inline editor
    let opts = options[item.id];
    if (!opts) {
      try {
        opts = await api.getOptions(item.id, 1, 50) || [];
        setOptions(prev => ({ ...prev, [item.id]: opts! }));
      } catch { opts = []; }
    }
    if (opts && opts.length > 0) {
      setInlineOptions(opts.map((o: any) => ({
        text: unwrapString(o.option_text) || o.option_text || '',
        is_correct: !!o.is_correct,
      })));
    } else {
      resetInlineOptions(unwrapString(item.type) || 'mcq');
    }
    setDialogOpen(true);
  };


  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await api.deleteQuestion(deleteTarget); toast.success('Deleted'); setDeleteTarget(null); fetchData(); }
    catch (e: any) { toast.error(e.message); }
    setDeleting(false);
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'question_text,option_a,option_b,option_c,option_d,correct_answer,marks\n' +
      'What is the powerhouse of the cell?,Nucleus,Mitochondria,Ribosome,Golgi apparatus,B,1\n' +
      'Which planet is known as the Red Planet?,Venus,Mars,Jupiter,Saturn,B,1\n' +
      'What is the chemical symbol for Gold?,Au,Ag,Fe,Pb,A,2\n' +
      'In computer science what does CPU stand for?,Central Processing Unit,Computer Personal Unit,Control Program Utility,Core Processor Unit,A,1\n' +
      'Solve for x: 2x + 6 = 14,2,3,4,5,C,2\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_questions_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample questions CSV template downloaded');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bankId) return;
    try { await api.importQuestions(bankId, file); toast.success('Imported'); fetchData(); }
    catch (err: any) { toast.error(err.message); }
    e.target.value = '';
  };

  const handleSaveOption = async () => {
    setSavingOption(true);
    try {
      if (editingOption) {
        // If marking this option as correct, first set all other options to false
        if (optionForm.is_correct) {
          const currentOptions = options[optionQuestionId] || [];
          for (const opt of currentOptions) {
            if (opt.id !== editingOption.id && opt.is_correct) {
              await api.updateOption({ id: opt.id, option_text: unwrapString(opt.option_text) || opt.option_text || '', is_correct: false });
            }
          }
        }
        await api.updateOption({ id: editingOption.id, option_text: optionForm.option_text, is_correct: optionForm.is_correct });
        toast.success('Option updated');
      } else {
        // If adding a correct option, unset others first
        if (optionForm.is_correct) {
          const currentOptions = options[optionQuestionId] || [];
          for (const opt of currentOptions) {
            if (opt.is_correct) {
              await api.updateOption({ id: opt.id, option_text: unwrapString(opt.option_text) || opt.option_text || '', is_correct: false });
            }
          }
        }
        await api.createOption({ question_id: optionQuestionId, option_text: optionForm.option_text, is_correct: optionForm.is_correct });
        toast.success('Option added');
      }
      setOptionDialogOpen(false);
      fetchOptions(optionQuestionId);
    } catch (e: any) { toast.error(e.message); }
    setSavingOption(false);
  };

  const handleDeleteOption = async () => {
    if (!deleteOptionTarget) return;
    setDeletingOption(true);
    try {
      await api.deleteOption(deleteOptionTarget);
      toast.success('Option deleted');
      setDeleteOptionTarget(null);
      if (expandedQuestion) fetchOptions(expandedQuestion);
    } catch (e: any) { toast.error(e.message); }
    setDeletingOption(false);
  };

  const openAddOption = (questionId: string) => {
    setOptionQuestionId(questionId);
    setEditingOption(null);
    setOptionForm({ option_text: '', is_correct: false });
    setOptionDialogOpen(true);
  };

  const openEditOption = (questionId: string, opt: any) => {
    setOptionQuestionId(questionId);
    setEditingOption(opt);
    setOptionForm({ option_text: unwrapString(opt.option_text) || opt.option_text || '', is_correct: opt.is_correct ?? false });
    setOptionDialogOpen(true);
  };

  const setCorrectOption = (index: number) => {
    setInlineOptions(prev => prev.map((o, i) => ({ ...o, is_correct: i === index })));
  };

  const updateInlineOptionText = (index: number, text: string) => {
    setInlineOptions(prev => prev.map((o, i) => i === index ? { ...o, text } : o));
  };

  const addInlineOption = () => {
    if (inlineOptions.length >= 6) return;
    setInlineOptions(prev => [...prev, { text: '', is_correct: false }]);
  };

  const removeInlineOption = (index: number) => {
    if (inlineOptions.length <= 2) return;
    setInlineOptions(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (!next.some(o => o.is_correct) && next.length > 0) next[0].is_correct = true;
      return next;
    });
  };

  const filtered = data.filter(item => {
    const matchSearch = !search || unwrapString(item.question_text)?.toLowerCase().includes(search.toLowerCase());
    const matchDiff = !diffFilter || unwrapString(item.difficulty_level) === diffFilter;
    return matchSearch && matchDiff;
  });

  const columns: Column<any>[] = [
    { key: 'question_text', label: 'Question' },
    { key: 'type', label: 'Type', render: (item) => <Badge variant="secondary">{unwrapString(item.type)}</Badge> },
    { key: 'marks', label: 'Marks', render: (item) => unwrapInt(item.marks) },
    { key: 'difficulty_level', label: 'Difficulty', render: (item) => <Badge variant="outline">{unwrapString(item.difficulty_level)}</Badge> },
  ];

  const renderOptionsPanel = (questionId: string) => {
    const opts = options[questionId] || [];
    const isLoading = optionsLoading === questionId;

    return (
      <AnimatePresence>
        {expandedQuestion === questionId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-border/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Options</p>
                <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={() => openAddOption(questionId)}>
                  <Plus className="w-3 h-3" /> Add Option
                </Button>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground text-sm">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Loading...
                </div>
              ) : opts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3 text-center">No options yet. Add some!</p>
              ) : (
                <div className="space-y-1.5">
                  {opts.map((opt: any, idx: number) => {
                    const text = unwrapString(opt.option_text) || opt.option_text || '';
                    const correct = opt.is_correct;
                    return (
                      <div key={opt.id || idx} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${correct ? 'bg-success/10 border border-success/30' : 'bg-muted/5 border border-border/30'}`}>
                        {correct ? <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" /> : <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                        <span className="flex-1 text-foreground">{String.fromCharCode(65 + idx)}. {text}</span>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditOption(questionId, opt)}><Edit className="w-3 h-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteOptionTarget(opt.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <AnimatedPage>
      <PageHeader title="Questions" description="Question Bank"
        onAdd={() => {
          setEditing(null);
          setForm({ question_text: '', type: 'mcq', marks: 1, difficulty_level: 'easy' });
          resetInlineOptions('mcq');
          setDialogOpen(true);
        }} addLabel="Add Question">
        <Button variant="outline" onClick={downloadSampleCsv} className="gap-2">
          <Download className="w-4 h-4 text-primary" />
          Template
        </Button>
        <label className="cursor-pointer">
          <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          <Button variant="outline" asChild><span className="gap-2 flex items-center"><Upload className="w-4 h-4" /> Import</span></Button>
        </label>
        <ViewToggle view={view} onChange={setView} />
      </PageHeader>
      <SearchFilter
        search={search} onSearchChange={setSearch} placeholder="Search questions..."
        filters={[{ label: 'Difficulty', value: diffFilter, onChange: setDiffFilter, options: [{ label: 'Easy', value: 'easy' }, { label: 'Medium', value: 'medium' }, { label: 'Hard', value: 'hard' }] }]}
      />

      {loading ? (
        view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{[1,2,3,4].map(i => <GridCardSkeleton key={i} />)}</div>
        ) : <TableSkeleton cols={4} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={HelpCircle} title="No questions" description="Add questions to this bank." />
      ) : view === 'grid' ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        >
          {filtered.map((item, i) => {
            const diff = unwrapString(item.difficulty_level);
            return (
              <motion.div
                key={item.id}
                variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
                className="glass-card rounded-xl p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-secondary">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium">{unwrapString(item.question_text)}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary">{unwrapString(item.type)?.toUpperCase()}</Badge>
                      <Badge className={difficultyColors[diff] || ''} variant="outline">{diff}</Badge>
                      <Badge variant="outline" className="gap-1"><Star className="w-3 h-3" /> {unwrapInt(item.marks)} marks</Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => toggleExpand(item.id)} title="Options">
                      {expandedQuestion === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditQuestion(item)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
                {renderOptionsPanel(item.id)}
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <DataTable columns={columns} data={filtered} isLoading={false} page={page} onPageChange={setPage}
          actions={(item) => (
            <div className="flex items-center gap-1 justify-end">
              <Button variant="ghost" size="icon" onClick={() => toggleExpand(item.id)} title="Options">
                {expandedQuestion === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEditQuestion(item)}><Edit className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          )}
        />
      )}

      {/* Question Dialog with inline options */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Question' : 'Add Question with Options'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Question Text</Label><Input value={form.question_text} onChange={e => setForm(f => ({ ...f, question_text: e.target.value }))} placeholder="Enter your question..." /></div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label>Image (optional)</Label>
              {form.image_url ? (
                <div className="relative inline-block">
                  <img src={form.image_url.startsWith('http') ? form.image_url : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}${form.image_url}`} alt="Question" className="max-h-32 rounded-lg border border-border/40" />
                  <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 bg-background border" onClick={() => setForm(f => ({ ...f, image_url: '' }))}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <div className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-accent/30 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                    {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                  </div>
                </label>
              )}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => { setForm(f => ({ ...f, type: v })); if (!editing) resetInlineOptions(v); }} disabled={!!editing}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">MCQ (Multiple Choice)</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Marks</Label><Input type="number" min={1} value={form.marks} onChange={e => setForm(f => ({ ...f, marks: Number(e.target.value) }))} /></div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={form.difficulty_level} onValueChange={v => setForm(f => ({ ...f, difficulty_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Inline Options (create + edit) */}
            <div className="space-y-3 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Answer Options</Label>
                {form.type === 'mcq' && inlineOptions.length < 6 && (
                  <Button type="button" variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={addInlineOption}>
                    <Plus className="w-3 h-3" /> Add Option
                  </Button>
                )}
              </div>
              {inlineOptions.map((opt, idx) => (
                <div key={idx} className={`flex items-center gap-2 rounded-lg p-2.5 border transition-colors ${opt.is_correct ? 'border-success/40 bg-success/5' : 'border-border/30 bg-muted/5'}`}>
                  <button
                    type="button"
                    onClick={() => setCorrectOption(idx)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${opt.is_correct ? 'bg-success text-success-foreground shadow-sm' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'}`}
                    title={opt.is_correct ? 'Correct answer' : 'Mark as correct'}
                  >
                    {opt.is_correct ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + idx)}
                  </button>
                  <Input
                    value={opt.text}
                    onChange={e => updateInlineOptionText(idx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}...`}
                    className="flex-1 h-8 text-sm"
                    disabled={form.type === 'true_false'}
                  />
                  {form.type === 'mcq' && inlineOptions.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => removeInlineOption(idx)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Click the circle to mark the correct answer</p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? 'Saving...' : editing ? 'Update Question' : 'Create Question'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit single option Dialog */}
      <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingOption ? 'Edit Option' : 'Add Option'}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2"><Label>Option Text</Label><Input value={optionForm.option_text} onChange={e => setOptionForm(f => ({ ...f, option_text: e.target.value }))} /></div>
            <div className="flex items-center gap-3">
              <Switch checked={optionForm.is_correct} onCheckedChange={v => setOptionForm(f => ({ ...f, is_correct: v }))} />
              <Label>Correct answer</Label>
            </div>
            <Button onClick={handleSaveOption} disabled={savingOption} className="w-full">{savingOption ? 'Saving...' : 'Save Option'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} />
      <ConfirmDialog open={!!deleteOptionTarget} onClose={() => setDeleteOptionTarget(null)} onConfirm={handleDeleteOption} loading={deletingOption} title="Delete Option" description="Delete this option?" />
    </AnimatedPage>
  );
}
