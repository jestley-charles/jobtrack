package com.jobtrack.exception;

import com.jobtrack.controller.ApplicationController;
import com.jobtrack.dto.CreateApplicationRequest;
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
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

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
				.setControllerAdvice(new GlobalExceptionHandler())
				.setValidator(validator)
				.setMessageConverters(new JacksonJsonHttpMessageConverter(jsonMapper))
				.build();
	}

	@Test
	void validationFailureReturnsStructuredBadRequest() throws Exception {
		CreateApplicationRequest request = new CreateApplicationRequest();
		request.setCompany("");
		request.setPosition("Software Engineer");
		request.setStatus(ApplicationStatus.Applied);

		mockMvc.perform(post("/api/applications")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Bad Request"))
				.andExpect(jsonPath("$.message").value("Validation failed"))
				.andExpect(jsonPath("$.errors[?(@.field == 'company')].message").exists());
	}

	@Test
	void malformedJsonReturnsBadRequest() throws Exception {
		mockMvc.perform(post("/api/applications")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{not-json"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Bad Request"))
				.andExpect(jsonPath("$.message").value("Request body is malformed or unreadable"));
	}

	@Test
	void responseStatusExceptionReturnsNotFoundBody() throws Exception {
		when(applicationService.getForUser(USER_ID, APP_ID))
				.thenThrow(new ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND, "Application not found"));

		mockMvc.perform(get("/api/applications/{id}", APP_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.error").value("Not Found"))
				.andExpect(jsonPath("$.message").value("Application not found"));
	}

	@Test
	void invalidPathVariableReturnsBadRequest() throws Exception {
		mockMvc.perform(get("/api/applications/{id}", "not-a-uuid")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Bad Request"))
				.andExpect(jsonPath("$.message").value("Invalid value for parameter 'id'"));
	}

	@Test
	void missingAuthContextReturnsUnauthorized() throws Exception {
		mockMvc.perform(get("/api/applications"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Unauthorized"))
				.andExpect(jsonPath("$.message").value("No authenticated user on this request"));
	}

	@Test
	void unexpectedExceptionReturnsInternalServerErrorWithoutDetails() throws Exception {
		when(applicationService.getForUser(eq(USER_ID), eq(APP_ID)))
				.thenThrow(new RuntimeException("database exploded"));

		mockMvc.perform(get("/api/applications/{id}", APP_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isInternalServerError())
				.andExpect(jsonPath("$.error").value("Internal Server Error"))
				.andExpect(jsonPath("$.message").value("An unexpected error occurred"));
	}

}
