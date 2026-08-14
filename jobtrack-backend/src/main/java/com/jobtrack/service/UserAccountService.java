package com.jobtrack.service;

import com.jobtrack.repository.ApplicationRepository;
import com.jobtrack.repository.ContactRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class UserAccountService {

	private static final String DEMO_EMAIL = "demo@jobtrack.com";

	private final ApplicationRepository applicationRepository;
	private final ContactRepository contactRepository;
	private final JdbcTemplate jdbcTemplate;

	public UserAccountService(
			ApplicationRepository applicationRepository,
			ContactRepository contactRepository,
			JdbcTemplate jdbcTemplate) {
		this.applicationRepository = applicationRepository;
		this.contactRepository = contactRepository;
		this.jdbcTemplate = jdbcTemplate;
	}

	@Transactional
	public void deleteAccount(UUID userId, String email) {
		if (email != null && email.equalsIgnoreCase(DEMO_EMAIL)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The demo account cannot be deleted.");
		}

		contactRepository.deleteByUserId(userId);
		applicationRepository.deleteByUserId(userId);

		int deleted = jdbcTemplate.update("delete from auth.users where id = ?", userId);
		if (deleted == 0) {
			throw new ResponseStatusException(
					HttpStatus.INTERNAL_SERVER_ERROR,
					"Could not remove your account. Please try again.");
		}
	}

}
