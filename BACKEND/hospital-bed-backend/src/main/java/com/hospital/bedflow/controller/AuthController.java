package com.hospital.bedflow.controller;

import com.hospital.bedflow.model.*;
import com.hospital.bedflow.repository.*;
import com.hospital.bedflow.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JavaMailSender mailSender;

    @PostConstruct
    public void initDefaultAdmin() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User("admin", "admin123", "ADMIN", "System Admin", "ALL");
            userRepository.save(admin);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getUsername());
        
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(request.getPassword())) {
            User user = userOpt.get();
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "username", user.getUsername(),
                "role", user.getRole(),
                "fullName", user.getFullName() != null ? user.getFullName() : user.getUsername()
            ));
        }

        return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password"));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Username/Email already exists"));
        }

        User newUser = new User(
            request.getUsername(), 
            request.getPassword(), 
            "NURSE", 
            request.getFullName(), 
            request.getWard()
        );
        userRepository.save(newUser);

        return ResponseEntity.ok(Map.of("status", "success", "message", "Nurse registered successfully"));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // --- FORGOT PASSWORD ENDPOINT WITH DETAILED ERROR LOGGING ---
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        
        // Generate a random 6-digit code
        String code = String.format("%06d", new Random().nextInt(999999));
        
        // Save code and set it to expire in 15 minutes
        user.setResetCode(code);
        user.setResetCodeExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(request.getEmail());
            message.setSubject("BedFlow Portal - Password Reset Code");
            message.setText("Hello " + (user.getFullName() != null ? user.getFullName() : "User") + ",\n\n"
                    + "Your password reset verification code is: " + code + "\n\n"
                    + "This code will expire in 15 minutes.\n\n"
                    + "Best regards,\nBedFlow System Admin");
            
            mailSender.send(message);
            System.out.println("SUCCESS: Email successfully sent to " + request.getEmail());
        } catch (Exception e) {
            // Prints the detailed reason for failure to your Spring Boot console
            System.err.println("🚨 FAILED TO SEND EMAIL VIA JAVAMAILSENDER 🚨");
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Failed to send email: " + e.getMessage()));
        }

        return ResponseEntity.ok(Map.of("status", "success", "message", "Verification code sent to your email"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        Optional<User> userOpt = userRepository.findByUsername(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();

        if (user.getResetCode() == null || !user.getResetCode().equals(request.getCode())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid verification code"));
        }

        if (user.getResetCodeExpiry() != null && user.getResetCodeExpiry().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Verification code has expired"));
        }

        user.setPassword(request.getNewPassword());
        user.setResetCode(null);
        user.setResetCodeExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("status", "success", "message", "Password successfully updated"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUserById(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "success", "message", "User account deleted successfully"));
    }

    @DeleteMapping("/account")
    public ResponseEntity<?> deleteOwnAccount(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User account not found"));
        }

        userRepository.delete(userOpt.get());
        return ResponseEntity.ok(Map.of("status", "success", "message", "Account permanently deleted"));
    }
}