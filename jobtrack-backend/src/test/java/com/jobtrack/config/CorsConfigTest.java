package com.jobtrack.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class CorsConfigTest {

	private CorsFilter corsFilter;

	@BeforeEach
	void setUp() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOriginPatterns(List.of(
				"http://localhost:*",
				"http://127.0.0.1:*",
				"https://*.web.app",
				"https://*.firebaseapp.com"));
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", config);
		corsFilter = new CorsFilter(source);
	}

	@Test
	void preflightForFirebaseHostingIncludesCorsHeaders() throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/applications");
		request.addHeader("Origin", "https://jobtrack-10841.web.app");
		request.addHeader("Access-Control-Request-Method", "GET");
		request.addHeader("Access-Control-Request-Headers", "authorization,content-type");

		MockHttpServletResponse response = new MockHttpServletResponse();
		FilterChain chain = (req, res) -> {
		};

		corsFilter.doFilter(request, response, chain);

		assertEquals(200, response.getStatus());
		assertEquals("https://jobtrack-10841.web.app", response.getHeader("Access-Control-Allow-Origin"));
		assertNotNull(response.getHeader("Access-Control-Allow-Methods"));
	}

}
