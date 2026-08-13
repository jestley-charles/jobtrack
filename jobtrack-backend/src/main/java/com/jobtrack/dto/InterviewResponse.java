package com.jobtrack.dto;

import com.jobtrack.model.Interview;

import java.time.Instant;
import java.util.UUID;

public record InterviewResponse(
		UUID id,
		UUID applicationId,
		Instant interviewDate,
		String interviewType,
		String interviewer,
		String notes,
		String result,
		Instant createdAt) {

	public static InterviewResponse from(Interview interview) {
		return new InterviewResponse(
				interview.getId(),
				interview.getApplicationId(),
				interview.getInterviewDate(),
				interview.getInterviewType(),
				interview.getInterviewer(),
				interview.getNotes(),
				interview.getResult(),
				interview.getCreatedAt());
	}

}
