package com.hospital.bedflow.dto;

public class AllocationRequest {
    private String name;
    private Integer acuity;
    private String dept;
    private Boolean isolation;
    private Boolean surgeMode; // Captures Surge Override Toggle

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getAcuity() { return acuity; }
    public void setAcuity(Integer acuity) { this.acuity = acuity; }

    public String getDept() { return dept; }
    public void setDept(String dept) { this.dept = dept; }

    public Boolean getIsolation() { return isolation; }
    public void setIsolation(Boolean isolation) { this.isolation = isolation; }

    public Boolean getSurgeMode() { return surgeMode != null && surgeMode; }
    public void setSurgeMode(Boolean surgeMode) { this.surgeMode = surgeMode; }
}