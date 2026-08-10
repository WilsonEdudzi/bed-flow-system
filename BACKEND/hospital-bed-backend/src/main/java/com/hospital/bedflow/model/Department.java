package com.hospital.bedflow.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    private String id;
    private String name;
    private String shortName;
    private Integer totalBeds;
    private Integer minAcuity;
    private Integer maxAcuity;
    private Double isolationCapable;

    // Default Constructor (Required by JPA)
    public Department() {}

    // Parameterized Constructor
    public Department(String id, String name, String shortName, Integer totalBeds, Integer minAcuity, Integer maxAcuity, Double isolationCapable) {
        this.id = id;
        this.name = name;
        this.shortName = shortName;
        this.totalBeds = totalBeds;
        this.minAcuity = minAcuity;
        this.maxAcuity = maxAcuity;
        this.isolationCapable = isolationCapable;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getShortName() { return shortName; }
    public void setShortName(String shortName) { this.shortName = shortName; }

    public Integer getTotalBeds() { return totalBeds; }
    public void setTotalBeds(Integer totalBeds) { this.totalBeds = totalBeds; }

    public Integer getMinAcuity() { return minAcuity; }
    public void setMinAcuity(Integer minAcuity) { this.minAcuity = minAcuity; }

    public Integer getMaxAcuity() { return maxAcuity; }
    public void setMaxAcuity(Integer maxAcuity) { this.maxAcuity = maxAcuity; }

    public Double getIsolationCapable() { return isolationCapable; }
    public void setIsolationCapable(Double isolationCapable) { this.isolationCapable = isolationCapable; }
}