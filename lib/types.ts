/**
 * TypeScript type definitions for Naval Predictions App
 */

export type HealthStatus =
  | "OPTIMAL_CONDITION"
  | "NORMAL_WEAR"
  | "ATTENTION_REQUIRED"
  | "MAINTENANCE_DUE"
  | "CRITICAL_ALERT";

export type TrendDirection = "IMPROVING" | "STABLE" | "DEGRADING";

export type ShipName = "ALL" | "GAJABAHU" | "SAGARA" | "SAYURA" | "SHAKTHI" | "VIJAYABAHU";

export interface ShipDataInput {
  ship_name?: string;
  oil_hrs: number;
  total_hrs: number;
  viscosity_40: number;
  viscosity_100?: number;
  viscosity_index?: number;
  oil_refill_start: number; // 0 or 1
  oil_topup: number; // 0 or 1
  health_score_lag_1: number; // 0-1
  // Optional wear metals
  fe_ppm?: number;
  pb_ppm?: number;
  cu_ppm?: number;
  al_ppm?: number;
  si_ppm?: number;
  cr_ppm?: number;
  sn_ppm?: number;
  ni_ppm?: number;
  // Other properties
  tbn?: number;
  water_content?: string;
  flash_point?: number;
}

export interface MLPredictionResponse {
  raw_health_score: number;
  confidence: string;
  model_version: string;
  features_used: string[];
}

export interface GeminiAnalysis {
  final_score: number;
  status: HealthStatus;
  trend: TrendDirection;
  recommendation: string;
}

export interface PredictionResult {
  id?: number;
  timestamp: string;
  ship_name?: string;
  input_data: ShipDataInput;
  ml_raw_score: number;
  gemini_final_score: number;
  status: HealthStatus;
  trend: TrendDirection;
  recommendation: string;
  confidence: string;
}

export interface HistoricalDataPoint {
  id: number;
  timestamp: string;
  ship_name: string | null;
  oil_hrs: number;
  total_hrs: number;
  viscosity_40: number;
  viscosity_100: number | null;
  viscosity_index: number | null;
  oil_refill_start: number;
  oil_topup: number;
  health_score_lag_1: number;
  fe_ppm: number | null;
  pb_ppm: number | null;
  cu_ppm: number | null;
  al_ppm: number | null;
  si_ppm: number | null;
  cr_ppm: number | null;
  sn_ppm: number | null;
  ni_ppm: number | null;
  tbn: number | null;
  water_content: string | null;
  flash_point: number | null;
  ml_raw_score: number;
  gemini_final_score: number;
  status: HealthStatus;
  trend: TrendDirection;
  recommendation: string;
}

export interface DashboardStats {
  total_predictions: number;
  latest_score: number;
  latest_status: HealthStatus;
  average_score_7_days: number;
  trend_direction: TrendDirection;
  days_since_maintenance: number;
  critical_alerts_count: number;
}

export const STATUS_DESCRIPTIONS: Record<HealthStatus, string> = {
  OPTIMAL_CONDITION: "All systems operating within normal parameters",
  NORMAL_WEAR: "Expected wear patterns detected, continue routine maintenance",
  ATTENTION_REQUIRED: "Elevated wear indicators, schedule inspection within 30 days",
  MAINTENANCE_DUE: "Service required, plan maintenance within 2 weeks",
  CRITICAL_ALERT: "Immediate action required, potential component failure risk",
};

export const STATUS_COLORS: Record<HealthStatus, string> = {
  OPTIMAL_CONDITION: "text-green-600 bg-green-100",
  NORMAL_WEAR: "text-blue-600 bg-blue-100",
  ATTENTION_REQUIRED: "text-yellow-600 bg-yellow-100",
  MAINTENANCE_DUE: "text-orange-600 bg-orange-100",
  CRITICAL_ALERT: "text-red-600 bg-red-100",
};
