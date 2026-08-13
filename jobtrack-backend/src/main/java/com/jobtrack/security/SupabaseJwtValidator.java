package com.jobtrack.security;

import com.jobtrack.config.SupabaseJwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwsHeader;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.UUID;

@Component
public class SupabaseJwtValidator {

	private static final String AUTHENTICATED_ROLE = "authenticated";
	private static final String HS256 = "HS256";

	private final SecretKey legacySigningKey;
	private final SupabaseJwksProvider jwksProvider;

	public SupabaseJwtValidator(SupabaseJwtProperties properties, SupabaseJwksProvider jwksProvider) {
		this.jwksProvider = jwksProvider;
		String secret = properties.getSecret();
		if (secret != null && !secret.isBlank()) {
			this.legacySigningKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		}
		else {
			this.legacySigningKey = null;
		}
		if (legacySigningKey == null && !jwksProvider.isEnabled()) {
			throw new IllegalStateException(
					"Configure SUPABASE_URL (for JWKS) and/or SUPABASE_JWT_SECRET (legacy HS256) for JWT validation");
		}
	}

	public AuthenticatedUser validateAndParse(String token) {
		try {
			Claims claims = Jwts.parser()
					.keyLocator(this::locateVerificationKey)
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

	private Key locateVerificationKey(io.jsonwebtoken.Header header) {
		String algorithm = header.getAlgorithm();
		if (HS256.equals(algorithm)) {
			if (legacySigningKey == null) {
				throw new JwtException("HS256 token but legacy JWT secret is not configured");
			}
			return legacySigningKey;
		}
		if (!(header instanceof JwsHeader jwsHeader)) {
			throw new JwtException("Expected signed JWT header");
		}
		return jwksProvider.resolve(jwsHeader.getKeyId(), algorithm);
	}

}
