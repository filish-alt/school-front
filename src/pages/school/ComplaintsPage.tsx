import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import AnimatedPage from '@/components/shared/AnimatedPage';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MessageSquare, CheckCircle2, Clock, AlertTriangle, UserCheck, Search, Filter } from 'lucide-react';

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [responseNotes, setResponseNotes] = useState('');
  const [newStatus, setNewStatus] = useState('resolved');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, [statusFilter]);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const list = await api.getSchoolComplaints(statusFilter === 'all' ? undefined : statusFilter);
      setComplaints(list || []);
    } catch (e: any) {
      toast.error('Failed to load student complaints');
    }
    setLoading(false);
  };

  const handleOpenResolve = (comp: any) => {
    setSelectedComplaint(comp);
    setResponseNotes(comp.response || '');
    setNewStatus(comp.status === 'pending' ? 'resolved' : comp.status);
    setResolveOpen(true);
  };

  const handleSaveResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseNotes) {
      toast.error('Please enter resolution response notes');
      return;
    }
    setSaving(true);
    try {
      await api.resolveComplaint(selectedComplaint.id, {
        status: newStatus,
        response: responseNotes,
      });
      toast.success('Complaint resolution saved');
      setResolveOpen(false);
      loadComplaints();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update complaint');
    }
    setSaving(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-emerald-600 text-white gap-1 text-xs"><CheckCircle2 className="w-3 h-3" /> Resolved</Badge>;
      case 'escalated_to_dept_head':
        return <Badge className="bg-purple-600 text-white gap-1 text-xs"><AlertTriangle className="w-3 h-3" /> Escalated to Dept Head</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1 text-xs">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1 text-xs"><Clock className="w-3 h-3" /> Pending Review</Badge>;
    }
  };

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Student Complaints & Grade Dispute Management"
          description="Track, investigate, and resolve student disputes regarding exams, answer keys, coursework marks, and final results"
        />

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-card text-xs">
              <SelectValue placeholder="All Complaints" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="escalated_to_dept_head">Escalated to Dept Head</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Active Complaints Register
          </CardTitle>
          <CardDescription>
            Workflow: Student $\to$ Assigned Teacher $\to$ Department Head Investigation $\to$ Resolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No complaints filed under this filter.
            </div>
          ) : (
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject / Exam</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((c: any) => (
                    <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="font-semibold text-sm text-foreground">{c.student_name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{c.student_code}</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>{c.subject_name || 'Subject'}</div>
                        <div className="text-[11px] text-foreground font-medium">{c.exam_title || 'Coursework'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {c.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-foreground max-w-xs truncate" title={c.description}>
                        {c.description}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(c.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenResolve(c)}
                          className="text-xs h-8"
                        >
                          Investigate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Dialog */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="max-w-lg">
          {selectedComplaint && (
            <form onSubmit={handleSaveResolution}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Investigate Dispute: {selectedComplaint.student_name}
                </DialogTitle>
                <DialogDescription>
                  Review the student's submission and document your official resolution.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-3 text-xs">
                <div className="p-3 bg-muted/20 rounded-lg space-y-1">
                  <div className="font-semibold text-foreground">Complaint Description:</div>
                  <p className="text-muted-foreground leading-relaxed">{selectedComplaint.description}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="escalated_to_dept_head">Escalate to Department Head</SelectItem>
                      <SelectItem value="resolved">Resolved (Marks Adjusted / Verified)</SelectItem>
                      <SelectItem value="rejected">Reject Complaint (Marks Upheld)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Official Response & Resolution Notes</Label>
                  <Textarea
                    placeholder="Enter resolution notes and message to student..."
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    rows={4}
                    className="text-xs"
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Resolution'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
