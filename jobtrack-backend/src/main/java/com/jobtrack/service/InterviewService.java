package com.jobtrack.service;

import com.jobtrack.dto.CreateInterviewRequest;
import com.jobtrack.dto.InterviewResponse;
import com.jobtrack.dto.UpdateInterviewRequest;
import com.jobtrack.model.Interview;
import com.jobtrack.repository.ApplicationRepository;
import com.jobtrack.repository.InterviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class InterviewService {

	private final InterviewRepository interviewRepository;
	private final ApplicationRepository applicationRepository;

	public InterviewService(InterviewRepository interviewRepository, ApplicationRepository applicationRepository) {
		this.interviewRepository = interviewRepository;
		this.applicationRepository = applicationRepository;
	}

	@Transactional(readOnly = true)
	public List<InterviewResponse> listForUser(UUID userId) {
		return interviewRepository.findAllForUserOrderByInterviewDateAsc(userId).stream()
				.map(InterviewResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public InterviewResponse getForUser(UUID userId, UUID interviewId) {
		Interview interview = findOwnedInterview(userId, interviewId);
		return InterviewResponse.from(interview);
	}

	@Transactional
	public InterviewResponse create(UUID userId, CreateInterviewRequest request) {
		requireOwnedApplication(userId, request.getApplicationId());

		Interview interview = new Interview();
		interview.setApplicationId(request.getApplicationId());
		applyRequestFields(interview, request.getInterviewDate(), request.getInterviewType(),
				request.getInterviewer(), request.getNotes(), request.getResult());
		return InterviewResponse.from(interviewRepository.save(interview));
	}

	@Transactional
	public InterviewResponse update(UUID userId, UUID interviewId, UpdateInterviewRequest request) {
		Interview interview = findOwnedInterview(userId, interviewId);
		applyRequestFields(interview, request.getInterviewDate(), request.getInterviewType(),
				request.getInterviewer(), request.getNotes(), request.getResult());
		return InterviewResponse.from(interviewRepository.save(interview));
	}

	@Transactional
	public void delete(UUID userId, UUID interviewId) {
		Interview interview = findOwnedInterview(userId, interviewId);
		interviewRepository.delete(interview);
	}

	private Interview findOwnedInterview(UUID userId, UUID interviewId) {
		return interviewRepository.findByIdAndUserId(interviewId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found"));
	}

	private void requireOwnedApplication(UUID userId, UUID applicationId) {
		applicationRepository.findByIdAndUserId(applicationId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
	}

	private static void applyRequestFields(
			Interview interview,
			Instant interviewDate,
			String interviewType,
			String interviewer,
			String notes,
			String result) {
		interview.setInterviewDate(interviewDate);
		interview.setInterviewType(interviewType);
		interview.setInterviewer(interviewer);
		interview.setNotes(notes);
		interview.setResult(result);
	}

}
