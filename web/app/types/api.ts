// Backend (NestJS) javoblari uchun turlar

export type Role = 'user' | 'moderator' | 'admin'

export interface Paginated<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface MessageResponse {
  message: string
  success?: boolean
}

// ==================== AUTH ====================

export interface AuthTokens {
  access_token: string
  refresh_token: string
}

export interface LoginResponse extends AuthTokens {
  user: { id: string, username: string, fullName: string | null, role: Role }
}

export interface Me {
  id: string
  username: string
  fullName: string | null
  email: string
  role: Role
  score: number
  createdAt: string
  team: { id: string, name: string, score: number } | null
}

export interface LoginHistoryItem {
  id: string
  ipAddress: string
  location: string | null
  status: 'success' | 'failed'
  createdAt: string
}

// ==================== MUSOBAQA ====================

export type TournamentState = 'running' | 'paused' | 'not_started' | 'finished'

export interface TournamentStatus {
  state: TournamentState
  isLive: boolean
  globalStartTime: string | null
  globalEndTime: string | null
  maxTeamSize: number
  serverTime: string
}

export interface TeamMember {
  id: string
  username: string
  fullName?: string | null
}

export interface TeamSolve {
  id: string
  pointsAwarded: number
  submittedAt: string
  challenge: { id: string, title: string, category: string }
  user: { id: string, username: string }
}

export interface MyTeam {
  id: string
  name: string
  score: number
  isBanned: boolean
  inviteCode: string
  captainId: string | null
  createdAt: string
  members: TeamMember[]
  challengeGroups: { id: string, name: string }[]
  maxTeamSize: number
  isCaptain: boolean
  solves: TeamSolve[]
}

export interface ChallengeGroupItem {
  id: string
  name: string
  challengeCount: number
  teamCount: number
  joined: boolean
}

export interface Challenge {
  id: string
  title: string
  description: string
  points: number
  category: string
  attachmentPath: string | null
  startTime: string | null
  endTime: string | null
  group: { id: string, name: string } | null
  solveCount: number
  solved: boolean
  groupJoined: boolean
  isClosed: boolean
}

export interface ChallengeDetail extends Challenge {
  firstSolvers: { team: { id: string, name: string }, solvedAt: string }[]
}

export interface SubmitResult {
  success: boolean
  message: string
  pointsAwarded?: number
  alreadySolved?: boolean
}

export interface ScoreboardRow {
  rank: number
  id: string
  name: string
  score: number
  solves: number
  lastSolveAt: string | null
  members: TeamMember[]
}

export interface TimelineSeries {
  id: string
  name: string
  points: { at: string, score: number }[]
}

// ==================== MASALALAR ====================

export interface ProblemListItem {
  id: string
  code: string
  title: string
  difficulty: number
  category: string
  rating: number
  points: number
  solvedCount: number
  totalTries: number
  successRate: number
  isSolved: boolean
  isAttempted: boolean
}

export interface ProblemDetail extends Omit<ProblemListItem, 'isAttempted'> {
  description: string
  createdAt: string
  updatedAt: string
  myAttempts: number
}

export interface ProblemAttempt {
  id: string
  status: string
  isCorrect: boolean
  submittedAt: string
}

export interface ProblemCategory {
  category: string
  count: number
}

export interface UserLeaderboardRow {
  rank: number
  id: string
  username: string
  fullName: string | null
  score: number
  solved: number
}

// ==================== YANGILIKLAR ====================

export interface News {
  id: string
  title: string
  content: string
  createdAt: string
  author: { id: string, username: string, fullName: string | null } | null
}

// ==================== ADMIN ====================

export interface AdminStats {
  counts: {
    users: number
    bannedUsers: number
    teams: number
    groups: number
    challenges: number
    problems: number
    news: number
  }
  submissions: {
    total: number
    correct: number
    last24h: number
    problemSubmissions: number
    successRate: number
  }
  categories: { category: string, count: number }[]
  recentSolves: {
    id: string
    submittedAt: string
    pointsAwarded: number
    user: { id: string, username: string } | null
    team: { id: string, name: string } | null
    challenge: { id: string, title: string } | null
  }[]
}

export interface AdminUser {
  id: string
  fullName: string | null
  email: string
  username: string
  role: Role
  score: number
  isActive: boolean
  isBanned: boolean
  isDelete: boolean
  createdAt: string
  team: { id: string, name: string } | null
}

export interface AdminUserDetail extends AdminUser {
  updatedAt: string
  team: { id: string, name: string, score: number } | null
  loginHistory: LoginHistoryItem[]
  submissions: { id: string, isCorrect: boolean, pointsAwarded: number, submittedAt: string, challenge: { id: string, title: string } | null }[]
  problemsSolved: number
}

export interface AdminGroup {
  id: string
  name: string
  challenges: { id: string, title: string, category: string, points: number }[]
  teams: { id: string, name: string }[]
  teamCount: number
}

export interface AdminChallenge {
  id: string
  title: string
  description: string
  points: number
  initialPoints: number
  minPoints: number
  decrementStep: number
  category: string
  attachmentPath: string | null
  startTime: string | null
  endTime: string | null
  allowedIpRange: string
  group: { id: string, name: string } | null
  createdAt: string
  updatedAt: string
  solves?: number
  attempts?: number
}

export interface AdminTeam {
  id: string
  name: string
  score: number
  isBanned: boolean
  inviteCode: string
  createdAt: string
  members: TeamMember[]
  captain: { id: string, username: string } | null
  challengeGroups: { id: string, name: string }[]
  solves: number
}

export interface AdminSubmission {
  id: string
  isCorrect: boolean
  pointsAwarded: number
  submittedAt: string
  user: { id: string, username: string } | null
  team: { id: string, name: string } | null
  challenge: { id: string, title: string, points: number } | null
}

export interface AdminProblem {
  id: string
  code: string
  title: string
  description: string
  difficulty: number
  category: string
  rating: number
  points: number
  solvedCount: number
  totalTries: number
  createdAt: string
  updatedAt: string
}

export interface TournamentSettings {
  id: string
  isLive: boolean
  globalStartTime: string | null
  globalEndTime: string | null
  updatedAt: string
}

export interface FolderItem {
  id: string
  name: string
  parentId: string | null
  createdAt: string
}

export interface FileItem {
  id: string
  originalName: string
  fileName: string
  filePath: string
  mimetype: string
  size: number
  url: string
  folderId: string | null
  createdAt: string
  existsOnDisk: boolean
  warning: string | null
}

export interface FolderContents {
  folders: FolderItem[]
  files: FileItem[]
  breadcrumbs: { id: string, name: string }[]
}
