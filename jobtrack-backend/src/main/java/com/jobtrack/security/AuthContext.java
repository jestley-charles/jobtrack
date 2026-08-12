package com.jobtrack.security;

import jakarta.servlet.http.HttpServletRequest;

import java.util.UUID;

/**
 * Authenticated user data attached to the request by {@link com.jobtrack.config.JwtAuthenticationFilter}.
 */
public final class AuthContext {

	public static final String USER_ID_ATTRIBUTE = "jobtrack.userId";
	public static final String USER_EMAIL_ATTRIBUTE = "jobtrack.userEmail";

	private AuthContext() {
	}

	public static UUID getUserId(HttpServletRequest request) {
		Object value = request.getAttribute(USER_ID_ATTRIBUTE);
		if (value instanceof UUID userId) {
			return userId;
		}
		throw new IllegalStateException("No authenticated user on this request");
	}

	public static String getUserEmail(HttpServletRequest request) {
		Object value = request.getAttribute(USER_EMAIL_ATTRIBUTE);
		return value instanceof String email ? email : null;
	}

}
