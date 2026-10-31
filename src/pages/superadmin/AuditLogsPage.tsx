import { useState, useEffect } from 'react';
import { api, unwrapString } from '@/lib/api';
import AnimatedPage from '@/components/shared/AnimatedPage';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldCheck, Search, RefreshCw, Activity, Terminal } from 'lucide-react';
import { toast } from 'sonner';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const list = await api.getAuditLogs(page, 50);
      setLogs(list || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to load audit logs');
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter((l: any) => {
    const term = searchTerm.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(term)) ||
      (l.username && l.username.toLowerCase().includes(term)) ||
      (l.entity_type && l.entity_type.toLowerCase().includes(term)) ||
      (l.details && l.details.toLowerCase().includes(term))
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (!action) return 'secondary';
    const a = action.toLowerCase();
    if (a.includes('delete') || a.includes('drop') || a.includes('violation')) return 'destructive';
    if (a.includes('create') || a.includes('approve') || a.includes('start')) return 'default';
    if (a.includes('update') || a.includes('extend') || a.includes('correct')) return 'outline';
    return 'secondary';
  };

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="System Audit Trail & Security Logs"
          description="Comprehensive real-time activity log tracking user authentications, exam permissions, mark changes, and administration events"
        />

        <Button variant="outline" onClick={loadLogs} disabled={loading} className="gap-2 shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="glass-card border-border/60">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Immutable Audit Log Stream
              </CardTitle>
              <CardDescription>
                Showing recent recorded operations across the system
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter by user, action or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Fetching audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No audit logs match your search.
            </div>
          ) : (
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>User / Principal</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target Entity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[120px]">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell className="font-medium text-sm text-foreground">
                        {log.username || 'System Engine'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeColor(log.action)} className="capitalize text-xs font-mono">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.entity_type ? (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">
                            {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 6)})` : ''}
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={log.details}>
                        {log.details || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {log.ip_address || 'Localhost'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
            <div>Showing {filteredLogs.length} entries (Page {page})</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={filteredLogs.length < 50}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AnimatedPage>
  );
}
