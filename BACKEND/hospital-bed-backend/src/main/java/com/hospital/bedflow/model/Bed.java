package com.hospital.bedflow.model;

import jakarta.persistence.*;

@Entity
@Table(name = "beds")
public class Bed {

    @Id
    private String id;

    private String dept;

    @Enumerated(EnumType.STRING)
    private BedStatus status;

    private Integer acuity;
    private Boolean isolation;

    private String patientName;
    private Integer admittedHoursAgo;

    // Default Constructor (Required by JPA)
    public Bed() {}

    // Parameterized Constructor
    public Bed(String id, String dept, BedStatus status, Integer acuity, Boolean isolation, String patientName, Integer admittedHoursAgo) {
        this.id = id;
        this.dept = dept;
        this.status = status;
        this.acuity = acuity;
        this.isolation = isolation;
        this.patientName = patientName;
        this.admittedHoursAgo = admittedHoursAgo;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDept() { return dept; }
    public void setDept(String dept) { this.dept = dept; }

    public BedStatus getStatus() { return status; }
    public void setStatus(BedStatus status) { this.status = status; }

    public Integer getAcuity() { return acuity; }
    public void setAcuity(Integer acuity) { this.acuity = acuity; }

    public Boolean getIsolation() { return isolation; }
    public void setIsolation(Boolean isolation) { this.isolation = isolation; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public Integer getAdmittedHoursAgo() { return admittedHoursAgo; }
    public void setAdmittedHoursAgo(Integer admittedHoursAgo) { this.admittedHoursAgo = admittedHoursAgo; }
}