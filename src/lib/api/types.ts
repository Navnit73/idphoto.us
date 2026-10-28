/** Shape of every JSON response from /api routes. Shared by server and client. */
export type ApiSuccess<T> = { ok: true; data: T };

export type ApiErrorCode =
  | "bad_request"
  | "validation_failed"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "payload_too_large"
  | "unsupported_media_type"
  | "rate_limited"
  | "service_unavailable"
  | "internal_error"
  | "network_error";

export type ApiFailure = {
  ok: false;
  error: { code: ApiErrorCode; message: string; fields?: Record<string, string[]>; details?: Record<string, string> };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** POST /api/payments/create-order */
export type CreateOrderResult = {
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

/**
 * `conflict` details from create-order: `reason` is "price_changed" (with the
 * `currency` the server will charge) or "already_paid" (with `paidPaymentId`).
 */
export type CreateOrderConflict = { reason?: "price_changed" | "already_paid"; currency?: string; paidPaymentId?: string };

/** POST /api/payments/verify */
export type VerifyPaymentResult = { paymentId: string; status: "paid"; downloadToken?: string; invoiceNumber?: string };

/** GET /api/payments/status/<paymentId>, polled by the thank-you page */
export type PaymentStatusResult = {
  paymentId: string;
  status: "pending" | "authorized" | "paid" | "failed" | "refunded" | "cancelled";
  amount: number;
  currency: string;
  planType: "standard" | "expert_edit";
  fulfillmentStatus: "pending" | "processing" | "completed" | "failed";
  emailStatus: "pending" | "sending" | "sent" | "failed";
  downloadToken?: string;
  invoiceNumber?: string;
  paidAt?: string;
};

/** POST /api/photo/process */
export type PhotoProcessResult = { resultId: string };

type NumericRange = { min?: number | null; max?: number | null; recommended?: number | null };
type PixelSize = { width: number; height: number };

/**
 * POST /api/photo/requirements: a country's photo rules, passed through from
 * PixPassport `GET /countries/{code}` (schema_version 1.0). Every rule is
 * optional; the photo checker only checks the ones a country publishes.
 */
export type PhotoRequirements = {
  schema_version?: string;
  country: { name: string; code: string };
  document_type: string;
  photo_spec?: {
    width_in?: number | null;
    height_in?: number | null;
    width_mm?: number | null;
    height_mm?: number | null;
    aspect_ratio?: number | null;
    print_dpi?: number | null;
  } | null;
  digital_requirements?: {
    required_resolution_px?: PixelSize | null;
    min_resolution_px?: PixelSize | null;
    max_resolution_px?: PixelSize | null;
    max_file_size_kb?: number | null;
    format?: string[] | null;
    background_color?: string | null;
  } | null;
  face_constraints?: {
    head_height_pct?: NumericRange | null;
    eye_position?: { from_bottom_pct?: NumericRange | null } | null;
    top_margin_pct?: NumericRange | null;
    chin_to_bottom_pct?: NumericRange | null;
  } | null;
  pose_rules?: {
    head_tilt_allowed?: boolean | null;
    expression?: string | null;
    eyes_open?: boolean | null;
    mouth_closed?: boolean | null;
    both_ears_visible?: boolean | null;
  } | null;
  background_rules?: {
    color?: string | null;
    shadows_allowed?: boolean | null;
    texture_allowed?: boolean | null;
  } | null;
  auto_crop_config?: {
    head_top_multiplier?: number | null;
    eye_line_target_pct?: number | null;
    safe_padding_pct?: number | null;
  } | null;
};
