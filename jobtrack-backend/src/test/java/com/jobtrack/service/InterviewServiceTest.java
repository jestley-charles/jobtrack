package com.jobtrack.service;

import com.jobtrack.dto.CreateInterviewRequest;
import com.jobtrack.dto.InterviewResponse;
import com.jobtrack.dto.UpdateInterviewRequest;
import com.jobtrack.model.Application;
import com.jobtrack.model.Interview;
import com.jobtrack.repository.ApplicationRepository;
import com.jobtrack.repository.InterviewRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InterviewServiceTest {

	private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
	private static final UUID APP_ID = UUID.fromString("660e8400-e29b-41d4-a716-446655440001");
	private static final UUID INTERVIEW_ID = UUID.fromString("770e8400-e29b-41d4-a716-446655440002");

	@Mock
	private InterviewRepository interviewRepository;

	@Mock
	private ApplicationRepository applicationRepository;

	@InjectMocks
	private InterviewService interviewService;

	private Interview sampleInterview;
	private Application sampleApplication;

	@BeforeEach
	void setUp() {
		sampleApplication = new Application();
		sampleApplication.setId(APP_ID);
		sampleApplication.setUserId(USER_ID);

		sampleInterview = new Interview();
		sampleInterview.setId(INTERVIEW_ID);
		sampleInterview.setApplicationId(APP_ID);
		sampleInterview.setInterviewDate(Instant.parse("2026-08-20T15:00:00Z"));
		sampleInterview.setInterviewType("Technical");
		sampleInterview.setInterviewer("Jane Doe");
		sampleInterview.setNotes("Prepare system design");
		sampleInterview.setResult(null);
		sampleInterview.setCreatedAt(Instant.parse("2026-08-12T10:00:00Z"));
	}

	@Test
	void listForUserReturnsMappedResponses() {
		when(interviewRepository.findAllForUserOrderByInterviewDateAsc(USER_ID))
				.thenReturn(List.of(sampleInterview));

		List<InterviewResponse> responses = interviewService.listForUser(USER_ID);

		assertEquals(1, responses.size());
		assertEquals(INTERVIEW_ID, responses.get(0).id());
		assertEquals("Technical", responses.get(0).interviewType());
	}

	@Test
	void getForUserReturnsInterviewWhenOwned() {
		when(interviewRepository.findByIdAndUserId(INTERVIEW_ID, USER_ID))
				.thenReturn(Optional.of(sampleInterview));

		InterviewResponse response = interviewService.getForUser(USER_ID, INTERVIEW_ID);

		assertEquals(INTERVIEW_ID, response.id());
		assertEquals(APP_ID, response.applicationId());
	}

	@Test
	void getForUserThrowsWhenNotFound() {
		when(interviewRepository.findByIdAndUserId(INTERVIEW_ID, USER_ID)).thenReturn(Optional.empty());

		assertThrows(ResponseStatusException.class, () -> interviewService.getForUser(USER_ID, INTERVIEW_ID));
	}

	@Test
	void createRejectsWhenApplicationNotOwned() {
		CreateInterviewRequest request = new CreateInterviewRequest();
		request.setApplicationId(APP_ID);
		request.setInterviewDate(Instant.parse("2026-08-20T15:00:00Z"));

		when(applicationRepository.findByIdAndUserId(APP_ID, USER_ID)).thenReturn(Optional.empty());

		assertThrows(ResponseStatusException.class, () -> interviewService.create(USER_ID, request));
		verify(interviewRepository, never()).save(any());
	}

	@Test
	void createLinksInterviewToOwnedApplication() {
		CreateInterviewRequest request = new CreateInterviewRequest();
		request.setApplicationId(APP_ID);
		request.setInterviewDate(Instant.parse("2026-08-20T15:00:00Z"));
		request.setInterviewType("Behavioral");
		request.setInterviewer("John Smith");

		when(applicationRepository.findByIdAndUserId(APP_ID, USER_ID)).thenReturn(Optional.of(sampleApplication));
		when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> {
			Interview saved = invocation.getArgument(0);
			saved.setId(INTERVIEW_ID);
			saved.setCreatedAt(Instant.parse("2026-08-12T10:00:00Z"));
			return saved;
		});

		InterviewResponse response = interviewService.create(USER_ID, request);

		ArgumentCaptor<Interview> captor = ArgumentCaptor.forClass(Interview.class);
		verify(interviewRepository).save(captor.capture());
		assertEquals(APP_ID, captor.getValue().getApplicationId());
		assertEquals("Behavioral", response.interviewType());
	}

	@Test
	void updateModifiesOwnedInterview() {
		UpdateInterviewRequest request = new UpdateInterviewRequest();
		request.setInterviewDate(Instant.parse("2026-08-21T16:00:00Z"));
		request.setInterviewType("Onsite");
		request.setInterviewer("Jane Doe");
		request.setResult("Passed");

		when(interviewRepository.findByIdAndUserId(INTERVIEW_ID, USER_ID))
				.thenReturn(Optional.of(sampleInterview));
		when(interviewRepository.save(sampleInterview)).thenReturn(sampleInterview);

		InterviewResponse response = interviewService.update(USER_ID, INTERVIEW_ID, request);

		assertEquals("Onsite", response.interviewType());
		assertEquals("Passed", sampleInterview.getResult());
	}

	@Test
	void deleteRemovesOwnedInterview() {
		when(interviewRepository.findByIdAndUserId(INTERVIEW_ID, USER_ID))
				.thenReturn(Optional.of(sampleInterview));

		interviewService.delete(USER_ID, INTERVIEW_ID);

		verify(interviewRepository).delete(sampleInterview);
	}

	@Test
	void deleteThrowsWhenNotFound() {
		when(interviewRepository.findByIdAndUserId(INTERVIEW_ID, USER_ID)).thenReturn(Optional.empty());

		assertThrows(ResponseStatusException.class, () -> interviewService.delete(USER_ID, INTERVIEW_ID));
		verify(interviewRepository, never()).delete(any());
	}

}
