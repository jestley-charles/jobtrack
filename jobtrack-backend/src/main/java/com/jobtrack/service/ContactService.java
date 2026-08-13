package com.jobtrack.service;

import com.jobtrack.dto.ContactResponse;
import com.jobtrack.dto.CreateContactRequest;
import com.jobtrack.dto.UpdateContactRequest;
import com.jobtrack.model.Contact;
import com.jobtrack.repository.ContactRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class ContactService {

	private final ContactRepository contactRepository;

	public ContactService(ContactRepository contactRepository) {
		this.contactRepository = contactRepository;
	}

	@Transactional(readOnly = true)
	public List<ContactResponse> listForUser(UUID userId) {
		return contactRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
				.map(ContactResponse::from)
				.toList();
	}

	@Transactional(readOnly = true)
	public ContactResponse getForUser(UUID userId, UUID contactId) {
		Contact contact = findOwnedContact(userId, contactId);
		return ContactResponse.from(contact);
	}

	@Transactional
	public ContactResponse create(UUID userId, CreateContactRequest request) {
		Contact contact = new Contact();
		contact.setUserId(userId);
		applyRequestFields(contact, request.getName(), request.getCompany(), request.getRole(),
				request.getEmail(), request.getLinkedinUrl(), request.getNotes());
		return ContactResponse.from(contactRepository.save(contact));
	}

	@Transactional
	public ContactResponse update(UUID userId, UUID contactId, UpdateContactRequest request) {
		Contact contact = findOwnedContact(userId, contactId);
		applyRequestFields(contact, request.getName(), request.getCompany(), request.getRole(),
				request.getEmail(), request.getLinkedinUrl(), request.getNotes());
		return ContactResponse.from(contactRepository.save(contact));
	}

	@Transactional
	public void delete(UUID userId, UUID contactId) {
		Contact contact = findOwnedContact(userId, contactId);
		contactRepository.delete(contact);
	}

	private Contact findOwnedContact(UUID userId, UUID contactId) {
		return contactRepository.findByIdAndUserId(contactId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contact not found"));
	}

	private static void applyRequestFields(
			Contact contact,
			String name,
			String company,
			String role,
			String email,
			String linkedinUrl,
			String notes) {
		contact.setName(name);
		contact.setCompany(company);
		contact.setRole(role);
		contact.setEmail(email);
		contact.setLinkedinUrl(linkedinUrl);
		contact.setNotes(notes);
	}

}
