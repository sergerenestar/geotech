interface BadgeProps {
  status: string;
  label?: string;
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-500 border-slate-300',
  ACTIVE: 'bg-green-100 text-green-800 border-green-300',
  ON_HOLD: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
  ARCHIVED: 'bg-slate-100 text-slate-500 border-slate-400',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800 border-amber-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-300',
  APPROVED: 'bg-green-100 text-green-800 border-green-300',
  REJECTED: 'bg-red-100 text-red-800 border-red-300',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-300',
  INACTIVE: 'bg-red-100 text-red-800 border-red-300',
  USER: 'bg-slate-100 text-slate-600 border-slate-300',
  LAB_MANAGER: 'bg-blue-100 text-blue-700 border-blue-300',
  ADMIN: 'bg-purple-100 text-purple-700 border-purple-300',
  PROJECT_MANAGER: 'bg-teal-100 text-teal-700 border-teal-300',
};

export default function Badge({ status, label }: BadgeProps) {
  const cls = statusStyles[status] ?? 'bg-gray-100 text-gray-600 border-gray-300';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label ?? status.replace(/_/g, ' ')}
    </span>
  );
}
