import { useState, useEffect } from 'react';
import { api, unwrapString, unwrapInt } from '@/lib/api';
import AnimatedPage from '@/components/shared/AnimatedPage';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Lock, Eye, FileQuestion, BookOpen, Clock, ShieldCheck, AlertCircle, Users, Send } from 'lucide-react';
import { getSubjectEmoji } from '@/lib/subjectIcon';

export default function FinalExamApprovalPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [tabFilter, setTabFilter] = useState<'all' | 'under_review' | 'approved' | 'draft'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, subList, secList] = await Promise.all([
        api.getExams(1, 100).catch(() => []),
        api.getSubjects(1, 100).catch(() => []),
        api.getSections(1, 100).catch(() => []),
      ]);
      setExams(list || []);
      setSubjects(subList || []);
      setSections(secList || []);
    } catch (e: any) {
      toast.error('Failed to load examinations');
    }
    setLoading(false);
  };

  const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
  const sectionMap = new Map(sections.map(s => [s.id, s.name]));

  const getExamSubject = (item: any) => subjectMap.get(unwrapString(item.subject_id) || item.subject_id) || '';
  const getExamSection = (item: any) => sectionMap.get(unwrapString(item.section_id) || item.section_id) || '';

  const getEffectiveStatus = (ex: any) => {
    const rawStatus = unwrapString(ex.status) || ex.status || 'draft';
    const appStatus = unwrapString(ex.approval_status) || ex.approval_status;
    if (appStatus === 'approved' || rawStatus === 'published' || rawStatus === 'approved') return 'approved';
    if (appStatus === 'rejected' || rawStatus === 'rejected') return 'rejected';
    if (appStatus === 'under_review' || rawStatus === 'under_review') return 'under_review';
    return 'draft';
  };

  const handleOpenReview = async (exam: any) => {
    setSelectedExam(exam);
    setReviewOpen(true);
    setExamQuestions([]);
    try {
      const res = await api.getExamQuestions(exam.id);
      const list = res?.questions || (Array.isArray(res) ? res : []);
      setExamQuestions(list);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to load exam questions');
    }
  };

  const handleApproveAndLock = async (examId: string) => {
    setProcessing(true);
    try {
      await api.updateExamControls(examId, {
        approval_status: 'approved',
        is_locked: true,
        status: 'published',
      });
      toast.success('Examination approved and published successfully for students');
      setReviewOpen(false);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to approve examination');
    }
    setProcessing(false);
  };

  const handleReject = async (examId: string) => {
    setProcessing(true);
    try {
      await api.updateExamControls(examId, {
        approval_status: 'rejected',
        is_locked: false,
        status: 'draft',
      });
      toast.warning('Examination returned to teacher for revisions');
      setReviewOpen(false);
      loadData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update examination');
    }
    setProcessing(false);
  };

  const filteredExams = exams.filter(ex => {
    const st = getEffectiveStatus(ex);
    if (tabFilter === 'under_review') return st === 'under_review';
    if (tabFilter === 'approved') return st === 'approved';
    if (tabFilter === 'draft') return st === 'draft' || st === 'rejected';
    return true;
  });

  const underReviewCount = exams.filter(ex => getEffectiveStatus(ex) === 'under_review').length;
  const approvedCount = exams.filter(ex => getEffectiveStatus(ex) === 'approved').length;

  return (
    <AnimatedPage>
      <PageHeader
        title="Final Exam Collaboration & Approval"
        description="Department Head and Director oversight: Review teacher-contributed final exam questions, marks balance, and enforce locked versioning"
      />

      {/* Tabs */}
      <div className="mb-4">
        <Tabs value={tabFilter} onValueChange={(v: any) => setTabFilter(v)} className="w-full sm:w-auto">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="all" className="text-xs">All Exams ({exams.length})</TabsTrigger>
            <TabsTrigger value="under_review" className="text-xs gap-1.5">
              Pending Review
              {underReviewCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1.5 text-[10px] bg-amber-600">
                  {underReviewCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs">Approved ({approvedCount})</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs">Drafts / Revisions</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Submitted Examinations Pool
          </CardTitle>
          <CardDescription>
            Teacher-submitted exams requiring departmental vetting before publication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading examinations...</div>
          ) : filteredExams.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No examinations matching the selected filter.
            </div>
          ) : (
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Exam Title</TableHead>
                    <TableHead>Subject & Section</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version Lock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((ex: any) => {
                    const st = getEffectiveStatus(ex);
                    const locked = ex.is_locked === 1;
                    const subName = getExamSubject(ex);
                    const secName = getExamSection(ex);
                    return (
                      <TableRow key={ex.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell className="font-semibold text-foreground">
                          {unwrapString(ex.title) || ex.title}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {subName && (
                              <Badge variant="outline" className="gap-1 text-[11px]">
                                <BookOpen className="w-3 h-3" /> {subName}
                              </Badge>
                            )}
                            {secName && (
                              <Badge variant="secondary" className="gap-1 text-[11px]">
                                <Users className="w-3 h-3" /> {secName}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {unwrapInt(ex.duration_minutes) || ex.duration_minutes} min
                        </TableCell>
                        <TableCell className="text-sm font-mono font-medium">
                          {unwrapInt(ex.total_marks) || ex.total_marks || 100} pts
                        </TableCell>
                        <TableCell>
                          {st === 'approved' ? (
                            <Badge className="bg-emerald-600 text-white gap-1 text-xs">
                              <CheckCircle className="w-3 h-3" /> Approved (Published)
                            </Badge>
                          ) : st === 'rejected' ? (
                            <Badge variant="destructive" className="gap-1 text-xs">
                              <XCircle className="w-3 h-3" /> Needs Revision
                            </Badge>
                          ) : st === 'under_review' ? (
                            <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 gap-1 text-xs font-medium">
                              <Clock className="w-3 h-3" /> Pending Review
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 text-xs">
                              <Clock className="w-3 h-3" /> Draft
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {locked ? (
                            <Badge variant="outline" className="gap-1 text-xs text-primary border-primary/40 font-mono">
                              <Lock className="w-3 h-3" /> Locked v{ex.version || 1}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-white bg-slate-800 dark:bg-slate-800 border-slate-700 font-medium">
                              Editable (Draft)
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            {st === 'under_review' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApproveAndLock(ex.id)}
                                  disabled={processing}
                                  className="gap-1 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReject(ex.id)}
                                  disabled={processing}
                                  className="gap-1 text-xs h-8 text-destructive border-destructive/30"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenReview(ex)}
                              className="gap-1 text-xs h-8"
                            >
                              <Eye className="w-3.5 h-3.5" /> Review Questions
                            </Button>
                          </div>
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

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedExam && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between pr-4">
                  <DialogTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Review Exam: {unwrapString(selectedExam.title) || selectedExam.title}
                  </DialogTitle>
                  <Badge variant="outline" className="font-mono">
                    Total: {unwrapInt(selectedExam.total_marks) || selectedExam.total_marks} Marks
                  </Badge>
                </div>
                <DialogDescription>
                  Review question pool, options, point distributions, and verify answer keys before approving.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3">
                <div className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                  <span>Exam Questions ({examQuestions.length})</span>
                  <span className="text-muted-foreground font-normal">Duration: {unwrapInt(selectedExam.duration_minutes) || selectedExam.duration_minutes} min</span>
                </div>

                {examQuestions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground border rounded-lg">
                    No questions attached to this exam yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {examQuestions.map((q: any, i: number) => {
                      const qText = unwrapString(q.question_text) || q.question_text || '';
                      const qType = unwrapString(q.type) || q.type || 'mcq';
                      const qDiff = unwrapString(q.difficulty_level) || q.difficulty_level || 'Medium';
                      const qMarks = unwrapInt(q.marks) || q.marks || 1;
                      const opts = q.options || [];

                      return (
                        <div key={q.id || i} className="p-4 rounded-xl border border-border/50 bg-card/60 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-semibold text-sm text-foreground">
                              {i + 1}. {qText}
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0 font-mono">
                              {qMarks} {qMarks === 1 ? 'pt' : 'pts'}
                            </Badge>
                          </div>

                          {/* Options List */}
                          {opts.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {opts.map((opt: any, optIdx: number) => {
                                const optText = unwrapString(opt.option_text) || opt.option_text || '';
                                const isCorrect = opt.is_correct === 1 || opt.is_correct === true || opt.is_correct?.Int64 === 1;
                                return (
                                  <div
                                    key={opt.id || optIdx}
                                    className={`flex items-center gap-2 p-2 rounded-lg text-xs border ${
                                      isCorrect
                                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 font-medium'
                                        : 'bg-muted/30 border-border/40 text-foreground'
                                    }`}
                                  >
                                    <span className="w-5 h-5 rounded-full bg-background border flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <span className="flex-1">{optText}</span>
                                    {isCorrect && (
                                      <Badge className="text-[10px] px-1 py-0 bg-emerald-600 text-white h-4">
                                        Correct
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                            <span className="capitalize">Type: {qType}</span>
                            <span>·</span>
                            <span className="capitalize">Difficulty: {qDiff}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleReject(selectedExam.id)}
                  disabled={processing}
                  className="gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Send for Revision
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleApproveAndLock(selectedExam.id)}
                  disabled={processing}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="w-4 h-4" /> Approve & Publish
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
