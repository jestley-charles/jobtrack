package com.jobtrack.service;

import com.jobtrack.dto.ApplicationResponse;
import com.jobtrack.dto.CreateApplicationRequest;
import com.jobtrack.dto.UpdateApplicationRequest;
import com.jobtrack.model.Application;
import com.jobtrack.model.ApplicationStatus;
import com.jobtrack.repository.ApplicationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ApplicationService {

	private final ApplicationRepository applicationRepository;

	public ApplicationService(ApplicationRepository applicationRepository) {
		this.applicationRepository = applicationRepository;
	}

	@Transactional(readOnly = true)
	public List<ApplicationResponse> listForUser(UUID userId) {
		return applicationRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
				.map(ApplicationResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public ApplicationResponse getForUser(UUID userId, UUID applicationId) {
		Application application = findOwnedApplication(userId, applicationId);
		return ApplicationResponse.from(application);
	}

	@Transactional
	public ApplicationResponse create(UUID userId, CreateApplicationRequest request) {
		Application application = new Application();
		application.setUserId(userId);
		applyRequestFields(application, request.getCompany(), request.getPosition(), request.getLocation(),
				request.getSalaryMin(), request.getSalaryMax(), request.getStatus(), request.getDateApplied(),
				request.getJobUrl());
		return ApplicationResponse.from(applicationRepository.save(application));
	}

	@Transactional
	public ApplicationResponse update(UUID userId, UUID applicationId, UpdateApplicationRequest request) {
		Application application = findOwnedApplication(userId, applicationId);
		applyRequestFields(application, request.getCompany(), request.getPosition(), request.getLocation(),
				request.getSalaryMin(), request.getSalaryMax(), request.getStatus(), request.getDateApplied(),
				request.getJobUrl());
		return ApplicationResponse.from(applicationRepository.save(application));
	}

	@Transactional
	public ApplicationResponse updateStatus(UUID userId, UUID applicationId, ApplicationStatus status) {
		Application application = findOwnedApplication(userId, applicationId);
		application.setStatus(status);
		return ApplicationResponse.from(applicationRepository.save(application));
	}

	@Transactional
	public ApplicationResponse updateRejectionReason(UUID userId, UUID applicationId, String rejectionReason) {
		Application application = findOwnedApplication(userId, applicationId);
		String normalized = rejectionReason == null ? null : rejectionReason.trim();
		if (normalized != null && normalized.isEmpty()) {
			normalized = null;
		}
		application.setRejectionReason(normalized);
		return ApplicationResponse.from(applicationRepository.save(application));
	}

	@Transactional
	public void delete(UUID userId, UUID applicationId) {
		Application application = findOwnedApplication(userId, applicationId);
		applicationRepository.delete(application);
	}

	private Application findOwnedApplication(UUID userId, UUID applicationId) {
		return applicationRepository.findByIdAndUserId(applicationId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
	}

	private static void applyRequestFields(
			Application application,
			String company,
			String position,
			String location,
			Integer salaryMin,
			Integer salaryMax,
			com.jobtrack.model.ApplicationStatus status,
			java.time.LocalDate dateApplied,
			String jobUrl) {
		application.setCompany(company);
		application.setPosition(position);
		application.setLocation(location);
		application.setSalaryMin(salaryMin);
		application.setSalaryMax(salaryMax);
		application.setStatus(status);
		application.setDateApplied(dateApplied);
		application.setJobUrl(jobUrl);
	}

}
