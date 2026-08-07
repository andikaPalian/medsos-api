import { Response } from "express";
import { ApiResponse, PaginatedResult } from "@core/types/common.types.js";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Operation successful",
  statusCode = 200,
): void => {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(payload);
};

export const sendCreated = <T>(
  res: Response,
  data: T,
  message = "Resource created successfully",
): void => {
  sendSuccess(res, data, message, 201);
};

export const sendPaginated = <T>(
  res: Response,
  result: PaginatedResult<T>,
  message = "Data retrieved successfully",
): void => {
  const payload: ApiResponse<PaginatedResult<T>> = {
    success: true,
    message,
    data: result,
  };
  res.status(200).json(payload);
};

export const sendEmptySuccess = (
  res: Response,
  message = "Operation successful",
  statusCode = 200,
): void => {
  const payload: ApiResponse<null> = {
    success: true,
    message,
    data: null,
  };
  res.status(statusCode).json(payload);
};
