package com.jobtrack.service;

import com.jobtrack.repository.ApplicationRepository;
import com.jobtrack.repository.ContactRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAccountServiceTest {

	private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

	@Mock
	private ApplicationRepository applicationRepository;

	@Mock
	private ContactRepository contactRepository;

	@Mock
	private JdbcTemplate jdbcTemplate;

	@InjectMocks
	private UserAccountService userAccountService;

	@Test
	void deleteAccountRejectsDemoEmail() {
		assertThatThrownBy(() -> userAccountService.deleteAccount(USER_ID, "demo@jobtrack.com"))
				.isInstanceOf(ResponseStatusException.class)
				.extracting("statusCode")
				.isEqualTo(HttpStatus.FORBIDDEN);
	}

	@Test
	void deleteAccountRemovesDataAndAuthUser() {
		when(jdbcTemplate.update("delete from auth.users where id = ?", USER_ID)).thenReturn(1);

		userAccountService.deleteAccount(USER_ID, "user@example.com");

		verify(contactRepository).deleteByUserId(USER_ID);
		verify(applicationRepository).deleteByUserId(USER_ID);
		verify(jdbcTemplate).update("delete from auth.users where id = ?", USER_ID);
	}

}
