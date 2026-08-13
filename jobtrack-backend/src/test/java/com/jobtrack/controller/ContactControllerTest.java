package com.jobtrack.controller;

import com.jobtrack.dto.ContactResponse;
import com.jobtrack.dto.CreateContactRequest;
import com.jobtrack.dto.UpdateContactRequest;
import com.jobtrack.security.AuthContext;
import com.jobtrack.service.ContactService;
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
class ContactControllerTest {

	private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
	private static final UUID CONTACT_ID = UUID.fromString("880e8400-e29b-41d4-a716-446655440003");

	@Mock
	private ContactService contactService;

	@InjectMocks
	private ContactController contactController;

	private MockMvc mockMvc;
	private JsonMapper jsonMapper;

	@BeforeEach
	void setUp() {
		LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
		validator.afterPropertiesSet();

		jsonMapper = JsonMapper.builder().build();

		mockMvc = MockMvcBuilders.standaloneSetup(contactController)
				.setValidator(validator)
				.setMessageConverters(new JacksonJsonHttpMessageConverter(jsonMapper))
				.build();
	}

	@Test
	void listReturnsContactsForAuthenticatedUser() throws Exception {
		when(contactService.listForUser(USER_ID)).thenReturn(List.of(sampleResponse()));

		mockMvc.perform(get("/api/contacts")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Jane Doe"))
				.andExpect(jsonPath("$[0].company").value("Google"));
	}

	@Test
	void getReturnsSingleContact() throws Exception {
		when(contactService.getForUser(USER_ID, CONTACT_ID)).thenReturn(sampleResponse());

		mockMvc.perform(get("/api/contacts/{id}", CONTACT_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(CONTACT_ID.toString()))
				.andExpect(jsonPath("$.email").value("jane@google.com"));
	}

	@Test
	void createReturns201() throws Exception {
		CreateContactRequest request = new CreateContactRequest();
		request.setName("Jane Doe");
		request.setCompany("Google");
		request.setEmail("jane@google.com");

		when(contactService.create(eq(USER_ID), any(CreateContactRequest.class))).thenReturn(sampleResponse());

		mockMvc.perform(post("/api/contacts")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("Jane Doe"));
	}

	@Test
	void createRejectsInvalidBody() throws Exception {
		CreateContactRequest request = new CreateContactRequest();
		request.setName("");
		request.setEmail("not-an-email");

		mockMvc.perform(post("/api/contacts")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isBadRequest());
	}

	@Test
	void updateReturnsUpdatedContact() throws Exception {
		UpdateContactRequest request = new UpdateContactRequest();
		request.setName("Jane Doe");
		request.setCompany("Alphabet");
		request.setRole("Senior Recruiter");

		ContactResponse updated = new ContactResponse(
				CONTACT_ID, USER_ID, "Jane Doe", "Alphabet", "Senior Recruiter",
				"jane@google.com", "https://linkedin.com/in/janedoe", "Met at career fair",
				Instant.parse("2026-08-12T10:00:00Z"), Instant.parse("2026-08-12T11:00:00Z"));

		when(contactService.update(eq(USER_ID), eq(CONTACT_ID), any(UpdateContactRequest.class)))
				.thenReturn(updated);

		mockMvc.perform(put("/api/contacts/{id}", CONTACT_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.contentType(MediaType.APPLICATION_JSON)
				.content(jsonMapper.writeValueAsString(request)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.company").value("Alphabet"))
				.andExpect(jsonPath("$.role").value("Senior Recruiter"));
	}

	@Test
	void deleteReturns204() throws Exception {
		mockMvc.perform(delete("/api/contacts/{id}", CONTACT_ID)
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID))
				.andExpect(status().isNoContent());

		verify(contactService).delete(USER_ID, CONTACT_ID);
	}

	private static ContactResponse sampleResponse() {
		return new ContactResponse(
				CONTACT_ID,
				USER_ID,
				"Jane Doe",
				"Google",
				"Recruiter",
				"jane@google.com",
				"https://linkedin.com/in/janedoe",
				"Met at career fair",
				Instant.parse("2026-08-12T10:00:00Z"),
				Instant.parse("2026-08-12T10:00:00Z"));
	}

}
