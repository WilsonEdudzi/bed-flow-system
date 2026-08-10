package com.hospital.bedflow.model;

import jakarta.persistence.*;
import java.time.LocalDateTime; // Make sure to add this import

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // "ADMIN" or "NURSE"

    private String fullName;
    private String ward;

    // --- NEW FIELDS FOR PASSWORD RECOVERY ---
    private String resetCode;
    private LocalDateTime resetCodeExpiry;

    public User() {}

    public User(String username, String password, String role, String fullName, String ward) {
        this.username = username;
        this.password = password;
        this.role = role;
        this.fullName = fullName;
        this.ward = ward;
    }

    // Existing Getters and Setters
    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getWard() { return ward; }
    public void setWard(String ward) { this.ward = ward; }

    // --- NEW GETTERS AND SETTERS ---
    public String getResetCode() { return resetCode; }
    public void setResetCode(String resetCode) { this.resetCode = resetCode; }
    public LocalDateTime getResetCodeExpiry() { return resetCodeExpiry; }
    public void setResetCodeExpiry(LocalDateTime resetCodeExpiry) { this.resetCodeExpiry = resetCodeExpiry; }
}