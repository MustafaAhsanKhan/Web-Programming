// ─── User Types ─────────────────────────────────────────
export type UserRole = "admin" | "agent";

export interface IUserClient {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// ─── Lead Types ─────────────────────────────────────────
export type LeadStatus = "New" | "Contacted" | "In Progress" | "Closed";
export type LeadSource =
  | "facebook"
  | "website"
  | "walk-in"
  | "referral"
  | "other";
export type LeadPriority = "High" | "Medium" | "Low";

export interface ILeadClient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  propertyInterest: string;
  budget: number;
  status: LeadStatus;
  notes: string;
  assignedTo?: IUserClient | string;
  score: number;
  followUpDate?: string;
  lastActivity: string;
  source?: LeadSource;
  createdAt: string;
  updatedAt: string;
}

// ─── Activity Types ─────────────────────────────────────
export interface IActivityClient {
  _id: string;
  lead: string;
  action: string;
  performedBy: IUserClient | string;
  details: string;
  createdAt: string;
}

// ─── API Response Types ─────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Analytics Types ────────────────────────────────────
export interface DashboardStats {
  totalLeads: number;
  leadsByStatus: { status: LeadStatus; count: number }[];
  leadsByPriority: { priority: LeadPriority; count: number }[];
  leadsBySource: { source: LeadSource; count: number }[];
  agentPerformance: {
    agent: IUserClient;
    totalAssigned: number;
    closed: number;
    conversionRate: number;
  }[];
  overdueFollowUps: number;
  staleLeads: number;
}
