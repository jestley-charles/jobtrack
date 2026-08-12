package com.jobtrack.config;

import com.jobtrack.config.SupabaseJwtProperties;
import com.jobtrack.security.SupabaseJwtValidator;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtAuthenticationFilterTest {

	private static final String SECRET = "test-jwt-secret-must-be-at-least-32-bytes-long";
	private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

	private JwtAuthenticationFilter filter;

	@BeforeEach
	void setUp() {
		SupabaseJwtProperties properties = new SupabaseJwtProperties();
		properties.setSecret(SECRET);
		filter = new JwtAuthenticationFilter(new SupabaseJwtValidator(properties));
	}

	@Test
	void allowsPublicHealthEndpoint() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/health");
		MockHttpServletResponse response = new MockHttpServletResponse();
		AtomicBoolean chainCalled = new AtomicBoolean(false);
		FilterChain chain = (req, res) -> chainCalled.set(true);

		filter.doFilter(request, response, chain);

		assertTrue(chainCalled.get());
		assertEquals(200, response.getStatus());
	}

	@Test
	void rejectsMissingBearerToken() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/me");
		MockHttpServletResponse response = new MockHttpServletResponse();
		AtomicBoolean chainCalled = new AtomicBoolean(false);
		FilterChain chain = (req, res) -> chainCalled.set(true);

		filter.doFilter(request, response, chain);

		assertFalse(chainCalled.get());
		assertEquals(401, response.getStatus());
		assertTrue(response.getContentAsString().contains("Unauthorized"));
	}

	@Test
	void attachesUserIdForValidToken() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/me");
		request.addHeader("Authorization", "Bearer " + validToken());
		MockHttpServletResponse response = new MockHttpServletResponse();
		AtomicBoolean chainCalled = new AtomicBoolean(false);
		FilterChain chain = (req, res) -> {
			chainCalled.set(true);
			assertEquals(USER_ID, req.getAttribute("jobtrack.userId"));
		};

		filter.doFilter(request, response, chain);

		assertTrue(chainCalled.get());
		assertEquals(200, response.getStatus());
	}

	private static String validToken() {
		SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
		return Jwts.builder()
				.subject(USER_ID.toString())
				.claim("email", "user@example.com")
				.claim("role", "authenticated")
				.issuedAt(new Date())
				.expiration(new Date(System.currentTimeMillis() + 3_600_000))
				.signWith(key)
				.compact();
	}

}
