package com.jobtrack.config;

import com.jobtrack.security.AuthContext;
import com.jobtrack.security.AuthenticatedUser;
import com.jobtrack.security.SupabaseJwtValidator;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private static final Set<String> PUBLIC_PATHS = Set.of("/api/health");

	private final SupabaseJwtValidator jwtValidator;

	public JwtAuthenticationFilter(SupabaseJwtValidator jwtValidator) {
		this.jwtValidator = jwtValidator;
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			return true;
		}
		return PUBLIC_PATHS.contains(normalizePath(request));
	}

	private static String normalizePath(HttpServletRequest request) {
		String path = request.getRequestURI();
		String contextPath = request.getContextPath();
		if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
			path = path.substring(contextPath.length());
		}
		return path.isEmpty() ? "/" : path;
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {

		String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (authorization == null || !authorization.startsWith("Bearer ")) {
			writeUnauthorized(response, "Missing or invalid Authorization header");
			return;
		}

		String token = authorization.substring("Bearer ".length()).trim();
		if (token.isEmpty()) {
			writeUnauthorized(response, "Missing or invalid Authorization header");
			return;
		}

		try {
			AuthenticatedUser user = jwtValidator.validateAndParse(token);
			request.setAttribute(AuthContext.USER_ID_ATTRIBUTE, user.userId());
			if (user.email() != null) {
				request.setAttribute(AuthContext.USER_EMAIL_ATTRIBUTE, user.email());
			}
			filterChain.doFilter(request, response);
		}
		catch (JwtException ex) {
			writeUnauthorized(response, ex.getMessage());
		}
	}

	private void writeUnauthorized(HttpServletResponse response, String message) throws IOException {
		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		String escaped = message
				.replace("\\", "\\\\")
				.replace("\"", "\\\"")
				.replace("\n", "\\n")
				.replace("\r", "\\r");
		response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"" + escaped + "\"}");
	}

}
