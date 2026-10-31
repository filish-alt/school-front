import { useState, useEffect } from 'react';
import { api, unwrapString, unwrapInt } from '@/lib/api';
import AnimatedPage from '@/components/shared/AnimatedPage';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Printer, 
  Download, 
  Award, 
  FileSpreadsheet, 
  Calculator, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Building2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

export default function TransferSheetsPage() {
  const { branding } = useTheme();
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Quick Aggregate Dialog
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcSubject, setCalcSubject] = useState<string>('');
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [secs, subs] = await Promise.all([
        api.getSections(1, 100).catch(() => []),
        api.getSubjects(1, 100).catch(() => []),
      ]);
      setSections(Array.isArray(secs) ? secs : []);
      setSubjects(Array.isArray(subs) ? subs : []);
      if (Array.isArray(secs) && secs.length > 0) {
        setSelectedSection(secs[0].id);
        loadTransferSheet(secs[0].id);
      }
      if (Array.isArray(subs) && subs.length > 0) {
        setCalcSubject(subs[0].id);
      }
    } catch (e: any) {
      toast.error('Failed to load initial sections and subjects');
    }
  };

  const loadTransferSheet = async (sectionId: string) => {
    if (!sectionId) return;
    setLoading(true);
    try {
      const list = await api.getTransferSheet(sectionId);
      setResults(Array.isArray(list) ? list : []);
    } catch (e: any) {
      console.error('Failed to load transfer sheet:', e);
      setResults([]);
      toast.error(e?.message || 'Failed to load transfer sheet data');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (val: string) => {
    setSelectedSection(val);
    loadTransferSheet(val);
  };

  const handleCalculateCA = async () => {
    if (!selectedSection || !calcSubject) {
      toast.error('Please select both Section and Subject');
      return;
    }
    setCalculating(true);
    try {
      await api.calculateResults({
        section_id: selectedSection,
        subject_id: calcSubject,
      });
      toast.success('Continuous Assessment (CA) and final results aggregated successfully');
      setCalcOpen(false);
      loadTransferSheet(selectedSection);
    } catch (e: any) {
      toast.error(e.message || 'Failed to calculate results');
    } finally {
      setCalculating(false);
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) {
      toast.error('No transfer sheet records to export');
      return;
    }

    const headers = ['Student Code', 'Student Name', 'Subject', 'Section', 'Quiz (10%)', 'Mid (30%)', 'Assignment (10%)', 'Project (10%)', 'CA Total (40%)', 'Final Exam (60%)', 'Total (100%)', 'Grade'];
    const rows = results.map((r) => [
      `"${r.student_code || ''}"`,
      `"${r.student_name || ''}"`,
      `"${r.subject_name || ''}"`,
      `"${r.section_name || ''}"`,
      r.quiz_score?.toFixed(1) || '0.0',
      r.mid_score?.toFixed(1) || '0.0',
      r.assignment_score?.toFixed(1) || '0.0',
      r.project_score?.toFixed(1) || '0.0',
      r.ca_score?.toFixed(1) || '0.0',
      r.final_score?.toFixed(1) || '0.0',
      r.total_score?.toFixed(1) || '0.0',
      `"${r.grade || 'F'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transfer_sheet_${activeSectionObj?.name || 'section'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transfer sheet exported to CSV');
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A':
        return <Badge className="bg-emerald-600 text-white font-bold text-xs">A</Badge>;
      case 'B':
        return <Badge className="bg-blue-600 text-white font-bold text-xs">B</Badge>;
      case 'C':
        return <Badge className="bg-amber-600 text-white font-bold text-xs">C</Badge>;
      case 'D':
        return <Badge className="bg-orange-600 text-white font-bold text-xs">D</Badge>;
      default:
        return <Badge variant="destructive" className="font-bold text-xs">F</Badge>;
    }
  };

  const activeSectionObj = sections.find((s) => s.id === selectedSection);

  // Compute summary stats
  const uniqueStudents = new Set(results.map((r) => r.student_id)).size;
  const avgScore = results.length > 0 ? (results.reduce((acc, curr) => acc + (curr.total_score || 0), 0) / results.length).toFixed(1) : '0.0';
  const passingCount = results.filter((r) => (r.grade || 'F') !== 'F').length;
  const passRate = results.length > 0 ? Math.round((passingCount / results.length) * 100) : 0;

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Official Result & Transfer Sheets"
          description="Institutional academic assessment register with flexible Continuous Assessment (CA) and Final Examination aggregation"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={selectedSection} onValueChange={handleSectionChange}>
            <SelectTrigger className="w-52 bg-card">
              <SelectValue placeholder="Select section..." />
            </SelectTrigger>
            <SelectContent>
              {sections.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>
                  {unwrapString(s.name) || s.name} ({unwrapString(s.grade_level) || s.grade_level || 'General'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setCalcOpen(true)}
            className="gap-2 shrink-0 no-print"
          >
            <Calculator className="w-4 h-4 text-primary" />
            Aggregate CA / Final
          </Button>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={results.length === 0}
            className="gap-2 shrink-0 no-print"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            onClick={() => window.print()}
            className="gap-2 shrink-0 no-print"
          >
            <Printer className="w-4 h-4" />
            Print Sheet
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 no-print">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Students in Sheet</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">{uniqueStudents}</p>
            </div>
            <Users className="w-7 h-7 text-primary/40" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Subject Records</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">{results.length}</p>
            </div>
            <FileSpreadsheet className="w-7 h-7 text-blue-500/40" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Average Score</p>
              <p className="text-2xl font-bold font-mono text-foreground mt-0.5">{avgScore}%</p>
            </div>
            <TrendingUp className="w-7 h-7 text-amber-500/40" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Passing Rate</p>
              <p className="text-2xl font-bold font-mono text-emerald-500 mt-0.5">{passRate}%</p>
            </div>
            <CheckCircle2 className="w-7 h-7 text-emerald-500/40" />
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-border/60 shadow-lg">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt="School Logo"
                  className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1 border border-border/60 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-primary font-heading">
                  {branding?.schoolName || 'OFFICIAL ACADEMIC RECORD'}
                </div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                  Transfer & Result Register: {unwrapString(activeSectionObj?.name) || activeSectionObj?.name || 'Section'}
                </CardTitle>
                <CardDescription>
                  Academic Year: {unwrapString(activeSectionObj?.academic_year) || '2025/2026'} · Grade: {unwrapString(activeSectionObj?.grade_level) || 'General'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground no-print">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Flexible CA Weighting</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Auto-Graded</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm">Loading transfer sheet data...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto text-muted-foreground">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <p className="font-semibold text-foreground">No Published Results Found</p>
                <p className="text-xs text-muted-foreground">
                  No aggregated marks are recorded for this section yet. Click "Aggregate CA / Final" to compile Continuous Assessment & Final Exam scores into the official register.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCalcOpen(true)}
                className="gap-2 text-primary"
              >
                <Sparkles className="w-4 h-4" />
                Aggregate Results for this Section
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border border-border/40 overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40 text-xs">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead className="w-28">Student Code</TableHead>
                      <TableHead className="w-48">Full Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-center">Quiz</TableHead>
                      <TableHead className="text-center">Mid</TableHead>
                      <TableHead className="text-center">Assign</TableHead>
                      <TableHead className="text-center">Proj</TableHead>
                      <TableHead className="text-center font-bold bg-muted/20">CA Total</TableHead>
                      <TableHead className="text-center font-bold">Final Exam</TableHead>
                      <TableHead className="text-center font-bold text-primary bg-primary/5">Total (100%)</TableHead>
                      <TableHead className="text-center">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r: any, idx: number) => (
                      <TableRow key={r.id || idx} className="hover:bg-muted/20 text-xs transition-colors">
                        <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-mono font-semibold text-foreground">{r.student_code || '—'}</TableCell>
                        <TableCell className="font-medium text-foreground">{r.student_name || '—'}</TableCell>
                        <TableCell className="text-muted-foreground font-medium">{r.subject_name || '—'}</TableCell>
                        <TableCell className="text-center font-mono">{r.quiz_score != null ? Number(r.quiz_score).toFixed(1) : '0.0'}</TableCell>
                        <TableCell className="text-center font-mono">{r.mid_score != null ? Number(r.mid_score).toFixed(1) : '0.0'}</TableCell>
                        <TableCell className="text-center font-mono">{r.assignment_score != null ? Number(r.assignment_score).toFixed(1) : '0.0'}</TableCell>
                        <TableCell className="text-center font-mono">{r.project_score != null ? Number(r.project_score).toFixed(1) : '0.0'}</TableCell>
                        <TableCell className="text-center font-mono font-bold bg-muted/20">{r.ca_score != null ? Number(r.ca_score).toFixed(1) : '0.0'}</TableCell>
                        <TableCell className="text-center font-mono font-bold">{r.final_score != null ? Number(r.final_score).toFixed(1) : '0.0'}</TableCell>
                        <TableCell className="text-center font-mono font-extrabold text-primary bg-primary/5 text-sm">
                          {r.total_score != null ? Number(r.total_score).toFixed(1) : '0.0'}
                        </TableCell>
                        <TableCell className="text-center">
                          {getGradeBadge(r.grade || 'F')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Official Signature Verification Blocks for Director & Dept Head */}
              <div className="pt-10 grid grid-cols-3 gap-6 text-xs text-foreground border-t border-border/40">
                <div className="space-y-4">
                  <p className="font-semibold">Subject Teacher Signature:</p>
                  <div className="border-b border-foreground/40 pb-2 w-48 text-muted-foreground italic">Signature & Date</div>
                </div>
                <div className="space-y-4 text-center">
                  <p className="font-semibold">Department Head Approval:</p>
                  <div className="border-b border-foreground/40 pb-2 w-48 mx-auto text-muted-foreground italic">Signature & Date</div>
                </div>
                <div className="space-y-4 text-right">
                  <p className="font-semibold">School Director / Registrar:</p>
                  <div className="border-b border-foreground/40 pb-2 w-48 ml-auto text-muted-foreground italic">Official Stamp & Signature</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aggregate Modal */}
      <Dialog open={calcOpen} onOpenChange={setCalcOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              Aggregate Assessment & Final Exam Scores
            </DialogTitle>
            <DialogDescription>
              Calculate cumulative Continuous Assessment (CA) and Final Exam marks for all enrolled students in section <strong>{unwrapString(activeSectionObj?.name) || activeSectionObj?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label>Target Subject</Label>
              <Select value={calcSubject} onValueChange={setCalcSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject..." />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {unwrapString(sub.name) || sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Aggregation Breakdown:</p>
              <p>• Coursework (Quizzes, Mid Exam, Assignments, Projects) scaled to CA weight (40%)</p>
              <p>• Final Exam sessions automatically scaled to Final weight (60%)</p>
              <p>• Grade assigned automatically (A, B, C, D, F) based on institution thresholds</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCalcOpen(false)}>Cancel</Button>
            <Button onClick={handleCalculateCA} disabled={calculating} className="gap-2">
              {calculating && <RefreshCw className="w-4 h-4 animate-spin" />}
              {calculating ? 'Aggregating...' : 'Calculate & Publish Results'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
