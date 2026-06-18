import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STYLES = {
  applied:     'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  shortlisted: 'bg-blue-100   text-blue-800   hover:bg-blue-100',
  selected:    'bg-green-100  text-green-800  hover:bg-green-100',
  rejected:    'bg-red-100    text-red-800    hover:bg-red-100',
}

export default function StatusBadge({ status }) {
  return (
    <Badge className={cn('capitalize font-medium', STYLES[status] ?? 'bg-gray-100 text-gray-700')}>
      {status}
    </Badge>
  )
}