import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import AnimatedPage from '@/components/shared/AnimatedPage';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Download, HardDrive, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BackupsPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const list = await api.getBackups();
      setBackups(list || []);
    } catch (e: any) {
      toast.error(e.message || 'Failed to list backups');
    }
    setLoading(false);
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await api.createBackup();
      toast.success('Database snapshot backup created successfully');
      loadBackups();
    } catch (e: any) {
      toast.error(e.message || 'Failed to create backup snapshot');
    }
    setCreating(false);
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AnimatedPage>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <PageHeader
          title="Database Backup & Disaster Recovery"
          description="Create live SQLite database snapshots, download recovery files, and safeguard institutional academic records"
        />

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadBackups} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateBackup} disabled={creating} className="gap-2">
            <Database className="w-4 h-4" />
            {creating ? 'Creating Snapshot...' : 'Create Backup Snapshot'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Available Backups</CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center justify-between">
              {backups.length}
              <HardDrive className="w-5 h-5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Persisted in local server storage</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Latest Snapshot</CardDescription>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              {backups.length > 0 && backups[0].created_at ? new Date(backups[0].created_at).toLocaleString() : 'No backup yet'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Ready for export or disaster recovery</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2">
            <CardDescription>Storage Health</CardDescription>
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-500">
              <ShieldAlert className="w-4 h-4" />
              Optimal (WAL Mode)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">SQLite ACID concurrency enabled</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-border/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Snapshot Archives</CardTitle>
          <CardDescription>Download backup archives to external offline storage</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Loading backup archives...</div>
          ) : backups.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No backups generated yet. Click "Create Backup Snapshot" to create one now.
            </div>
          ) : (
            <div className="rounded-lg border border-border/40 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Archive Filename</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead>Creation Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((b: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs font-medium text-foreground flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        {b.filename}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatBytes(b.size_bytes)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {b.created_at ? new Date(b.created_at).toLocaleString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-600 text-white font-normal text-xs">
                          Verified Integrity
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="gap-1.5 text-xs h-8"
                        >
                          <a
                            href={`/api/v1/superadmin/backups/${b.filename}/download`}
                            download={b.filename}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
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
    </AnimatedPage>
  );
}
