import { useState, useEffect, useCallback } from 'react';
import { api, unwrapString, unwrapInt, unwrapTime } from '@/lib/api';
import AnimatedPage from '@/components/shared/AnimatedPage';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Trophy, Clock, CheckCircle2, Award, Star, TrendingUp, BarChart3,
  Calendar, Target, Sparkles, ArrowRight, Medal, Zap, Printer, BookOpen, FileText, Building2
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function StudentResultsPage() {
  const { branding } = useTheme();
  const [results, setResults] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [courseworkMarks, setCourseworkMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resList, sessList, cwList] = await Promise.all([
        api.getMyResults().catch(() => []),
        api.getStudentSessions().catch(() => []),
        api.getMyMarks().catch(() => []),
      ]);
      setResults(resList || []);
      setSessions(sessList || []);
      setCourseworkMarks(cwList || []);
    } catch (e: any) {
      toast.error('Failed to load academic records');
    }
    setLoading(false);
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A':
        return <Badge className="bg-emerald-600 text-white font-bold text-xs">Grade A (Excellent)</Badge>;
      case 'B':
        return <Badge className="bg-blue-600 text-white font-bold text-xs">Grade B (Good)</Badge>;
      case 'C':
        return <Badge className="bg-amber-600 text-white font-bold text-xs">Grade C (Satisfactory)</Badge>;
      case 'D':
        return <Badge className="bg-orange-600 text-white font-bold text-xs">Grade D (Pass)</Badge>;
      default:
        return <Badge variant="destructive" className="font-bold text-xs">Grade F (Fail)</Badge>;
    }
  };

  const totalScoreSum = results.reduce((acc, r) => acc + (r.total_score || 0), 0);
  const gpaAvg = results.length > 0 ? (totalScoreSum / results.length).toFixed(1) : '—';

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Academic Assessment & Results"
          description="View your official Continuous Assessment (CA) scores, final examination marks, and performance report cards"
        />

        <Button variant="outline" onClick={() => window.print()} className="gap-2 shrink-0 no-print">
          <Printer className="w-4 h-4" />
          Print Report Card
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs">
              Term Average Score
              <Award className="w-4 h-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {gpaAvg}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Aggregated across all registered subjects</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs">
              Subjects Evaluated
              <BookOpen className="w-4 h-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {results.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Published official final reports</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs">
              Coursework Submissions
              <FileText className="w-4 h-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {courseworkMarks.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Quizzes, mids, assignments, projects</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between text-xs">
              Academic Standing
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </CardDescription>
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
              Good Standing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All passing criteria fulfilled</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reportcard" className="space-y-6">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="reportcard" className="flex items-center gap-2 text-xs">
            <Award className="w-4 h-4" />
            Official Report Card (CA + Final)
          </TabsTrigger>
          <TabsTrigger value="coursework" className="flex items-center gap-2 text-xs">
            <FileText className="w-4 h-4" />
            Continuous Assessment Details
          </TabsTrigger>
        </TabsList>

        {/* 1. Official Report Card Tab */}
        <TabsContent value="reportcard">
          <Card className="glass-card border-border/60">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {branding?.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt="School Logo"
                      className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1 border border-border/60 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-primary font-heading">
                      {branding?.schoolName || 'OFFICIAL REPORT CARD'}
                    </div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      Academic Term Evaluation Breakdown
                    </CardTitle>
                    <CardDescription>
                      Continuous Assessment (Quizzes, Mids, Assignments, Projects) aggregated with Final Examinations
                    </CardDescription>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-2 shrink-0 no-print"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Report Card
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {loading ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Loading results...</div>
              ) : results.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No published results found for your account yet. Check back once your teachers have finalized grading.
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-lg border border-border/40 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/40 text-xs">
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead className="text-center">Quiz</TableHead>
                          <TableHead className="text-center">Mid Exam</TableHead>
                          <TableHead className="text-center">Assignment</TableHead>
                          <TableHead className="text-center">Project</TableHead>
                          <TableHead className="text-center font-bold bg-muted/20">CA Score</TableHead>
                          <TableHead className="text-center font-bold">Final Exam</TableHead>
                          <TableHead className="text-center font-bold text-primary bg-primary/5">Total Score</TableHead>
                          <TableHead className="text-center">Official Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((r: any, idx: number) => (
                          <TableRow key={r.id || idx} className="hover:bg-muted/20 text-xs transition-colors">
                            <TableCell className="font-semibold text-foreground">{r.subject_name}</TableCell>
                            <TableCell className="text-center font-mono">{r.quiz_score?.toFixed(1) || '0.0'}</TableCell>
                            <TableCell className="text-center font-mono">{r.mid_score?.toFixed(1) || '0.0'}</TableCell>
                            <TableCell className="text-center font-mono">{r.assignment_score?.toFixed(1) || '0.0'}</TableCell>
                            <TableCell className="text-center font-mono">{r.project_score?.toFixed(1) || '0.0'}</TableCell>
                            <TableCell className="text-center font-mono font-bold bg-muted/20">{r.ca_score?.toFixed(1) || '0.0'}</TableCell>
                            <TableCell className="text-center font-mono font-bold">{r.final_score?.toFixed(1) || '0.0'}</TableCell>
                            <TableCell className="text-center font-mono font-extrabold text-primary bg-primary/5 text-sm">
                              {r.total_score?.toFixed(1) || '0.0'}%
                            </TableCell>
                            <TableCell className="text-center">
                              {getGradeBadge(r.grade || 'F')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Coursework Marks Tab */}
        <TabsContent value="coursework">
          <Card className="glass-card border-border/60">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Continuous Assessment Breakdown
              </CardTitle>
              <CardDescription>
                Detailed scores and teacher feedback across all quizzes, assignments, and projects
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {courseworkMarks.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No individual coursework marks recorded yet.
                </div>
              ) : (
                <div className="rounded-lg border border-border/40 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40 text-xs">
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Assessment Title</TableHead>
                        <TableHead>Marks Obtained</TableHead>
                        <TableHead>Grading Feedback / Remarks</TableHead>
                        <TableHead className="text-right">Graded Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseworkMarks.map((m: any, idx: number) => (
                        <TableRow key={m.id || idx} className="hover:bg-muted/20 text-xs transition-colors">
                          <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-foreground">Assessment #{m.coursework_id.slice(0, 6)}</TableCell>
                          <TableCell className="font-mono font-bold text-primary">
                            {m.marks_obtained} pts
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {m.remarks || 'Satisfactory work completed.'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {m.graded_at ? new Date(m.graded_at).toLocaleDateString() : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AnimatedPage>
  );
}
