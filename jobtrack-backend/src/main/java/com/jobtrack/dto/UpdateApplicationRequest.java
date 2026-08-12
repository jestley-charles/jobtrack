package com.jobtrack.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.jobtrack.model.ApplicationStatus;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class UpdateApplicationRequest {

	@NotBlank
	private String company;

	@NotBlank
	private String position;

	private String location;

	@Min(0)
	private Integer salaryMin;

	@Min(0)
	private Integer salaryMax;

	@NotNull
	private ApplicationStatus status;

	private LocalDate dateApplied;

	private String jobUrl;

	public String getCompany() {
		return company;
	}

	public void setCompany(String company) {
		this.company = company;
	}

	public String getPosition() {
		return position;
	}

	public void setPosition(String position) {
		this.position = position;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
	}

	public Integer getSalaryMin() {
		return salaryMin;
	}

	public void setSalaryMin(Integer salaryMin) {
		this.salaryMin = salaryMin;
	}

	public Integer getSalaryMax() {
		return salaryMax;
	}

	public void setSalaryMax(Integer salaryMax) {
		this.salaryMax = salaryMax;
	}

	public ApplicationStatus getStatus() {
		return status;
	}

	public void setStatus(ApplicationStatus status) {
		this.status = status;
	}

	public LocalDate getDateApplied() {
		return dateApplied;
	}

	public void setDateApplied(LocalDate dateApplied) {
		this.dateApplied = dateApplied;
	}

	public String getJobUrl() {
		return jobUrl;
	}

	public void setJobUrl(String jobUrl) {
		this.jobUrl = jobUrl;
	}

	@JsonIgnore
	@AssertTrue(message = "salaryMin must be less than or equal to salaryMax")
	public boolean isSalaryRangeValid() {
		if (salaryMin == null || salaryMax == null) {
			return true;
		}
		return salaryMin <= salaryMax;
	}

}
