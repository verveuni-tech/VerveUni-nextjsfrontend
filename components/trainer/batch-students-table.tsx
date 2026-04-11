import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GradeBadge } from "@/components/shared/grade-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { ROUTES } from "@/lib/constants"

export interface TrainerStudentRow {
  id: string
  fullName: string
  email: string
  totalSessions: number
  avgScore: number
  grade: string
  latestStatus?: string
}

export function BatchStudentsTable({ rows }: { rows: TrainerStudentRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Sessions</TableHead>
          <TableHead>Average Score</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Latest Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell>
              <Link href={ROUTES.TRAINER_STUDENT(row.id)} className="font-medium hover:underline">
                {row.fullName}
              </Link>
              <div className="text-xs text-muted-foreground">{row.email}</div>
            </TableCell>
            <TableCell>{row.totalSessions}</TableCell>
            <TableCell>{Math.round(row.avgScore)}%</TableCell>
            <TableCell>
              <GradeBadge grade={row.grade || "N/A"} size="sm" />
            </TableCell>
            <TableCell>{row.latestStatus ? <StatusBadge status={row.latestStatus} /> : "No sessions"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
