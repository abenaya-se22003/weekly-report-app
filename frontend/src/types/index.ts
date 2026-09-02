export type Role = 'TEAM_MEMBER' | 'MANAGER';

export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';

export type ReviewAction = 'APPROVED' | 'REQUEST_CHANGES';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'DEFERRED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count?: {
    reports: number;
  };
}

export interface TaskEntry {
  id?: string;
  reportVersionId?: string;
  taskName: string;
  priority: TaskPriority;
  plannedPercent: number;
  actualPercent: number;
  status: TaskStatus;
  timePlanned: number;
  timeSpent: number;
  deliverable: string | null;
}

export interface HoursBreakdown {
  development: number;
  meetings: number;
  codeReview: number;
  documentation: number;
  learning: number;
}

export interface ReportContent {
  blockers?: string;
  isBlockerKeyIssue?: boolean;
  achievements?: string;
  isAchievementKey?: boolean;
  tasksPlannedNextWeek?: string;
  notes?: string;
  hoursBreakdown?: HoursBreakdown;
  [key: string]: any;
}

export interface ReportReview {
  id: string;
  reportId: string;
  reviewerId: string;
  action: ReviewAction;
  comment: string;
  reportVersionId: string;
  createdAt: string;
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ReportVersion {
  id: string;
  reportId: string;
  versionNum: number;
  content: ReportContent;
  submittedAt: string;
  tasks: TaskEntry[];
  reviews?: ReportReview[];
}

export interface Report {
  id: string;
  userId: string;
  projectId: string;
  weekStartDate: string;
  weekEndDate: string;
  status: ReportStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  project?: Project;
  versions?: ReportVersion[];
  reviews?: ReportReview[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardSummary {
  totalTeamMembers: number;
  totalActiveProjects: number;
  submittedThisWeek: number;
  complianceRate: number;
  needsCorrectionCount: number;
  draftCount: number;
  submittedCount: number;
  approvedCount: number;
  openBlockersCount: number;
  blockedTasksCount: number;
}

export interface StatusByTeamMember {
  userId: string;
  name: string;
  email: string;
  DRAFT: number;
  SUBMITTED: number;
  NEEDS_CORRECTION: number;
  APPROVED: number;
  total: number;
}

export interface WorkloadByProject {
  projectId: string;
  projectName: string;
  isActive: boolean;
  reportsCount: number;
  totalTasks: number;
  completedTasks: number;
  totalHoursPlanned: number;
  totalHoursSpent: number;
}

export interface TasksTrendWeek {
  week: string;
  completed: number;
  inProgress: number;
  blocked: number;
  notStarted: number;
  total: number;
}

export interface DashboardCharts {
  statusByTeamMember: StatusByTeamMember[];
  workloadByProject: WorkloadByProject[];
  tasksTrend: TasksTrendWeek[];
  timeByTaskType: HoursBreakdown;
}
