package com.jobtrack.dto;

import com.jobtrack.model.Application;
import com.jobtrack.model.ApplicationStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ApplicationResponse(
		UUID id,
		UUID userId,
		String company,
		String position,
		String location,
		Integer salaryMin,
		Integer salaryMax,
		ApplicationStatus status,
		LocalDate dateApplied,
		String jobUrl,
		Instant createdAt,
		Instant updatedAt) {

	public static ApplicationResponse from(Application application) {
		return new ApplicationResponse(
				application.getId(),
				application.getUserId(),
				application.getCompany(),
				application.getPosition(),
				application.getLocation(),
				application.getSalaryMin(),
				application.getSalaryMax(),
				application.getStatus(),
				application.getDateApplied(),
				application.getJobUrl(),
				application.getCreatedAt(),
				application.getUpdatedAt());
	}

}
