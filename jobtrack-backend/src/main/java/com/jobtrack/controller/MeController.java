package com.jobtrack.controller;

import com.jobtrack.security.AuthContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Verifies JWT auth wiring. Controllers use {@link AuthContext#getUserId} for
 * user-scoped data — never accept user id from the client.
 */
@RestController
@RequestMapping("/api")
public class MeController {

	@GetMapping("/me")
	public ResponseEntity<Map<String, Object>> me(HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		String email = AuthContext.getUserEmail(request);

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("userId", userId.toString());
		if (email != null) {
			body.put("email", email);
		}
		return ResponseEntity.ok(body);
	}

}
