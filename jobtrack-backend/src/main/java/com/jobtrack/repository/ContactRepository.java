package com.jobtrack.repository;

import com.jobtrack.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContactRepository extends JpaRepository<Contact, UUID> {

	List<Contact> findByUserIdOrderByUpdatedAtDesc(UUID userId);

	Optional<Contact> findByIdAndUserId(UUID id, UUID userId);

}
