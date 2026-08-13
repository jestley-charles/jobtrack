package com.jobtrack;

import com.jobtrack.repository.ApplicationRepository;
import com.jobtrack.repository.ContactRepository;
import com.jobtrack.repository.InterviewRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
		"spring.autoconfigure.exclude="
				+ "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,"
				+ "org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration,"
				+ "org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration",
		"supabase.jwt.secret=test-jwt-secret-must-be-at-least-32-bytes-long"
})
class JobtrackBackendApplicationTests {

	@MockitoBean
	private ApplicationRepository applicationRepository;

	@MockitoBean
	private InterviewRepository interviewRepository;

	@MockitoBean
	private ContactRepository contactRepository;

	@Test
	void contextLoads() {
	}

}
