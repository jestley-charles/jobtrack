package com.jobtrack.security;

import com.jobtrack.config.SupabaseJwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
public class SupabaseJwtValidator {

	private static final String AUTHENTICATED_ROLE = "authenticated";

	private final SecretKey signingKey;

	public SupabaseJwtValidator(SupabaseJwtProperties properties) {
		if (properties.getSecret() == null || properties.getSecret().isBlank()) {
			throw new IllegalStateException("SUPABASE_JWT_SECRET must be set for JWT validation");
		}
		byte[] keyBytes = properties.getSecret().getBytes(StandardCharsets.UTF_8);
		this.signingKey = Keys.hmacShaKeyFor(keyBytes);
	}

	public AuthenticatedUser validateAndParse(String token) {
		try {
			Claims claims = Jwts.parser()
					.verifyWith(signingKey)
					.build()
					.parseSignedClaims(token)
					.getPayload();

			String role = claims.get("role", String.class);
			if (!AUTHENTICATED_ROLE.equals(role)) {
				throw new JwtException("Token role is not authenticated");
			}

			String subject = claims.getSubject();
			if (subject == null || subject.isBlank()) {
				throw new JwtException("Token is missing subject");
			}

			UUID userId;
			try {
				userId = UUID.fromString(subject);
			}
			catch (IllegalArgumentException ex) {
				throw new JwtException("Token subject is not a valid user id");
			}

			return new AuthenticatedUser(userId, claims.get("email", String.class));
		}
		catch (ExpiredJwtException ex) {
			throw new JwtException("Token has expired", ex);
		}
		catch (JwtException ex) {
			throw ex;
		}
		catch (Exception ex) {
			throw new JwtException("Invalid token", ex);
		}
	}

}
