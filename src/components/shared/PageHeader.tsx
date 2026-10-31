import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Props {
  title: string;
  description?: string;
  onAdd?: () => void;
  addLabel?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, onAdd, addLabel, children }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground tracking-tight truncate">{title}</h1>
        {description && <p className="text-xs sm:text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {(children || onAdd) && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {children}
          {onAdd && (
            <Button onClick={onAdd} className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              <span>{addLabel || 'Add New'}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
