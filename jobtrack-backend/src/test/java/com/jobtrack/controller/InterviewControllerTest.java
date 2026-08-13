package com.jobtrack.controller;

import com.jobtrack.dto.CreateInterviewRequest;
import com.jobtrack.dto.InterviewResponse;
import com.jobtrack.dto.UpdateInterviewRequest;
import com.jobtrack.security.AuthContext;
import com.jobtrack.service.InterviewService;
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
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class InterviewControllerTest {

	private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
	private static final UUID APP_ID = UUID.fromString("660e8400-e29b-41d4-a716-446655440001");
	private static final UUID INTERVIEW_ID = UUID.fromString("770e8400-e29b-41d4-a716-446655440002");

	@Mock
	private InterviewService interviewService;

	@InjectMocks
	private InterviewController interviewController;

	private MockMvc mockMvc;
	private JsonMapper jsonMapper;

	@BeforeEach
	void setUp() {
		LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
		validator.afterPropertiesSet();

		jsonMapper = JsonMapper.builder().build();

		mockMvc = MockMvcBuilders.standaloneSetup(interviewController)
				.setValidator(validator)
				.setMessageConverters(new JacksonJsonHttpMessageConverter(jsonMapper))
				.build();
	}

	@Test
	void listReturnsInterviewsForAuthenticatedUser() throws Exception {
		when(interviewService.listForUser(USER_ID)).thenReturn(List.of(sampleResponse()));

		mockMvc.perform(get("/api/interviews")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].interviewType").value("Technical"))
				.andExpect(jsonPath("$[0].interviewer").value("Jane Doe"));
	}

	@Test
	void getReturnsSingleInterview() throws Exception {
		when(interviewService.getForUser(USER_ID, INTERVIEW_ID)).thenReturn(sampleResponse());

		mockMvc.perform(get("/api/interviews/{id}", INTERVIEW_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(INTERVIEW_ID.toString()))
				.andExpect(jsonPath("$.applicationId").value(APP_ID.toString()));
	}

	@Test
	void createReturns201() throws Exception {
		CreateInterviewRequest request = new CreateInterviewRequest();
		request.setApplicationId(APP_ID);
		request.setInterviewDate(Instant.parse("2026-08-20T15:00:00Z"));
		request.setInterviewType("Technical");

		when(interviewService.create(eq(USER_ID), any(CreateInterviewRequest.class))).thenReturn(sampleResponse());

		mockMvc.perform(post("/api/interviews")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.interviewType").value("Technical"));
	}

	@Test
	void createRejectsInvalidBody() throws Exception {
		CreateInterviewRequest request = new CreateInterviewRequest();
		request.setInterviewType("Technical");

		mockMvc.perform(post("/api/interviews")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void updateReturnsUpdatedInterview() throws Exception {
		UpdateInterviewRequest request = new UpdateInterviewRequest();
		request.setInterviewDate(Instant.parse("2026-08-21T16:00:00Z"));
		request.setInterviewType("Onsite");
		request.setResult("Passed");

		InterviewResponse updated = new InterviewResponse(
				INTERVIEW_ID, APP_ID, Instant.parse("2026-08-21T16:00:00Z"),
				"Onsite", "Jane Doe", "Prepare system design", "Passed",
				Instant.parse("2026-08-12T10:00:00Z"));

		when(interviewService.update(eq(USER_ID), eq(INTERVIEW_ID), any(UpdateInterviewRequest.class)))
				.thenReturn(updated);

		mockMvc.perform(put("/api/interviews/{id}", INTERVIEW_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.interviewType").value("Onsite"))
				.andExpect(jsonPath("$.result").value("Passed"));
	}

	@Test
	void deleteReturns204() throws Exception {
		mockMvc.perform(delete("/api/interviews/{id}", INTERVIEW_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isNoContent());

		verify(interviewService).delete(USER_ID, INTERVIEW_ID);
	}

	private static InterviewResponse sampleResponse() {
		return new InterviewResponse(
				INTERVIEW_ID,
				APP_ID,
				Instant.parse("2026-08-20T15:00:00Z"),
				"Technical",
				"Jane Doe",
				"Prepare system design",
				null,
				Instant.parse("2026-08-12T10:00:00Z"));
	}

}
