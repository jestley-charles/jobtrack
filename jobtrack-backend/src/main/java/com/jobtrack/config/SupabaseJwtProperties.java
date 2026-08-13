package com.jobtrack.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "supabase")
public class SupabaseJwtProperties {

	/**
	 * Project URL, e.g. https://your-ref.supabase.co — used to fetch JWKS for ES256 tokens.
	 */
	private String url;

	private Jwt jwt = new Jwt();

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public String getSecret() {
		return jwt.getSecret();
	}

	public void setSecret(String secret) {
		jwt.setSecret(secret);
	}

	public static class Jwt {

		private String secret;

		public String getSecret() {
			return secret;
		}

		public void setSecret(String secret) {
			this.secret = secret;
		}

	}

}
