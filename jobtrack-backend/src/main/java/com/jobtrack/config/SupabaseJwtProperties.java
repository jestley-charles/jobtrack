package com.jobtrack.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "supabase")
public class SupabaseJwtProperties {

	/**
	 * Project URL, e.g. https://your-ref.supabase.co — used to fetch JWKS for ES256 tokens.
	 */
	private String url;

	/**
	 * Legacy HS256 JWT secret. Bound from {@code supabase.jwt-secret} in
	 * {@code application.properties} (Spring relaxed binding).
	 */
	private String jwtSecret;

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public String getJwtSecret() {
		return jwtSecret;
	}

	public void setJwtSecret(String jwtSecret) {
		this.jwtSecret = jwtSecret;
	}

	/** Alias used by {@link com.jobtrack.security.SupabaseJwtValidator}. */
	public String getSecret() {
		return jwtSecret;
	}

	public void setSecret(String secret) {
		this.jwtSecret = secret;
	}

}
