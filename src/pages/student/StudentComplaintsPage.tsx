import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import AnimatedPage from '@/components/shared/AnimatedPage';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageSquare, Plus, Clock, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

export default function StudentComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState('exam_result');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const list = await api.getMyComplaints();
      setComplaints(list || []);
    } catch (e: any) {
      toast.error('Failed to load complaints');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      toast.error('Please describe your inquiry or dispute');
      return;
    }
    setSubmitting(true);
    try {
      await api.createComplaint({
        category,
        description,
      });
      toast.success('Your complaint has been filed and routed to your teacher and department head');
      setDescription('');
      setOpenModal(false);
      loadComplaints();
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit complaint');
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-emerald-600 text-white gap-1 text-xs"><CheckCircle2 className="w-3 h-3" /> Resolved</Badge>;
      case 'escalated_to_dept_head':
        return <Badge className="bg-purple-600 text-white gap-1 text-xs"><AlertTriangle className="w-3 h-3" /> Escalated to Dept Head</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1 text-xs">Closed / Upheld</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1 text-xs"><Clock className="w-3 h-3" /> Under Teacher Review</Badge>;
    }
  };

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Student Grade & Assessment Inquiries"
          description="Submit inquiries or grade review requests regarding examination scores, questions, answer keys, or assignments"
        />

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Submit New Inquiry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Submit Assessment Inquiry
                </DialogTitle>
                <DialogDescription>
                  Your inquiry will be logged, audited, and escalated through the institutional review workflow.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3 text-xs">
                <div className="space-y-2">
                  <Label>Dispute Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exam_result">Final Examination Result Dispute</SelectItem>
                      <SelectItem value="question_key">Exam Question / Answer Key Ambiguity</SelectItem>
                      <SelectItem value="assignment_mark">Assignment or Quiz Mark Review</SelectItem>
                      <SelectItem value="project_mark">Project Work Grading Review</SelectItem>
                      <SelectItem value="other">Other Academic Concern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Detailed Description</Label>
                  <Textarea
                    placeholder="Provide specific details (Subject, Question number, reason for review request)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Inquiry'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            My Submitted Inquiries & Status History
          </CardTitle>
          <CardDescription>
            Track live responses from your subject teachers and department heads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading inquiry history...</div>
          ) : complaints.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              You have not submitted any grade inquiries. Click "Submit New Inquiry" if you need a score reviewed.
            </div>
          ) : (
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-28">Submitted</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>My Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Teacher / Dept Head Response</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((c: any) => (
                    <TableRow key={c.id} className="hover:bg-muted/20 text-xs transition-colors">
                      <TableCell className="font-mono text-muted-foreground">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-[11px]">
                          {c.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground max-w-xs font-medium">
                        {c.description}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(c.status)}
                      </TableCell>
                      <TableCell className="text-xs">
                        {c.response ? (
                          <div className="p-2.5 rounded bg-primary/10 border border-primary/20 text-foreground">
                            <span className="font-semibold block mb-0.5 text-primary">Response:</span>
                            {c.response}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">Awaiting teacher review...</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AnimatedPage>
  );
}
