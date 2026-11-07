import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Binary,
  Building2,
  Cloud,
  Cpu,
  Database,
  Fingerprint,
  FlaskConical,
  GitBranch,
  Globe2,
  Infinity as InfinityIcon,
  Layers,
  Network,
  Puzzle,
  Server,
  Share2,
  ShieldCheck,
  Workflow,
  Zap,
} from 'lucide-react'
import type { IconName } from '../../types'

const ICONS: Record<IconName, LucideIcon> = {
  layers: Layers,
  binary: Binary,
  fingerprint: Fingerprint,
  cpu: Cpu,
  workflow: Workflow,
  network: Network,
  server: Server,
  database: Database,
  share: Share2,
  zap: Zap,
  building: Building2,
  puzzle: Puzzle,
  activity: Activity,
  shield: ShieldCheck,
  'git-branch': GitBranch,
  flask: FlaskConical,
  globe: Globe2,
  cloud: Cloud,
  infinity: InfinityIcon,
}

export function CategoryIcon({
  name,
  size = 18,
  strokeWidth = 1.8,
  className,
}: {
  name: IconName
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const Icon = ICONS[name]
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden="true" />
}
