package com.jobtrack.controller;

import com.jobtrack.dto.ApplicationResponse;
import com.jobtrack.dto.CreateApplicationRequest;
import com.jobtrack.dto.PatchApplicationStatusRequest;
import com.jobtrack.dto.PatchRejectionReasonRequest;
import com.jobtrack.dto.UpdateApplicationRequest;
import com.jobtrack.model.ApplicationStatus;
import com.jobtrack.security.AuthContext;
import com.jobtrack.service.ApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.JacksonJsonHttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import tools.jackson.databind.json.JsonMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ApplicationControllerTest {

	private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
	private static final UUID APP_ID = UUID.fromString("660e8400-e29b-41d4-a716-446655440001");

	@Mock
	private ApplicationService applicationService;

	@InjectMocks
	private ApplicationController applicationController;

	private MockMvc mockMvc;
	private JsonMapper jsonMapper;

	@BeforeEach
	void setUp() {
		LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
		validator.afterPropertiesSet();

		jsonMapper = JsonMapper.builder().build();

		mockMvc = MockMvcBuilders.standaloneSetup(applicationController)
				.setValidator(validator)
				.setMessageConverters(new JacksonJsonHttpMessageConverter(jsonMapper))
				.build();
	}

	@Test
	void listReturnsApplicationsForAuthenticatedUser() throws Exception {
		ApplicationResponse response = sampleResponse();
		when(applicationService.listForUser(USER_ID)).thenReturn(List.of(response));

		mockMvc.perform(get("/api/applications")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].company").value("Google"))
				.andExpect(jsonPath("$[0].status").value("Applied"));
	}

	@Test
	void getReturnsSingleApplication() throws Exception {
		when(applicationService.getForUser(USER_ID, APP_ID)).thenReturn(sampleResponse());

		mockMvc.perform(get("/api/applications/{id}", APP_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(APP_ID.toString()))
				.andExpect(jsonPath("$.position").value("Software Engineer"));
	}

	@Test
	void createReturns201() throws Exception {
		CreateApplicationRequest request = new CreateApplicationRequest();
		request.setCompany("Google");
		request.setPosition("Software Engineer");
		request.setStatus(ApplicationStatus.Applied);

		when(applicationService.create(eq(USER_ID), any(CreateApplicationRequest.class))).thenReturn(sampleResponse());

		mockMvc.perform(post("/api/applications")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.company").value("Google"));
	}

	@Test
	void createRejectsInvalidBody() throws Exception {
		CreateApplicationRequest request = new CreateApplicationRequest();
		request.setCompany("");
		request.setPosition("Software Engineer");
		request.setStatus(ApplicationStatus.Applied);

		mockMvc.perform(post("/api/applications")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void updateReturnsUpdatedApplication() throws Exception {
		UpdateApplicationRequest request = new UpdateApplicationRequest();
		request.setCompany("Google");
		request.setPosition("Staff Engineer");
		request.setStatus(ApplicationStatus.Interview);

		ApplicationResponse updated = new ApplicationResponse(
				APP_ID, USER_ID, "Google", "Staff Engineer", "Remote",
				90_000, 120_000, ApplicationStatus.Interview, LocalDate.of(2026, 8, 12),
				"https://careers.google.com/jobs/123", null,
				Instant.parse("2026-08-12T10:00:00Z"), Instant.parse("2026-08-12T11:00:00Z"));

		when(applicationService.update(eq(USER_ID), eq(APP_ID), any(UpdateApplicationRequest.class)))
				.thenReturn(updated);

		mockMvc.perform(put("/api/applications/{id}", APP_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.position").value("Staff Engineer"))
				.andExpect(jsonPath("$.status").value("Interview"));
	}

	@Test
	void patchStatusReturnsUpdatedApplication() throws Exception {
		PatchApplicationStatusRequest request = new PatchApplicationStatusRequest();
		request.setStatus(ApplicationStatus.Offer);

		ApplicationResponse updated = new ApplicationResponse(
				APP_ID, USER_ID, "Google", "Software Engineer", "Remote",
				90_000, 120_000, ApplicationStatus.Offer, LocalDate.of(2026, 8, 12),
				"https://careers.google.com/jobs/123", null,
				Instant.parse("2026-08-12T10:00:00Z"), Instant.parse("2026-08-12T11:00:00Z"));

		when(applicationService.updateStatus(USER_ID, APP_ID, ApplicationStatus.Offer)).thenReturn(updated);

		mockMvc.perform(patch("/api/applications/{id}/status", APP_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("Offer"));
	}

	@Test
	void patchStatusRejectsMissingStatus() throws Exception {
		mockMvc.perform(patch("/api/applications/{id}/status", APP_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void patchRejectionReasonReturnsUpdatedApplication() throws Exception {
		PatchRejectionReasonRequest request = new PatchRejectionReasonRequest();
		request.setRejectionReason("Weak system design");

		ApplicationResponse updated = new ApplicationResponse(
				APP_ID, USER_ID, "Google", "Software Engineer", "Remote",
				90_000, 120_000, ApplicationStatus.Rejected, LocalDate.of(2026, 8, 12),
				"https://careers.google.com/jobs/123", "Weak system design",
				Instant.parse("2026-08-12T10:00:00Z"), Instant.parse("2026-08-12T11:00:00Z"));

		when(applicationService.updateRejectionReason(USER_ID, APP_ID, "Weak system design"))
				.thenReturn(updated);

		mockMvc.perform(patch("/api/applications/{id}/rejection-reason", APP_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.rejectionReason").value("Weak system design"));
	}

	@Test
	void deleteReturns204() throws Exception {
		mockMvc.perform(delete("/api/applications/{id}", APP_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isNoContent());

		verify(applicationService).delete(USER_ID, APP_ID);
	}

	private static ApplicationResponse sampleResponse() {
		return new ApplicationResponse(
				APP_ID,
				USER_ID,
				"Google",
				"Software Engineer",
				"Remote",
				90_000,
				120_000,
				ApplicationStatus.Applied,
				LocalDate.of(2026, 8, 12),
				"https://careers.google.com/jobs/123",
				null,
				Instant.parse("2026-08-12T10:00:00Z"),
				Instant.parse("2026-08-12T10:00:00Z"));
	}

}
