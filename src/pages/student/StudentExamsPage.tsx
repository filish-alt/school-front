import { useState, useEffect, useCallback, useRef } from 'react';
import { api, unwrapString, unwrapInt, unwrapTime } from '@/lib/api';
import AnimatedPage from '@/components/shared/AnimatedPage';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { GridCardSkeleton } from '@/components/shared/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClipboardList, Clock, Play, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, Send, XCircle, Trophy, BookOpen, Users, History, Award, Timer, Sparkles, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function StudentExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Exam session state
  const [activeSession, setActiveSession] = useState<any>(null);
  const [sessionQuestions, setSessionQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Results
  const [resultOpen, setResultOpen] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Tab: available vs history
  const [tab, setTab] = useState<'available' | 'history'>('available');

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const [examsData, sessionsData] = await Promise.all([
        api.getStudentExams().catch(() => []),
        api.getStudentSessions().catch(() => []),
      ]);
      setExams(examsData || []);
      setSessions(sessionsData || []);
    } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  // Timer
  useEffect(() => {
    if (!sessionStarted || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionStarted]);

  const handleAutoSubmit = () => {
    if (activeSession) {
      submitExam();
    }
  };

  // Check if exam already has a submitted session
  const getExamSession = (examId: string) => {
    return (sessions || []).find((s: any) => {
      const sid = typeof s.exam_id === 'object' ? unwrapString(s.exam_id) : s.exam_id;
      return sid === examId;
    });
  };

  const startExam = async (examId: string, durationMinutes: number) => {
    try {
      const res = await api.startSession(examId);
      // Fetch exam detail with questions
      const examDetail = await api.getStudentExam(examId);
      const questions = examDetail.questions || [];

      setActiveSession({ id: res.id, examId });
      setSessionQuestions(questions);
      setCurrentIndex(0);
      setAnswers({});
      setTimeLeft(durationMinutes * 60);
      setSessionStarted(true);
      toast.success('🎯 Exam started! You got this!');
    } catch (e: any) { toast.error(e.message); }
  };

  const selectAnswer = async (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    if (activeSession) {
      try {
        await api.submitAnswer({ session_id: activeSession.id, question_id: questionId, selected_option_id: optionId });
      } catch (e: any) { toast.error(e.message); }
    }
  };

  const submitExam = async () => {
    if (!activeSession) return;
    setSubmitting(true);
    try {
      await api.submitSession(activeSession.id);
      // Fetch session result
      const sessionResult = await api.getSession(activeSession.id);
      
      setResult({
        total_score: unwrapInt(sessionResult.total_score),
        status: unwrapString(sessionResult.status),
        total_questions: sessionQuestions.length,
        answered: Object.keys(answers).length,
      });
      setSessionStarted(false);
      setActiveSession(null);
      if (timerRef.current) clearInterval(timerRef.current);
      setResultOpen(true);
      fetchExams(); // Refresh sessions
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  const viewSessionResult = async (sessionId: string) => {
    try {
      const sessionResult = await api.getSession(sessionId);
      setResult({
        total_score: typeof sessionResult.total_score === 'object' ? unwrapInt(sessionResult.total_score) : (sessionResult.total_score ?? 0),
        status: typeof sessionResult.status === 'object' ? unwrapString(sessionResult.status) : sessionResult.status,
        total_questions: 0,
        answered: 0,
      });
      setResultOpen(true);
    } catch (e: any) { toast.error(e.message); }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQ = sessionQuestions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = sessionQuestions.length;
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Active exam-taking UI
  if (sessionStarted && activeSession) {
    const isWarning = timeLeft < 120;
    const isCritical = timeLeft < 30;
    return (
      <div className="min-h-screen bg-background">
        {/* Immersive top bar */}
        <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/50 px-3 sm:px-4 py-3 shadow-sm">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <Badge variant="outline" className="text-xs sm:text-sm font-mono px-2 sm:px-3 truncate">
                  {currentIndex + 1} / {totalQuestions}
                </Badge>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Progress value={progressPct} className="w-24 sm:w-32 h-2.5" />
                <span className="text-xs text-muted-foreground font-medium">{answeredCount}/{totalQuestions}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <motion.div 
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-mono font-bold transition-colors ${
                  isCritical ? 'bg-destructive text-destructive-foreground animate-pulse' :
                  isWarning ? 'bg-warning/15 text-warning' : 'bg-muted/10 text-foreground'
                }`}
                animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.5 }}
              >
                <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {formatTime(timeLeft)}
              </motion.div>
              <Button variant="destructive" size="sm" className="gap-1 sm:gap-1.5 shadow-sm text-xs sm:text-sm px-2.5 sm:px-3" onClick={() => submitExam()} disabled={submitting || answeredCount < totalQuestions} title={answeredCount < totalQuestions ? `Answer all ${totalQuestions} questions first (${totalQuestions - answeredCount} left)` : 'Submit exam'}>
                <Send className="w-3.5 h-3.5" /> <span>{submitting ? '...' : answeredCount < totalQuestions ? `${totalQuestions - answeredCount} left` : 'Submit'}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto p-3.5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Question navigator - responsive sidebar */}
            <div className="col-span-1 lg:col-span-3 order-2 lg:order-1">
              <div className="glass-card rounded-2xl p-4 sm:p-5 sticky top-20">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Navigator</p>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2">
                  {sessionQuestions.map((q: any, i: number) => {
                    const qId = q.question_id || q.id;
                    const isAnswered = !!answers[qId];
                    const isCurrent = i === currentIndex;
                    return (
                      <motion.button
                        key={qId || i}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentIndex(i)}
                        className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 shadow-sm'
                            : isAnswered
                              ? 'bg-success/20 text-success border border-success/30'
                              : 'bg-muted/10 text-muted-foreground border border-border/30 hover:bg-muted/20'
                        }`}
                      >
                        {i + 1}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="mt-5 pt-4 border-t border-border/30 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-success/20 border border-success/30" /> Answered ({answeredCount})</div>
                  <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-primary" /> Current</div>
                  <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded bg-muted/10 border border-border/30" /> Unanswered ({totalQuestions - answeredCount})</div>
                </div>

                {/* Confidence meter */}
                <div className="mt-5 pt-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground mb-2">Progress</p>
                  <div className="relative h-3 bg-muted/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-success rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-center font-medium">{Math.round(progressPct)}% complete</p>
                </div>
              </div>
            </div>

            {/* Question content */}
            <div className="col-span-1 lg:col-span-9 order-1 lg:order-2">
              <AnimatePresence mode="wait">
                {currentQ && (
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="glass-card rounded-2xl p-4 sm:p-8"
                  >
                    {/* Question header */}
                    <div className="flex items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
                      <motion.div 
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"
                        initial={{ rotate: -10, scale: 0.9 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <span className="text-lg font-bold text-primary">{currentIndex + 1}</span>
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-xl font-heading font-semibold text-foreground leading-relaxed">
                          {unwrapString(currentQ.question_text) || currentQ.question_text}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Badge variant="outline" className="text-xs gap-1">
                            <Award className="w-3 h-3" /> {currentQ.marks || 0} marks
                          </Badge>
                          {currentQ.difficulty_level && (
                            <Badge variant={
                              currentQ.difficulty_level === 'easy' ? 'secondary' :
                              currentQ.difficulty_level === 'hard' ? 'destructive' : 'default'
                            } className="text-xs">
                              {currentQ.difficulty_level}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs uppercase">{currentQ.type || 'mcq'}</Badge>
                        </div>
                      </div>
                    </div>

                    {/* Helpful hint */}
                    <div className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-3 mb-6">
                      <p className="text-xs text-primary font-medium">💡 Select the best answer. You can change your selection anytime before submitting.</p>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                      {(currentQ.options || []).length === 0 ? (
                        <p className="text-muted-foreground text-sm text-center py-8">No options available for this question</p>
                      ) : (
                        (currentQ.options || []).map((opt: any, idx: number) => {
                          const optId = opt.id || opt.option_id;
                          const qId = currentQ.question_id || currentQ.id;
                          const isSelected = answers[qId] === optId;
                          const optText = unwrapString(opt.option_text) || opt.option_text || '';
                          const label = currentQ.type === 'true_false' 
                            ? (idx === 0 ? 'True' : 'False') 
                            : String.fromCharCode(65 + idx);
                          return (
                            <motion.button
                              key={optId || idx}
                              whileHover={{ scale: 1.01, x: 4 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => selectAnswer(qId, optId)}
                              className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left group ${
                                isSelected
                                  ? 'border-primary bg-primary/5 shadow-md'
                                  : 'border-border/30 hover:border-primary/30 hover:bg-muted/5'
                              }`}
                            >
                              <motion.div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                                  isSelected ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/10 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                                }`}
                                animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                                transition={{ duration: 0.3 }}
                              >
                                {label}
                              </motion.div>
                              <span className={`flex-1 text-base ${isSelected ? 'text-foreground font-medium' : 'text-foreground'}`}>{optText}</span>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 500 }}
                                >
                                  <CheckCircle2 className="w-6 h-6 text-primary" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })
                      )}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-8 pt-5 border-t border-border/30">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                        disabled={currentIndex === 0}
                        className="gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </Button>
                      {currentIndex < totalQuestions - 1 ? (
                        <Button size="lg" onClick={() => setCurrentIndex(i => Math.min(totalQuestions - 1, i + 1))} className="gap-2">
                          Next <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button variant="destructive" size="lg" onClick={() => submitExam()} disabled={submitting || answeredCount < totalQuestions} className="gap-2" title={answeredCount < totalQuestions ? `Answer all ${totalQuestions} questions first` : 'Submit exam'}>
                          <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : answeredCount < totalQuestions ? `Answer all (${totalQuestions - answeredCount} left)` : 'Finish & Submit'}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Published exams that haven't been taken yet
  const availableExams = exams.filter((e: any) => {
    const status = unwrapString(e.status) || e.status;
    return status === 'published';
  });

  // Completed sessions
  const completedSessions = (sessions || []).filter((s: any) => {
    const status = typeof s.status === 'object' ? unwrapString(s.status) : s.status;
    return status === 'submitted';
  });

  // Exam list view
  return (
    <AnimatedPage>
      <PageHeader title="My Exams" description="View and take your assigned exams" />

      {/* Tab switcher - side by side buttons */}
      <div className="flex items-center gap-1 mb-6 bg-muted/10 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('available')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'available' 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Play className="w-4 h-4" />
          Available ({availableExams.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === 'history' 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-4 h-4" />
          History ({completedSessions.length})
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <GridCardSkeleton key={i} />)}
        </div>
      ) : tab === 'available' ? (
        availableExams.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No exams available"
            description="Your available exams will appear here once your teacher publishes them. Stay tuned! 📚"
          />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {availableExams.map(exam => {
              const title = unwrapString(exam.title) || exam.title;
              const duration = typeof exam.duration_minutes === 'object' ? unwrapInt(exam.duration_minutes) : (exam.duration_minutes ?? 0);
              const marks = typeof exam.total_marks === 'object' ? unwrapInt(exam.total_marks) : (exam.total_marks ?? 0);
              const startT = exam.start_time;
              const endT = exam.end_time;
              const now = new Date();
              const canStart = startT ? new Date(startT) <= now : true;
              const isExpired = endT ? new Date(endT) < now : false;
              const existingSession = getExamSession(exam.id);
              const alreadyTaken = existingSession && (typeof existingSession.status === 'object' ? unwrapString(existingSession.status) : existingSession.status) === 'submitted';

              return (
                <motion.div
                  key={exam.id}
                  variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="glass-card rounded-2xl overflow-hidden group"
                >
                  <div className="h-2 bg-gradient-to-r from-primary to-success" />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-heading font-semibold text-foreground text-lg leading-tight">{title}</h3>
                        <Badge variant="default" className="mt-2 gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </Badge>
                      </div>
                      <motion.div 
                        className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center"
                        whileHover={{ rotate: 5, scale: 1.05 }}
                      >
                        <ClipboardList className="w-7 h-7 text-primary" />
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="bg-muted/10 rounded-xl p-3.5 text-center">
                        <Timer className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                        <p className="font-bold text-foreground">{duration} min</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
                      </div>
                      <div className="bg-muted/10 rounded-xl p-3.5 text-center">
                        <Award className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                        <p className="font-bold text-foreground">{marks}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Marks</p>
                      </div>
                    </div>

                    {startT && (
                      <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {format(new Date(startT), 'MMM d, yyyy · HH:mm')}
                        {endT && ` — ${format(new Date(endT), 'HH:mm')}`}
                      </p>
                    )}

                    <div className="pt-3 border-t border-border/50">
                      {alreadyTaken ? (
                        <Button variant="secondary" className="w-full gap-2" disabled>
                          <CheckCircle2 className="w-4 h-4" /> Already Taken
                        </Button>
                      ) : isExpired ? (
                        <Button variant="secondary" className="w-full gap-2" disabled>
                          <AlertTriangle className="w-4 h-4" /> Expired
                        </Button>
                      ) : !canStart ? (
                        <Button variant="secondary" className="w-full gap-2" disabled>
                          <Clock className="w-4 h-4" /> Not Started Yet
                        </Button>
                      ) : (
                        <Button className="w-full gap-2 group/btn" onClick={() => startExam(exam.id, duration)}>
                          <Play className="w-4 h-4" /> Start Exam 
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )
      ) : (
        // History tab
        completedSessions.length === 0 ? (
          <EmptyState
            icon={History}
            title="No exam history"
            description="Your completed exams will show up here after you submit them."
          />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          >
            {completedSessions.map((session: any) => {
              const examId = typeof session.exam_id === 'object' ? unwrapString(session.exam_id) : session.exam_id;
              const score = typeof session.total_score === 'object' ? unwrapInt(session.total_score) : (session.total_score ?? 0);
              const status = typeof session.status === 'object' ? unwrapString(session.status) : session.status;
              const endTime = typeof session.end_time === 'object' ? unwrapTime(session.end_time) : session.end_time;
              const startTime = typeof session.start_time === 'object' ? unwrapTime(session.start_time) : session.start_time;

              return (
                <motion.div
                  key={session.id}
                  variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                  whileHover={{ y: -4 }}
                  className="glass-card rounded-2xl overflow-hidden"
                >
                  <div className="h-2 bg-gradient-to-r from-success to-primary" />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Submitted
                      </Badge>
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-success" />
                      </div>
                    </div>

                    <div className="bg-muted/10 rounded-xl p-4 text-center mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Your Score</p>
                      <p className="text-3xl font-heading font-bold text-primary">{score}</p>
                    </div>

                    {startTime && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Taken on {format(new Date(startTime), 'MMM d, yyyy · HH:mm')}
                      </p>
                    )}

                    <Button variant="outline" size="sm" className="w-full mt-3 gap-1.5" onClick={() => viewSessionResult(session.id)}>
                      <Award className="w-3.5 h-3.5" /> View Details
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )
      )}

      {/* Results Dialog */}
      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-center">Exam Results</DialogTitle></DialogHeader>
          {result && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6 space-y-5">
              <motion.div 
                className="w-24 h-24 rounded-full bg-success/15 flex items-center justify-center mx-auto"
                initial={{ rotate: -20 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Trophy className="w-12 h-12 text-success" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-heading font-bold text-foreground">
                  {result.status === 'submitted' ? '🎉 Exam Completed!' : 'Results'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">Great job on completing the exam!</p>
              </div>

              <div className="bg-muted/10 rounded-2xl p-6">
                <p className="text-xs text-muted-foreground mb-2">Total Score</p>
                <p className="text-5xl font-heading font-bold text-primary">{result.total_score}</p>
              </div>

              {result.total_questions > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/10 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Questions</p>
                    <p className="text-xl font-bold text-foreground">{result.total_questions}</p>
                  </div>
                  <div className="bg-muted/10 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">Answered</p>
                    <p className="text-xl font-bold text-foreground">{result.answered}</p>
                  </div>
                </div>
              )}

              <Button className="w-full mt-4 gap-2" onClick={() => { setResultOpen(false); fetchExams(); }}>
                <ArrowRight className="w-4 h-4" /> Back to Exams
              </Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
