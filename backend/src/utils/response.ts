import { Response } from 'express';

// =====================================================
// Consistent API response helpers
// =====================================================

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginatedSuccessResponse<T = unknown> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  options?: { message?: string; statusCode?: number }
): void {
  res.status(options?.statusCode ?? 200).json({
    success: true,
    data,
    ...(options?.message ? { message: options.message } : {}),
  } satisfies SuccessResponse<T>);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number }
): void {
  res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  } satisfies PaginatedSuccessResponse<T>);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  } satisfies ErrorResponse);
}
