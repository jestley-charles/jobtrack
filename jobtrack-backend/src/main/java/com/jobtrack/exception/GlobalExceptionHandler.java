package com.jobtrack.exception;

import com.jobtrack.dto.ApiErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
		List<ApiErrorResponse.FieldError> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
				.map(error -> new ApiErrorResponse.FieldError(error.getField(), error.getDefaultMessage()))
				.toList();

		ApiErrorResponse body = ApiErrorResponse.withFieldErrors(
				"Bad Request",
				"Validation failed",
				fieldErrors);

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiErrorResponse> handleUnreadableBody(HttpMessageNotReadableException ex) {
		ApiErrorResponse body = ApiErrorResponse.of(
				"Bad Request",
				"Request body is malformed or unreadable");

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
	}

	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
		String parameter = ex.getName();
		String message = "Invalid value for parameter '" + parameter + "'";

		ApiErrorResponse body = ApiErrorResponse.of("Bad Request", message);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<ApiErrorResponse> handleResponseStatus(ResponseStatusException ex) {
		HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
		if (status == null) {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
		}

		String message = ex.getReason() != null ? ex.getReason() : status.getReasonPhrase();
		ApiErrorResponse body = ApiErrorResponse.of(status.getReasonPhrase(), message);

		return ResponseEntity.status(status).body(body);
	}

	@ExceptionHandler(IllegalStateException.class)
	public ResponseEntity<ApiErrorResponse> handleIllegalState(IllegalStateException ex) {
		if ("No authenticated user on this request".equals(ex.getMessage())) {
			ApiErrorResponse body = ApiErrorResponse.of("Unauthorized", ex.getMessage());
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
		}

		log.error("Illegal state", ex);
		ApiErrorResponse body = ApiErrorResponse.of(
				"Internal Server Error",
				"An unexpected error occurred");
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception ex) {
		log.error("Unhandled exception", ex);
		ApiErrorResponse body = ApiErrorResponse.of(
				"Internal Server Error",
				"An unexpected error occurred");
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
	}

}
