package com.jobtrack.controller;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

	private final ObjectProvider<DataSource> dataSourceProvider;

	public HealthController(ObjectProvider<DataSource> dataSourceProvider) {
		this.dataSourceProvider = dataSourceProvider;
	}

	@GetMapping("/health")
	public ResponseEntity<Map<String, String>> health() {
		DataSource dataSource = dataSourceProvider.getIfAvailable();
		if (dataSource == null) {
			return ResponseEntity.ok(Map.of("status", "ok"));
		}

		try (Connection connection = dataSource.getConnection()) {
			if (!connection.isValid(2)) {
				return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
						.body(Map.of("status", "unavailable"));
			}
			return ResponseEntity.ok(Map.of("status", "ok"));
		}
		catch (Exception ex) {
			return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
					.body(Map.of("status", "unavailable"));
		}
	}

}
