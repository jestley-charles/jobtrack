package com.jobtrack.dto;

import java.util.List;

public record ApiErrorResponse(
		String error,
		String message,
		List<FieldError> errors) {

	public record FieldError(String field, String message) {
	}

	public static ApiErrorResponse of(String error, String message) {
		return new ApiErrorResponse(error, message, null);
	}

	public static ApiErrorResponse withFieldErrors(String error, String message, List<FieldError> errors) {
		return new ApiErrorResponse(error, message, errors);
	}

}
