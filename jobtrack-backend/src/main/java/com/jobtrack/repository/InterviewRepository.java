package com.jobtrack.repository;

import com.jobtrack.model.Interview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InterviewRepository extends JpaRepository<Interview, UUID> {

	@Query("""
			SELECT i FROM Interview i
			WHERE i.applicationId IN (
				SELECT a.id FROM Application a WHERE a.userId = :userId
			)
			ORDER BY i.interviewDate ASC
			""")
	List<Interview> findAllForUserOrderByInterviewDateAsc(@Param("userId") UUID userId);

	@Query("""
			SELECT i FROM Interview i
			WHERE i.id = :id
			  AND i.applicationId IN (
				SELECT a.id FROM Application a WHERE a.userId = :userId
			)
			""")
	Optional<Interview> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

}
