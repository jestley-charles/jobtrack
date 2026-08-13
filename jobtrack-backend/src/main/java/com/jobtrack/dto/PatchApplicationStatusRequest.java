package com.jobtrack.dto;

import com.jobtrack.model.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public class PatchApplicationStatusRequest {

	@NotNull
	private ApplicationStatus status;

	public ApplicationStatus getStatus() {
		return status;
	}

	public void setStatus(ApplicationStatus status) {
		this.status = status;
	}

}
