package com.jobtrack.service;

import com.jobtrack.dto.ApplicationResponse;
import com.jobtrack.dto.CreateApplicationRequest;
import com.jobtrack.dto.UpdateApplicationRequest;
import com.jobtrack.model.Application;
import com.jobtrack.model.ApplicationStatus;
import com.jobtrack.repository.ApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
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
class ApplicationServiceTest {

	private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
	private static final UUID APP_ID = UUID.fromString("660e8400-e29b-41d4-a716-446655440001");

	@Mock
	private ApplicationRepository applicationRepository;

	@InjectMocks
	private ApplicationService applicationService;

	private Application sampleApplication;

	@BeforeEach
	void setUp() {
		sampleApplication = new Application();
		sampleApplication.setId(APP_ID);
		sampleApplication.setUserId(USER_ID);
		sampleApplication.setCompany("Google");
		sampleApplication.setPosition("Software Engineer");
		sampleApplication.setLocation("Remote");
		sampleApplication.setSalaryMin(90_000);
		sampleApplication.setSalaryMax(120_000);
		sampleApplication.setStatus(ApplicationStatus.Applied);
		sampleApplication.setDateApplied(LocalDate.of(2026, 8, 12));
		sampleApplication.setJobUrl("https://careers.google.com/jobs/123");
		sampleApplication.setCreatedAt(Instant.parse("2026-08-12T10:00:00Z"));
		sampleApplication.setUpdatedAt(Instant.parse("2026-08-12T10:00:00Z"));
	}

	@Test
	void listForUserReturnsMappedResponses() {
		when(applicationRepository.findByUserIdOrderByUpdatedAtDesc(USER_ID)).thenReturn(List.of(sampleApplication));

		List<ApplicationResponse> responses = applicationService.listForUser(USER_ID);

		assertEquals(1, responses.size());
		assertEquals(APP_ID, responses.get(0).id());
		assertEquals("Google", responses.get(0).company());
	}

	@Test
	void getForUserReturnsApplicationWhenOwned() {
		when(applicationRepository.findByIdAndUserId(APP_ID, USER_ID)).thenReturn(Optional.of(sampleApplication));

		ApplicationResponse response = applicationService.getForUser(USER_ID, APP_ID);

		assertEquals(APP_ID, response.id());
		assertEquals(ApplicationStatus.Applied, response.status());
	}

	@Test
	void getForUserThrowsWhenNotFound() {
		when(applicationRepository.findByIdAndUserId(APP_ID, USER_ID)).thenReturn(Optional.empty());

		assertThrows(ResponseStatusException.class, () -> applicationService.getForUser(USER_ID, APP_ID));
	}

	@Test
	void createSetsUserIdFromAuthContext() {
		CreateApplicationRequest request = new CreateApplicationRequest();
		request.setCompany("Microsoft");
		request.setPosition("Backend Developer");
		request.setStatus(ApplicationStatus.Wishlist);

		when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> {
			Application saved = invocation.getArgument(0);
			saved.setId(APP_ID);
			saved.setCreatedAt(Instant.parse("2026-08-12T10:00:00Z"));
			saved.setUpdatedAt(Instant.parse("2026-08-12T10:00:00Z"));
			return saved;
		});

		ApplicationResponse response = applicationService.create(USER_ID, request);

		ArgumentCaptor<Application> captor = ArgumentCaptor.forClass(Application.class);
		verify(applicationRepository).save(captor.capture());
		assertEquals(USER_ID, captor.getValue().getUserId());
		assertEquals("Microsoft", response.company());
	}

	@Test
	void updateModifiesOwnedApplication() {
		UpdateApplicationRequest request = new UpdateApplicationRequest();
		request.setCompany("Google");
		request.setPosition("Staff Engineer");
		request.setStatus(ApplicationStatus.Interview);

		when(applicationRepository.findByIdAndUserId(APP_ID, USER_ID)).thenReturn(Optional.of(sampleApplication));
		when(applicationRepository.save(sampleApplication)).thenReturn(sampleApplication);

		ApplicationResponse response = applicationService.update(USER_ID, APP_ID, request);

		assertEquals("Staff Engineer", response.position());
		assertEquals(ApplicationStatus.Interview, sampleApplication.getStatus());
	}

	@Test
	void deleteRemovesOwnedApplication() {
		when(applicationRepository.findByIdAndUserId(APP_ID, USER_ID)).thenReturn(Optional.of(sampleApplication));

		applicationService.delete(USER_ID, APP_ID);

		verify(applicationRepository).delete(sampleApplication);
	}

	@Test
	void deleteThrowsWhenNotFound() {
		when(applicationRepository.findByIdAndUserId(APP_ID, USER_ID)).thenReturn(Optional.empty());

		assertThrows(ResponseStatusException.class, () -> applicationService.delete(USER_ID, APP_ID));
		verify(applicationRepository, never()).delete(any());
	}

}
