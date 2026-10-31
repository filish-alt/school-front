import { useState, useEffect } from 'react';
import { api, unwrapString } from '@/lib/api';
import AnimatedPage from '@/components/shared/AnimatedPage';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BookOpen, Plus, Save, Calculator, CheckCircle2, Award, FileText, Users, Sparkles, Layers } from 'lucide-react';

export default function CourseworkPage() {
  const [courseworks, setCourseworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);

  // Filter / selection for mark entry
  const [selectedCoursework, setSelectedCoursework] = useState<any>(null);
  const [studentsMarks, setStudentsMarks] = useState<any[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  // New assessment dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    subject_id: '',
    section_id: '',
    title: '',
    type: 'assignment',
    max_marks: 10,
    weight_percentage: 10,
    due_date: '',
  });

  // Calculate results dialog
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcSection, setCalcSection] = useState('');
  const [calcSubject, setCalcSubject] = useState('');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [subs, secs, cws] = await Promise.all([
        api.getTeacherSubjects().catch(() => []),
        api.getTeacherSections().catch(() => []),
        api.getMyCoursework().catch(() => []),
      ]);
      setSubjects(subs || []);
      setSections(secs || []);
      setCourseworks(cws || []);
      if (subs?.length && !form.subject_id) setForm((f) => ({ ...f, subject_id: subs[0].subject_id }));
      if (secs?.length && !form.section_id) setForm((f) => ({ ...f, section_id: secs[0].section_id }));
    } catch (e: any) {
      toast.error('Failed to load coursework data');
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.subject_id || !form.section_id) {
      toast.error('Please fill all required fields');
      return;
    }
    setCreating(true);
    try {
      await api.createCoursework({
        subject_id: form.subject_id,
        section_id: form.section_id,
        title: form.title,
        type: form.type,
        max_marks: Number(form.max_marks),
        weight_percentage: Number(form.weight_percentage),
        due_date: form.due_date || undefined,
      });
      toast.success('Assessment created successfully');
      setCreateOpen(false);
      setForm((f) => ({ ...f, title: '' }));
      const cws = await api.getMyCoursework();
      setCourseworks(cws || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create assessment');
    }
    setCreating(false);
  };

  const openMarkEntry = async (cw: any) => {
    setSelectedCoursework(cw);
    setLoadingMarks(true);
    try {
      // 1. Fetch students assigned to this section
      const allStudents = await api.getTeacherStudents(1, 200).catch(() => []);
      const sectionStudents = (allStudents || []).filter(
        (s: any) => unwrapString(s.section_name) === cw.section_name || s.section_id === cw.section_id
      );

      // 2. Fetch already recorded marks
      const existingMarks = await api.getCourseworkMarks(cw.id).catch(() => []);
      const marksMap = new Map<string, any>();
      (existingMarks || []).forEach((m: any) => marksMap.set(m.student_id, m));

      const merged = sectionStudents.map((s: any) => {
        const recorded = marksMap.get(s.id);
        return {
          student_id: s.id,
          student_code: unwrapString(s.student_code) || s.student_code,
          student_name: `${unwrapString(s.first_name)} ${unwrapString(s.last_name)}`,
          marks_obtained: recorded ? recorded.marks_obtained : 0,
          remarks: recorded ? recorded.remarks || '' : '',
        };
      });

      setStudentsMarks(merged);
    } catch (e: any) {
      toast.error('Failed to load student roster for grading');
    }
    setLoadingMarks(false);
  };

  const handleMarkChange = (index: number, val: number) => {
    const updated = [...studentsMarks];
    const max = selectedCoursework ? selectedCoursework.max_marks : 100;
    updated[index].marks_obtained = Math.min(Math.max(0, val), max);
    setStudentsMarks(updated);
  };

  const handleRemarksChange = (index: number, text: string) => {
    const updated = [...studentsMarks];
    updated[index].remarks = text;
    setStudentsMarks(updated);
  };

  const handleSaveAllMarks = async () => {
    if (!selectedCoursework) return;
    setSavingMarks(true);
    try {
      for (const sm of studentsMarks) {
        await api.saveCourseworkMark({
          coursework_id: selectedCoursework.id,
          student_id: sm.student_id,
          marks_obtained: Number(sm.marks_obtained),
          remarks: sm.remarks || undefined,
        });
      }
      toast.success('All coursework marks saved successfully');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save marks');
    }
    setSavingMarks(false);
  };

  const handleCalculateCA = async () => {
    if (!calcSection || !calcSubject) {
      toast.error('Please select both Section and Subject');
      return;
    }
    setCalculating(true);
    try {
      await api.calculateResults({
        section_id: calcSection,
        subject_id: calcSubject,
      });
      toast.success('Continuous Assessment (CA) and final results aggregated successfully');
      setCalcOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to calculate results');
    }
    setCalculating(false);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Badge variant="secondary" className="bg-blue-500/15 text-blue-600 dark:text-blue-400">Quiz (10%)</Badge>;
      case 'mid_exam':
        return <Badge variant="secondary" className="bg-purple-500/15 text-purple-600 dark:text-purple-400">Mid Exam (15%)</Badge>;
      case 'assignment':
        return <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 dark:text-amber-400">Assignment (10%)</Badge>;
      case 'project':
        return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Project (5%)</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Continuous Assessment (CA) & Mark Management"
          description="Manage quizzes, mid-term tests, assignments, and project grading (Quiz 10% + Mid 15% + Assignment 10% + Project 5% = CA 40%)"
        />

        <div className="flex items-center gap-2">
          <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Aggregate CA & Total
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Aggregate Continuous Assessment (CA)
                </DialogTitle>
                <DialogDescription>
                  Compute the aggregated CA score (40%) and combine with final examinations (60%) into the official results sheet.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-3">
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={calcSection} onValueChange={setCalcSection}>
                    <SelectTrigger><SelectValue placeholder="Select section..." /></SelectTrigger>
                    <SelectContent>
                      {sections.map((s: any) => (
                        <SelectItem key={s.section_id} value={s.section_id}>{s.section_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={calcSubject} onValueChange={setCalcSubject}>
                    <SelectTrigger><SelectValue placeholder="Select subject..." /></SelectTrigger>
                    <SelectContent>
                      {subjects.map((s: any) => (
                        <SelectItem key={s.subject_id} value={s.subject_id}>{s.subject_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCalcOpen(false)}>Cancel</Button>
                <Button onClick={handleCalculateCA} disabled={calculating}>
                  {calculating ? 'Calculating...' : 'Run Aggregation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Assessment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Create Coursework Assessment
                  </DialogTitle>
                  <DialogDescription>
                    Add a quiz, mid exam, assignment, or practical project component for your class.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-3">
                  <div className="space-y-2">
                    <Label>Title / Description</Label>
                    <Input
                      placeholder="e.g. Quiz 1: Kinematics or Group Assignment 2"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Select value={form.subject_id} onValueChange={(val) => setForm({ ...form, subject_id: val })}>
                        <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                        <SelectContent>
                          {subjects.map((s: any) => (
                            <SelectItem key={s.subject_id} value={s.subject_id}>{s.subject_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Section</Label>
                      <Select value={form.section_id} onValueChange={(val) => setForm({ ...form, section_id: val })}>
                        <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                        <SelectContent>
                          {sections.map((s: any) => (
                            <SelectItem key={s.section_id} value={s.section_id}>{s.section_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={form.type} onValueChange={(val) => {
                        let w = 10;
                        if (val === 'quiz') w = 10;
                        if (val === 'mid_exam') w = 15;
                        if (val === 'assignment') w = 10;
                        if (val === 'project') w = 5;
                        setForm({ ...form, type: val, weight_percentage: w });
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="mid_exam">Mid Exam</SelectItem>
                          <SelectItem value="assignment">Assignment</SelectItem>
                          <SelectItem value="project">Project Work</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Raw Marks</Label>
                      <Input
                        type="number"
                        min="1"
                        value={form.max_marks}
                        onChange={(e) => setForm({ ...form, max_marks: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Weight (%)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={form.weight_percentage}
                        onChange={(e) => setForm({ ...form, weight_percentage: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Due Date (Optional)</Label>
                    <Input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating}>{creating ? 'Creating...' : 'Create Assessment'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assessment List */}
        <Card className="glass-card border-border/60 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center justify-between">
              Assessments ({courseworks.length})
              <Layers className="w-4 h-4 text-primary" />
            </CardTitle>
            <CardDescription>Select an assessment to open the mark-entry sheet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading assessments...</div>
            ) : courseworks.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No assessments created yet. Click "New Assessment" above.
              </div>
            ) : (
              courseworks.map((cw: any) => {
                const isSelected = selectedCoursework?.id === cw.id;
                return (
                  <div
                    key={cw.id}
                    onClick={() => openMarkEntry(cw)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/40 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-semibold text-sm text-foreground line-clamp-1">{cw.title}</div>
                      {getTypeBadge(cw.type)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between mt-2">
                      <span>{cw.subject_name} · {cw.section_name}</span>
                      <span className="font-mono font-medium">Max: {cw.max_marks} pts ({cw.weight_percentage}%)</span>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right Column: Student Mark-Entry Matrix */}
        <Card className="glass-card border-border/60 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  {selectedCoursework ? `Mark-Entry Matrix: ${selectedCoursework.title}` : 'Mark-Entry Sheet'}
                </CardTitle>
                <CardDescription>
                  {selectedCoursework
                    ? `${selectedCoursework.section_name} · Max Marks: ${selectedCoursework.max_marks} · Weight: ${selectedCoursework.weight_percentage}%`
                    : 'Select an assessment from the left panel to grade students'}
                </CardDescription>
              </div>

              {selectedCoursework && (
                <Button onClick={handleSaveAllMarks} disabled={savingMarks} className="gap-2 shrink-0">
                  <Save className="w-4 h-4" />
                  {savingMarks ? 'Saving...' : 'Save Marks'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedCoursework ? (
              <div className="py-20 text-center text-muted-foreground text-sm">
                👈 Please select an assessment on the left to enter marks for your students.
              </div>
            ) : loadingMarks ? (
              <div className="py-20 text-center text-muted-foreground text-sm">Loading student list...</div>
            ) : studentsMarks.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground text-sm">
                No students enrolled in section {selectedCoursework.section_name}.
              </div>
            ) : (
              <div className="rounded-lg border border-border/40 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student Code</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead className="w-32">Score / {selectedCoursework.max_marks}</TableHead>
                      <TableHead className="w-28 text-center">Weighted ({selectedCoursework.weight_percentage}%)</TableHead>
                      <TableHead>Feedback / Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentsMarks.map((sm: any, idx: number) => {
                      const weighted = ((Number(sm.marks_obtained || 0) * selectedCoursework.weight_percentage) / selectedCoursework.max_marks).toFixed(2);
                      return (
                        <TableRow key={sm.student_id}>
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold">{sm.student_code}</TableCell>
                          <TableCell className="font-medium text-sm text-foreground">{sm.student_name}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={selectedCoursework.max_marks}
                              step="0.5"
                              value={sm.marks_obtained}
                              onChange={(e) => handleMarkChange(idx, Number(e.target.value))}
                              className="font-bold text-center h-8"
                            />
                          </TableCell>
                          <TableCell className="text-center font-mono font-semibold text-xs text-primary">
                            {weighted}%
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder="Remarks..."
                              value={sm.remarks}
                              onChange={(e) => handleRemarksChange(idx, e.target.value)}
                              className="text-xs h-8"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AnimatedPage>
  );
}
