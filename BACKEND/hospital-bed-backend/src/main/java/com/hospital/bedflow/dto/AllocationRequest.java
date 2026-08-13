package com.hospital.bedflow.dto;

public class AllocationRequest {
    private String name;
    private Integer acuity;
    private String clinicalCategory; // Replaces fixed dept for global smart-routing (e.g., general, emergency, icu, pediatric, maternity)
    private Integer age;
    private Boolean isolation;
    private Boolean surgeMode; // Captures Surge Override Toggle

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getAcuity() { return acuity; }
    public void setAcuity(Integer acuity) { this.acuity = acuity; }

    public String getClinicalCategory() { return clinicalCategory; }
    public void setClinicalCategory(String clinicalCategory) { this.clinicalCategory = clinicalCategory; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public Boolean getIsolation() { return isolation; }
    public void setIsolation(Boolean isolation) { this.isolation = isolation; }

    public Boolean getSurgeMode() { return surgeMode != null && surgeMode; }
    public void setSurgeMode(Boolean surgeMode) { this.surgeMode = surgeMode; }
}