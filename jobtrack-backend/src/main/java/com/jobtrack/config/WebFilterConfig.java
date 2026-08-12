package com.jobtrack.config;

import com.jobtrack.security.SupabaseJwtValidator;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(SupabaseJwtProperties.class)
public class WebFilterConfig {

	@Bean
	public JwtAuthenticationFilter jwtAuthenticationFilter(SupabaseJwtValidator jwtValidator) {
		return new JwtAuthenticationFilter(jwtValidator);
	}

	@Bean
	public FilterRegistrationBean<JwtAuthenticationFilter> jwtAuthenticationFilterRegistration(
			JwtAuthenticationFilter filter) {
		FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>();
		registration.setFilter(filter);
		registration.addUrlPatterns("/api/*");
		registration.setOrder(1);
		return registration;
	}

}
