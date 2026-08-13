package com.jobtrack.service;

import com.jobtrack.dto.ContactResponse;
import com.jobtrack.dto.CreateContactRequest;
import com.jobtrack.dto.UpdateContactRequest;
import com.jobtrack.model.Contact;
import com.jobtrack.repository.ContactRepository;
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
class ContactServiceTest {

	private static final UUID USER_ID = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
	private static final UUID CONTACT_ID = UUID.fromString("880e8400-e29b-41d4-a716-446655440003");

	@Mock
	private ContactRepository contactRepository;

	@InjectMocks
	private ContactService contactService;

	private Contact sampleContact;

	@BeforeEach
	void setUp() {
		sampleContact = new Contact();
		sampleContact.setId(CONTACT_ID);
		sampleContact.setUserId(USER_ID);
		sampleContact.setName("Jane Doe");
		sampleContact.setCompany("Google");
		sampleContact.setRole("Recruiter");
		sampleContact.setEmail("jane@google.com");
		sampleContact.setLinkedinUrl("https://linkedin.com/in/janedoe");
		sampleContact.setNotes("Met at career fair");
		sampleContact.setCreatedAt(Instant.parse("2026-08-12T10:00:00Z"));
		sampleContact.setUpdatedAt(Instant.parse("2026-08-12T10:00:00Z"));
	}

	@Test
	void listForUserReturnsMappedResponses() {
		when(contactRepository.findByUserIdOrderByUpdatedAtDesc(USER_ID)).thenReturn(List.of(sampleContact));

		List<ContactResponse> responses = contactService.listForUser(USER_ID);

		assertEquals(1, responses.size());
		assertEquals(CONTACT_ID, responses.get(0).id());
		assertEquals("Jane Doe", responses.get(0).name());
	}

	@Test
	void getForUserReturnsContactWhenOwned() {
		when(contactRepository.findByIdAndUserId(CONTACT_ID, USER_ID)).thenReturn(Optional.of(sampleContact));

		ContactResponse response = contactService.getForUser(USER_ID, CONTACT_ID);

		assertEquals(CONTACT_ID, response.id());
		assertEquals("Google", response.company());
	}

	@Test
	void getForUserThrowsWhenNotFound() {
		when(contactRepository.findByIdAndUserId(CONTACT_ID, USER_ID)).thenReturn(Optional.empty());

		assertThrows(ResponseStatusException.class, () -> contactService.getForUser(USER_ID, CONTACT_ID));
	}

	@Test
	void createSetsUserIdFromAuthContext() {
		CreateContactRequest request = new CreateContactRequest();
		request.setName("John Smith");
		request.setCompany("Microsoft");
		request.setEmail("john@microsoft.com");

		when(contactRepository.save(any(Contact.class))).thenAnswer(invocation -> {
			Contact saved = invocation.getArgument(0);
			saved.setId(CONTACT_ID);
			saved.setCreatedAt(Instant.parse("2026-08-12T10:00:00Z"));
			saved.setUpdatedAt(Instant.parse("2026-08-12T10:00:00Z"));
			return saved;
		});

		ContactResponse response = contactService.create(USER_ID, request);

		ArgumentCaptor<Contact> captor = ArgumentCaptor.forClass(Contact.class);
		verify(contactRepository).save(captor.capture());
		assertEquals(USER_ID, captor.getValue().getUserId());
		assertEquals("John Smith", response.name());
	}

	@Test
	void updateModifiesOwnedContact() {
		UpdateContactRequest request = new UpdateContactRequest();
		request.setName("Jane Doe");
		request.setCompany("Alphabet");
		request.setRole("Senior Recruiter");

		when(contactRepository.findByIdAndUserId(CONTACT_ID, USER_ID)).thenReturn(Optional.of(sampleContact));
		when(contactRepository.save(sampleContact)).thenReturn(sampleContact);

		ContactResponse response = contactService.update(USER_ID, CONTACT_ID, request);

		assertEquals("Alphabet", response.company());
		assertEquals("Senior Recruiter", sampleContact.getRole());
	}

	@Test
	void deleteRemovesOwnedContact() {
		when(contactRepository.findByIdAndUserId(CONTACT_ID, USER_ID)).thenReturn(Optional.of(sampleContact));

		contactService.delete(USER_ID, CONTACT_ID);

		verify(contactRepository).delete(sampleContact);
	}

	@Test
	void deleteThrowsWhenNotFound() {
		when(contactRepository.findByIdAndUserId(CONTACT_ID, USER_ID)).thenReturn(Optional.empty());

		assertThrows(ResponseStatusException.class, () -> contactService.delete(USER_ID, CONTACT_ID));
		verify(contactRepository, never()).delete(any());
	}

}
