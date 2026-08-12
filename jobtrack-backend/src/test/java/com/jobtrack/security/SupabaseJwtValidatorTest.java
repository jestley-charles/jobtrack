package com.jobtrack.security;

import com.jobtrack.config.SupabaseJwtProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SupabaseJwtValidatorTest {

	private static final String SECRET = "test-jwt-secret-must-be-at-least-32-bytes-long";
	private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

	private SupabaseJwtValidator validator;

	@BeforeEach
	void setUp() {
		SupabaseJwtProperties properties = new SupabaseJwtProperties();
		properties.setSecret(SECRET);
		validator = new SupabaseJwtValidator(properties);
	}

	@Test
	void validateAndParse_acceptsValidSupabaseStyleToken() {
		String token = buildToken(USER_ID, "user@example.com", "authenticated", hoursFromNow(1));

		AuthenticatedUser user = validator.validateAndParse(token);

		assertEquals(USER_ID, user.userId());
		assertEquals("user@example.com", user.email());
	}

	@Test
	void validateAndParse_rejectsExpiredToken() {
		String token = buildToken(USER_ID, "user@example.com", "authenticated", hoursFromNow(-1));

		assertThrows(Exception.class, () -> validator.validateAndParse(token));
	}

	@Test
	void validateAndParse_rejectsNonAuthenticatedRole() {
		String token = buildToken(USER_ID, "user@example.com", "anon", hoursFromNow(1));

		assertThrows(Exception.class, () -> validator.validateAndParse(token));
	}

	private static String buildToken(UUID userId, String email, String role, Date expiration) {
		SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
		return Jwts.builder()
				.subject(userId.toString())
				.claim("email", email)
				.claim("role", role)
				.issuedAt(new Date())
				.expiration(expiration)
				.signWith(key)
				.compact();
	}

	private static Date hoursFromNow(int hours) {
		return new Date(System.currentTimeMillis() + (hours * 3_600_000L));
	}

}
