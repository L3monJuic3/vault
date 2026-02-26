// Stubbed shared types — generated from FastAPI OpenAPI schema
// These match the Pydantic schemas in apps/api/app/schemas/

export interface UserRead {
  id: string;
  email: string;
  name: string;
  currency: string;
  created_at: string;
}

export interface TransactionRead {
  id: string;
  account_id: string;
  date: string;
  description: string;
  amount: number;
  balance_after: number | null;
  category_id: string | null;
  subcategory: string | null;
  merchant_name: string | null;
  is_recurring: boolean;
  recurring_group_id: string | null;
  notes: string | null;
  tags: string[];
  ai_confidence: number | null;
  import_id: string | null;
  created_at: string;
}

export interface TransactionUpdate {
  category_id?: string | null;
  subcategory?: string | null;
  merchant_name?: string | null;
  notes?: string | null;
  tags?: string[];
  is_recurring?: boolean;
}

export interface TransactionFilter {
  date_from?: string;
  date_to?: string;
  category_id?: string;
  account_id?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
}

export interface CursorPage<T = TransactionRead> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface CategoryRead {
  id: string;
  user_id: string | null;
  name: string;
  icon: string | null;
  colour: string | null;
  parent_id: string | null;
  budget_monthly: number | null;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
  icon?: string;
  colour?: string;
  parent_id?: string;
  budget_monthly?: number;
}

export interface CategoryUpdate {
  name?: string;
  icon?: string;
  colour?: string;
  parent_id?: string;
  budget_monthly?: number;
}

export interface RecurringGroupRead {
  id: string;
  user_id: string;
  name: string;
  type: "subscription" | "direct_debit" | "standing_order" | "salary";
  frequency: "weekly" | "monthly" | "quarterly" | "annual";
  estimated_amount: number;
  status: "active" | "cancelled" | "paused" | "uncertain";
  category_id: string | null;
  merchant_name: string | null;
  next_expected_date: string | null;
  cancel_url: string | null;
  cancel_steps: string | null;
  created_at: string;
}

export interface RecurringGroupUpdate {
  name?: string;
  status?: "active" | "cancelled" | "paused" | "uncertain";
  category_id?: string;
  estimated_amount?: number;
  next_expected_date?: string;
  cancel_url?: string;
  cancel_steps?: string;
}

export interface SubscriptionListResponse {
  items: RecurringGroupRead[];
  monthly_total: number;
}

export interface AccountRead {
  id: string;
  user_id: string;
  name: string;
  type: "current" | "savings" | "credit_card" | "investment" | "loan" | "mortgage" | "pension";
  provider: string;
  currency: string;
  current_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface BulkCategoryRequest {
  transaction_ids: string[];
  category_id: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

export interface ErrorResponse {
  detail: string;
  code: string;
}

// Dashboard analytics types (for KPI cards, charts)
export interface DashboardStats {
  total_balance: number;
  monthly_income: number;
  monthly_spending: number;
  subscription_total: number;
  transaction_count: number;
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  icon: string | null;
  colour: string | null;
  total: number;
  percentage: number;
  transaction_count: number;
}

export interface SpendTimelinePoint {
  date: string;
  income: number;
  spending: number;
  net: number;
}

export interface TopMerchant {
  merchant_name: string;
  total: number;
  transaction_count: number;
  category_name: string | null;
}
