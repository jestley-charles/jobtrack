package com.jobtrack.controller;

import com.jobtrack.security.AuthContext;
import com.jobtrack.service.UserAccountService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MeControllerTest {

	private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

	@Mock
	private UserAccountService userAccountService;

	@InjectMocks
	private MeController meController;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(meController).build();
	}

	@Test
	void meReturnsAuthenticatedUser() throws Exception {
		mockMvc.perform(get("/api/me")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.requestAttr(AuthContext.USER_EMAIL_ATTRIBUTE, "user@example.com"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.userId").value(USER_ID.toString()))
				.andExpect(jsonPath("$.email").value("user@example.com"));
	}

	@Test
	void deleteAccountRemovesAuthenticatedUser() throws Exception {
		mockMvc.perform(delete("/api/me")
				.requestAttr(AuthContext.USER_ID_ATTRIBUTE, USER_ID)
				.requestAttr(AuthContext.USER_EMAIL_ATTRIBUTE, "user@example.com"))
				.andExpect(status().isNoContent());

		verify(userAccountService).deleteAccount(USER_ID, "user@example.com");
	}

}
