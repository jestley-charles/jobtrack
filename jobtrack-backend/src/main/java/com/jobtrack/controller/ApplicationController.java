package com.jobtrack.controller;

import com.jobtrack.dto.ApplicationResponse;
import com.jobtrack.dto.CreateApplicationRequest;
import com.jobtrack.dto.PatchApplicationStatusRequest;
import com.jobtrack.dto.UpdateApplicationRequest;
import com.jobtrack.security.AuthContext;
import com.jobtrack.service.ApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

	private final ApplicationService applicationService;

	public ApplicationController(ApplicationService applicationService) {
		this.applicationService = applicationService;
	}

	@GetMapping
	public List<ApplicationResponse> list(HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		return applicationService.listForUser(userId);
	}

	@GetMapping("/{id}")
	public ApplicationResponse get(@PathVariable UUID id, HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		return applicationService.getForUser(userId, id);
	}

	@PostMapping
	public ResponseEntity<ApplicationResponse> create(
			@Valid @RequestBody CreateApplicationRequest body,
			HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		ApplicationResponse created = applicationService.create(userId, body);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@PutMapping("/{id}")
	public ApplicationResponse update(
			@PathVariable UUID id,
			@Valid @RequestBody UpdateApplicationRequest body,
			HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		return applicationService.update(userId, id, body);
	}

	@PatchMapping("/{id}/status")
	public ApplicationResponse updateStatus(
			@PathVariable UUID id,
			@Valid @RequestBody PatchApplicationStatusRequest body,
			HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		return applicationService.updateStatus(userId, id, body.getStatus());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id, HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		applicationService.delete(userId, id);
		return ResponseEntity.noContent().build();
	}

}
