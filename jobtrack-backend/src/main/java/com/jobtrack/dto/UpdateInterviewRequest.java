package com.jobtrack.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class UpdateInterviewRequest {

	@NotNull
	private Instant interviewDate;

	private String interviewType;

	private String interviewer;

	private String notes;

	private String result;

	public Instant getInterviewDate() {
		return interviewDate;
	}

	public void setInterviewDate(Instant interviewDate) {
		this.interviewDate = interviewDate;
	}

	public String getInterviewType() {
		return interviewType;
	}

	public void setInterviewType(String interviewType) {
		this.interviewType = interviewType;
	}

	public String getInterviewer() {
		return interviewer;
	}

	public void setInterviewer(String interviewer) {
		this.interviewer = interviewer;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public String getResult() {
		return result;
	}

	public void setResult(String result) {
		this.result = result;
	}

}
