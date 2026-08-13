package com.jobtrack.controller;

import com.jobtrack.dto.CreateInterviewRequest;
import com.jobtrack.dto.InterviewResponse;
import com.jobtrack.dto.UpdateInterviewRequest;
import com.jobtrack.security.AuthContext;
import com.jobtrack.service.InterviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

	private final InterviewService interviewService;

	public InterviewController(InterviewService interviewService) {
		this.interviewService = interviewService;
	}

	@GetMapping
	public List<InterviewResponse> list(HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		return interviewService.listForUser(userId);
	}

	@GetMapping("/{id}")
	public InterviewResponse get(@PathVariable UUID id, HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		return interviewService.getForUser(userId, id);
	}

	@PostMapping
	public ResponseEntity<InterviewResponse> create(
			@Valid @RequestBody CreateInterviewRequest body,
			HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		InterviewResponse created = interviewService.create(userId, body);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@PutMapping("/{id}")
	public InterviewResponse update(
			@PathVariable UUID id,
			@Valid @RequestBody UpdateInterviewRequest body,
			HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		return interviewService.update(userId, id, body);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id, HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		interviewService.delete(userId, id);
		return ResponseEntity.noContent().build();
	}

}
