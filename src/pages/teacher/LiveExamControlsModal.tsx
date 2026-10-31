import { useState, useEffect } from 'react';
import { api, unwrapString, unwrapInt } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Play, Eye, Lock, Clock, KeyRound, Globe, AlertTriangle, CheckCircle2,
  Printer, FileText, ShieldAlert, Sparkles, UserPlus, RefreshCw, XCircle
} from 'lucide-react';

interface LiveExamControlsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exam: any;
  onExamUpdated: () => void;
}

export default function LiveExamControlsModal({
  open,
  onOpenChange,
  exam,
  onExamUpdated,
}: LiveExamControlsModalProps) {
  if (!exam) return null;

  const [isStarted, setIsStarted] = useState(exam.is_started === 1);
  const [isVisible, setIsVisible] = useState(exam.is_visible === 1);
  const [isLocked, setIsLocked] = useState(exam.is_locked === 1);
  const [accessCode, setAccessCode] = useState(exam.access_code || '');
  const [savingControls, setSavingControls] = useState(false);

  // Time Extension state
  const [extensionMinutes, setExtensionMinutes] = useState(10);
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionStudentId, setExtensionStudentId] = useState('');
  const [extensionsList, setExtensionsList] = useState<any[]>([]);
  const [extending, setExtending] = useState(false);

  // Remote Access state
  const [remoteStudentId, setRemoteStudentId] = useState('');
  const [remoteValidUntil, setRemoteValidUntil] = useState('');
  const [remoteReason, setRemoteReason] = useState('');
  const [remoteList, setRemoteList] = useState<any[]>([]);
  const [authorizing, setAuthorizing] = useState(false);

  // Dropped Question state
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [dropQuestionId, setDropQuestionId] = useState('');
  const [dropReason, setDropReason] = useState('');
  const [dropCreditType, setDropCreditType] = useState('full_credit');
  const [dropping, setDropping] = useState(false);

  // Answer Key Correction state
  const [correctQuestionId, setCorrectQuestionId] = useState('');
  const [questionOptions, setQuestionOptions] = useState<any[]>([]);
  const [newCorrectOptionId, setNewCorrectOptionId] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correcting, setCorrecting] = useState(false);

  // Students in section for extension/remote selection
  const [students, setStudents] = useState<any[]>([]);

  useEffect(() => {
    if (open && exam?.id) {
      setIsStarted(exam.is_started === 1);
      setIsVisible(exam.is_visible === 1);
      setIsLocked(exam.is_locked === 1);
      setAccessCode(exam.access_code || '');
      loadLiveDetails();
    }
  }, [open, exam]);

  const loadLiveDetails = async () => {
    try {
      const [exts, rems, questionsRes, allStudents] = await Promise.all([
        api.getExamExtensions(exam.id).catch(() => []),
        api.getRemoteAuthorizations(exam.id).catch(() => []),
        api.getExamQuestions(exam.id).catch(() => []),
        api.getTeacherStudents(1, 200).catch(() => []),
      ]);
      setExtensionsList(Array.isArray(exts) ? exts : (exts?.data || []));
      setRemoteList(Array.isArray(rems) ? rems : (rems?.data || []));

      const qList = Array.isArray(questionsRes)
        ? questionsRes
        : (questionsRes?.questions || questionsRes?.Questions || questionsRes?.data || []);
      setExamQuestions(qList);

      const studentList = Array.isArray(allStudents)
        ? allStudents
        : (allStudents?.students || allStudents?.data || []);
      const sectionStudents = studentList.filter(
        (s: any) => unwrapString(s.section_name) === unwrapString(exam.section_name) || s.section_id === exam.section_id
      );
      setStudents(sectionStudents);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveLiveControls = async () => {
    setSavingControls(true);
    try {
      await api.updateExamControls(exam.id, {
        is_started: isStarted,
        is_visible: isVisible,
        is_locked: isLocked,
        access_code: accessCode || undefined,
        status: isStarted ? 'in_progress' : isVisible ? 'scheduled' : 'draft',
      });
      toast.success('Live exam supervision controls updated');
      onExamUpdated();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update live controls');
    }
    setSavingControls(false);
  };

  const handleAddExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionReason) {
      toast.error('Please specify the reason for the time extension');
      return;
    }
    setExtending(true);
    try {
      await api.addExamExtension({
        exam_id: exam.id,
        student_id: extensionStudentId && extensionStudentId !== 'all' ? extensionStudentId : undefined,
        extended_minutes: Number(extensionMinutes),
        reason: extensionReason,
      });
      toast.success(`Extended by ${extensionMinutes} minutes successfully`);
      setExtensionReason('');
      setExtensionStudentId('all');
      const exts = await api.getExamExtensions(exam.id);
      setExtensionsList(Array.isArray(exts) ? exts : (exts?.data || []));
    } catch (e: any) {
      toast.error(e.message || 'Failed to add extension');
    }
    setExtending(false);
  };

  const handleAddRemoteAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteStudentId || !remoteValidUntil || !remoteReason) {
      toast.error('Please fill all remote authorization fields');
      return;
    }
    setAuthorizing(true);
    try {
      await api.addRemoteAuthorization({
        exam_id: exam.id,
        student_id: remoteStudentId,
        valid_until: remoteValidUntil,
        reason: remoteReason,
      });
      toast.success('Remote examination authorization granted');
      setRemoteStudentId('');
      setRemoteReason('');
      setRemoteValidUntil('');
      const rems = await api.getRemoteAuthorizations(exam.id);
      setRemoteList(Array.isArray(rems) ? rems : (rems?.data || []));
    } catch (e: any) {
      toast.error(e.message || 'Failed to grant remote access');
    }
    setAuthorizing(false);
  };

  const handleDropQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dropQuestionId || !dropReason) {
      toast.error('Please select question and provide reason');
      return;
    }
    if (!confirm('Dropping a question will automatically recalculate student scores across all submitted sessions. Proceed?')) return;
    setDropping(true);
    try {
      await api.dropExamQuestion({
        exam_id: exam.id,
        question_id: dropQuestionId,
        reason: dropReason,
        credit_type: dropCreditType,
      });
      toast.success('Question dropped and student results recalculated');
      setDropQuestionId('');
      setDropReason('');
      loadLiveDetails();
    } catch (e: any) {
      toast.error(e.message || 'Failed to drop question');
    }
    setDropping(false);
  };

  const handleSelectCorrectionQuestion = async (qId: string) => {
    setCorrectQuestionId(qId);
    try {
      const opts = await api.getOptions(qId, 1, 50);
      const optList = Array.isArray(opts) ? opts : (opts?.options || opts?.data || []);
      setQuestionOptions(optList);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCorrectAnswerKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctQuestionId || !newCorrectOptionId || !correctionReason) {
      toast.error('Please select question, correct option and specify reason');
      return;
    }
    if (!confirm('Amending the answer key will re-score all student answers and recalculate total marks. Proceed?')) return;
    setCorrecting(true);
    try {
      await api.correctAnswerKey({
        exam_id: exam.id,
        question_id: correctQuestionId,
        new_answer: newCorrectOptionId,
        reason: correctionReason,
      });
      toast.success('Answer key amended and marks recalculated');
      setCorrectQuestionId('');
      setNewCorrectOptionId('');
      setCorrectionReason('');
      loadLiveDetails();
    } catch (e: any) {
      toast.error(e.message || 'Failed to amend answer key');
    }
    setCorrecting(false);
  };

  const generateAccessCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setAccessCode(code);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Live Exam Supervision: {unwrapString(exam.title)}
            </DialogTitle>
            <Badge variant={isStarted ? 'default' : isVisible ? 'secondary' : 'outline'} className="capitalize">
              {isStarted ? '🟢 In Progress' : isVisible ? '👁️ Visible' : '🔒 Hidden'}
            </Badge>
          </div>
          <DialogDescription>
            {unwrapString(exam.subject_name)} · {unwrapString(exam.section_name)} · {unwrapInt(exam.duration_minutes)} min duration
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="controls" className="mt-4">
          <TabsList className="grid grid-cols-5 w-full bg-muted/60 p-1">
            <TabsTrigger value="controls" className="text-xs flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5" />
              Live State
            </TabsTrigger>
            <TabsTrigger value="extensions" className="text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Extensions
            </TabsTrigger>
            <TabsTrigger value="remote" className="text-xs flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              Remote Access
            </TabsTrigger>
            <TabsTrigger value="rescore" className="text-xs flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Key Fix / Drop
            </TabsTrigger>
            <TabsTrigger value="paper" className="text-xs flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Paper Fallback
            </TabsTrigger>
          </TabsList>

          {/* 1. Live State & Access Code Controls */}
          <TabsContent value="controls" className="space-y-5 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border/40 space-y-4 bg-muted/15">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-foreground">Teacher Live Exam Start Switch</div>
                    <p className="text-xs text-muted-foreground">Students cannot open questions until live start is enabled</p>
                  </div>
                  <Switch checked={isStarted} onCheckedChange={setIsStarted} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-foreground">Student Visibility</div>
                    <p className="text-xs text-muted-foreground">Toggle whether students see this exam in their portal</p>
                  </div>
                  <Switch checked={isVisible} onCheckedChange={setIsVisible} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-foreground">Lock Approved Version</div>
                    <p className="text-xs text-muted-foreground">Prevents question edits during active sessions</p>
                  </div>
                  <Switch checked={isLocked} onCheckedChange={setIsLocked} />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border/40 space-y-4 bg-muted/15">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">Exam Access Password / Pin</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={generateAccessCode} className="h-6 text-xs text-primary gap-1">
                      <Sparkles className="w-3 h-3" />
                      Generate Pin
                    </Button>
                  </div>
                  <Input
                    placeholder="e.g. 7X9K2P (Leave blank for no password)"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="font-mono text-center font-bold tracking-widest text-lg"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Students must enter this access code on their device to begin the exam.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={handleSaveLiveControls} disabled={savingControls}>
                {savingControls ? 'Applying Changes...' : 'Save Live Supervision Settings'}
              </Button>
            </div>
          </TabsContent>

          {/* 2. Exam Time Extensions */}
          <TabsContent value="extensions" className="space-y-4 py-3">
            <form onSubmit={handleAddExtension} className="p-4 rounded-xl border border-border/40 bg-muted/15 space-y-3">
              <div className="font-semibold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Grant Time Extension
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Student (Optional)</Label>
                  <Select value={extensionStudentId || 'all'} onValueChange={setExtensionStudentId}>
                    <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Entire Section (All Students)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Entire Section (All Students)</SelectItem>
                      {students.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {unwrapString(s.student_code)} - {unwrapString(s.first_name)} {unwrapString(s.last_name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Extra Duration</Label>
                  <Select value={String(extensionMinutes)} onValueChange={(v) => setExtensionMinutes(Number(v))}>
                    <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">+5 Minutes</SelectItem>
                      <SelectItem value="10">+10 Minutes</SelectItem>
                      <SelectItem value="15">+15 Minutes</SelectItem>
                      <SelectItem value="20">+20 Minutes</SelectItem>
                      <SelectItem value="30">+30 Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Authorized Reason</Label>
                  <Input
                    placeholder="e.g. Network disruption in Lab B"
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    className="text-xs h-9"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={extending}>
                  {extending ? 'Granting...' : 'Grant Extension'}
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Extension Audit Log</div>
              {extensionsList.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">No extensions granted for this session.</div>
              ) : (
                <div className="space-y-2">
                  {extensionsList.map((ext: any) => (
                    <div key={ext.id} className="p-3 rounded-lg border border-border/40 text-xs flex items-center justify-between bg-muted/10">
                      <div>
                        <span className="font-semibold text-foreground">
                          {unwrapString(ext.student_name) ? `Student: ${unwrapString(ext.student_name)}` : 'Entire Section'}
                        </span>
                        <span className="text-muted-foreground ml-2">({unwrapString(ext.reason)})</span>
                      </div>
                      <Badge variant="outline" className="font-mono">+{unwrapInt(ext.extended_minutes)} min</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 3. Exceptional Remote Access */}
          <TabsContent value="remote" className="space-y-4 py-3">
            <form onSubmit={handleAddRemoteAuth} className="p-4 rounded-xl border border-border/40 bg-muted/15 space-y-3">
              <div className="font-semibold text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                Authorize Exceptional Remote Student Access
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Student</Label>
                  <Select value={remoteStudentId} onValueChange={setRemoteStudentId}>
                    <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select student..." /></SelectTrigger>
                    <SelectContent>
                      {students.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {unwrapString(s.student_code)} - {unwrapString(s.first_name)} {unwrapString(s.last_name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Valid Until (Timestamp)</Label>
                  <Input
                    type="datetime-local"
                    value={remoteValidUntil}
                    onChange={(e) => setRemoteValidUntil(e.target.value)}
                    className="text-xs h-9"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs">Authorization Justification</Label>
                  <Input
                    placeholder="e.g. Approved medical leave with proctor"
                    value={remoteReason}
                    onChange={(e) => setRemoteReason(e.target.value)}
                    className="text-xs h-9"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={authorizing}>
                  {authorizing ? 'Authorizing...' : 'Authorize Remote Access'}
                </Button>
              </div>
            </form>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase">Authorized Remote Students</div>
              {remoteList.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">No individual remote authorizations active.</div>
              ) : (
                <div className="space-y-2">
                  {remoteList.map((r: any) => (
                    <div key={r.id} className="p-3 rounded-lg border border-border/40 text-xs flex items-center justify-between bg-muted/10">
                      <div>
                        <span className="font-semibold text-foreground">{unwrapString(r.student_name)} ({unwrapString(r.student_code)})</span>
                        <span className="text-muted-foreground ml-2">Reason: {unwrapString(r.reason)}</span>
                      </div>
                      <Badge className="bg-emerald-600 text-white font-mono text-[10px]">Valid Until: {unwrapString(r.valid_until)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 4. Answer Key Corrections & Dropped Questions */}
          <TabsContent value="rescore" className="space-y-6 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drop Flawed Question */}
              <form onSubmit={handleDropQuestion} className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 space-y-3">
                <div className="font-semibold text-sm flex items-center gap-2 text-destructive">
                  <XCircle className="w-4 h-4" />
                  Drop Question & Recalculate
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Select Question to Drop</Label>
                  <Select value={dropQuestionId} onValueChange={setDropQuestionId}>
                    <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select flawed question..." /></SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(examQuestions) ? examQuestions : []).map((q: any, i: number) => (
                        <SelectItem key={q.question_id || q.id} value={q.question_id || q.id}>
                          {i + 1}. {unwrapString(q.question_text) || `Question #${i + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Credit Rule</Label>
                  <Select value={dropCreditType} onValueChange={setDropCreditType}>
                    <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_credit">Award Full Question Marks to All Students</SelectItem>
                      <SelectItem value="reduce_total">Reduce Total Exam Points</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Justification</Label>
                  <Input
                    placeholder="e.g. Ambiguous wording or typo in question stem"
                    value={dropReason}
                    onChange={(e) => setDropReason(e.target.value)}
                    className="text-xs h-9"
                    required
                  />
                </div>

                <Button type="submit" variant="destructive" size="sm" disabled={dropping} className="w-full">
                  {dropping ? 'Dropping & Recalculating...' : 'Drop Question & Re-Score'}
                </Button>
              </form>

              {/* Correct Answer Key */}
              <form onSubmit={handleCorrectAnswerKey} className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                <div className="font-semibold text-sm flex items-center gap-2 text-primary">
                  <RefreshCw className="w-4 h-4" />
                  Amend Answer Key & Recalculate
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Question</Label>
                  <Select value={correctQuestionId} onValueChange={handleSelectCorrectionQuestion}>
                    <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select question to fix..." /></SelectTrigger>
                    <SelectContent>
                      {(Array.isArray(examQuestions) ? examQuestions : []).map((q: any, i: number) => (
                        <SelectItem key={q.question_id || q.id} value={q.question_id || q.id}>
                          {i + 1}. {unwrapString(q.question_text) || `Question #${i + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {correctQuestionId && (
                  <div className="space-y-2">
                    <Label className="text-xs">Select Correct Option</Label>
                    <Select value={newCorrectOptionId} onValueChange={setNewCorrectOptionId}>
                      <SelectTrigger className="text-xs h-9"><SelectValue placeholder="Select new correct answer..." /></SelectTrigger>
                      <SelectContent>
                        {(Array.isArray(questionOptions) ? questionOptions : []).map((opt: any) => (
                          <SelectItem key={opt.id} value={opt.id}>{unwrapString(opt.option_text)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs">Correction Reason</Label>
                  <Input
                    placeholder="e.g. Option B was verified as correct by Dept Head"
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    className="text-xs h-9"
                    required
                  />
                </div>

                <Button type="submit" size="sm" disabled={correcting} className="w-full">
                  {correcting ? 'Amending & Recalculating...' : 'Amend Key & Re-Score'}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* 5. Paper Fallback & Emergency Package */}
          <TabsContent value="paper" className="space-y-4 py-3">
            <div className="p-5 rounded-xl border border-border/50 bg-muted/15 space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Printer className="w-4 h-4 text-primary" />
                  Print Current Exam & Emergency Fallback Package
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  In the event of network, computer, or power failure, launch the printable fallback package containing the standardized examination paper, student attendance signature sheet, and invigilator mark-entry sheets.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="default"
                  asChild
                  className="gap-2"
                >
                  <a
                    href={`/api/v1/system/emergency-exam/${exam.id}/print`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Printer className="w-4 h-4" />
                    Open Printable Exam Package
                  </a>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
