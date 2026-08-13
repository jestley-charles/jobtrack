package com.jobtrack.security;

import com.jobtrack.config.SupabaseJwtProperties;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Jwks;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.Key;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Fetches and caches Supabase Auth public signing keys (JWKS) for ES256/RS256 JWT verification.
 */
@Component
public class SupabaseJwksProvider {

	private static final Duration CACHE_TTL = Duration.ofMinutes(10);

	private final String jwksUrl;
	private final HttpClient httpClient;

	private volatile Map<String, Key> keysById = Map.of();
	private volatile Instant fetchedAt = Instant.EPOCH;

	public SupabaseJwksProvider(SupabaseJwtProperties properties) {
		String url = properties.getUrl();
		if (url == null || url.isBlank()) {
			this.jwksUrl = null;
		}
		else {
			this.jwksUrl = url.replaceAll("/$", "") + "/auth/v1/.well-known/jwks.json";
		}
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(10))
				.build();
	}

	public boolean isEnabled() {
		return jwksUrl != null;
	}

	public Key resolve(String keyId, String algorithm) {
		if (!isEnabled()) {
			throw new JwtException("Asymmetric JWT (" + algorithm + ") but SUPABASE_URL is not configured");
		}
		ensureFresh();
		Key key = keysById.get(keyId);
		if (key == null) {
			refresh();
			key = keysById.get(keyId);
		}
		if (key == null) {
			throw new JwtException("Unknown JWT signing key: " + keyId);
		}
		return key;
	}

	private void ensureFresh() {
		if (keysById.isEmpty() || Duration.between(fetchedAt, Instant.now()).compareTo(CACHE_TTL) > 0) {
			refresh();
		}
	}

	private synchronized void refresh() {
		if (!keysById.isEmpty() && Duration.between(fetchedAt, Instant.now()).compareTo(CACHE_TTL) <= 0) {
			return;
		}
		try {
			HttpRequest request = HttpRequest.newBuilder()
					.uri(URI.create(jwksUrl))
					.timeout(Duration.ofSeconds(15))
					.GET()
					.build();
			HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
			if (response.statusCode() != 200) {
				throw new JwtException("Failed to fetch JWKS (HTTP " + response.statusCode() + ")");
			}
			Map<String, Key> parsed = new HashMap<>();
			Jwks.setParser().build().parse(response.body()).getKeys().forEach(jwk -> {
				String kid = jwk.getId();
				if (kid != null) {
					parsed.put(kid, jwk.toKey());
				}
			});
			if (parsed.isEmpty()) {
				throw new JwtException("JWKS endpoint returned no keys");
			}
			keysById = Map.copyOf(parsed);
			fetchedAt = Instant.now();
		}
		catch (InterruptedException ex) {
			Thread.currentThread().interrupt();
			throw new JwtException("Could not fetch Supabase JWKS", ex);
		}
		catch (IOException ex) {
			throw new JwtException("Could not fetch Supabase JWKS", ex);
		}
		catch (JwtException ex) {
			throw ex;
		}
		catch (Exception ex) {
			throw new JwtException("Could not parse Supabase JWKS", ex);
		}
	}

}
