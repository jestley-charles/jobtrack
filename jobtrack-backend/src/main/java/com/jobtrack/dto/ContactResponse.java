package com.jobtrack.dto;

import com.jobtrack.model.Contact;

import java.time.Instant;
import java.util.UUID;

public record ContactResponse(
		UUID id,
		UUID userId,
		String name,
		String company,
		String role,
		String email,
		String linkedinUrl,
		String notes,
		Instant createdAt,
		Instant updatedAt) {

	public static ContactResponse from(Contact contact) {
		return new ContactResponse(
				contact.getId(),
				contact.getUserId(),
				contact.getName(),
				contact.getCompany(),
				contact.getRole(),
				contact.getEmail(),
				contact.getLinkedinUrl(),
				contact.getNotes(),
				contact.getCreatedAt(),
				contact.getUpdatedAt());
	}

}
