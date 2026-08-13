package com.jobtrack.controller;

import com.jobtrack.dto.ContactResponse;
import com.jobtrack.dto.CreateContactRequest;
import com.jobtrack.dto.UpdateContactRequest;
import com.jobtrack.security.AuthContext;
import com.jobtrack.service.ContactService;
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
@RequestMapping("/api/contacts")
public class ContactController {

	private final ContactService contactService;

	public ContactController(ContactService contactService) {
		this.contactService = contactService;
	}

	@GetMapping
	public List<ContactResponse> list(HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		return contactService.listForUser(userId);
	}

	@GetMapping("/{id}")
	public ContactResponse get(@PathVariable UUID id, HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		return contactService.getForUser(userId, id);
	}

	@PostMapping
	public ResponseEntity<ContactResponse> create(
			@Valid @RequestBody CreateContactRequest body,
			HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		ContactResponse created = contactService.create(userId, body);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@PutMapping("/{id}")
	public ContactResponse update(
			@PathVariable UUID id,
			@Valid @RequestBody UpdateContactRequest body,
			HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		return contactService.update(userId, id, body);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable UUID id, HttpServletRequest request) {
		UUID userId = AuthContext.getUserId(request);
		contactService.delete(userId, id);
		return ResponseEntity.noContent().build();
	}

}
