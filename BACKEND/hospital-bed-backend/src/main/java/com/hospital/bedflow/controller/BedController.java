package com.hospital.bedflow.controller;

import com.hospital.bedflow.dto.AllocationRequest;
import com.hospital.bedflow.dto.ScoredBed;
import com.hospital.bedflow.model.Bed;
import com.hospital.bedflow.model.BedStatus;
import com.hospital.bedflow.model.Department;
import com.hospital.bedflow.repository.BedRepository;
import com.hospital.bedflow.repository.DepartmentRepository;
import com.hospital.bedflow.service.AllocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class BedController {

    private final BedRepository bedRepository;
    private final DepartmentRepository departmentRepository;
    private final AllocationService allocationService;

    public BedController(BedRepository bedRepository, 
                         DepartmentRepository departmentRepository, 
                         AllocationService allocationService) {
        this.bedRepository = bedRepository;
        this.departmentRepository = departmentRepository;
        this.allocationService = allocationService;
    }

    @GetMapping("/beds")
    public List<Bed> getAllBeds() {
        return bedRepository.findAll();
    }

    @GetMapping("/departments")
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @PostMapping("/beds/allocate")
    public List<ScoredBed> allocateBed(@RequestBody AllocationRequest request) {
        return allocationService.recommendBeds(request);
    }

    @PutMapping("/beds/{id}/assign")
    public ResponseEntity<?> assignBed(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        return bedRepository.findById(id).map(bed -> {
            
            if (payload.containsKey("status") && payload.get("status") != null) {
                String requestedStatus = ((String) payload.get("status")).toUpperCase();
                try {
                    bed.setStatus(BedStatus.valueOf(requestedStatus));
                } catch (IllegalArgumentException e) {
                    bed.setStatus(BedStatus.OCCUPIED);
                }
            } else {
                bed.setStatus(BedStatus.OCCUPIED);
            }

            if (payload.containsKey("patientName")) {
                bed.setPatientName((String) payload.get("patientName"));
            }

            if (payload.containsKey("acuity") && payload.get("acuity") != null) {
                bed.setAcuity((Integer) payload.get("acuity"));
            }

            if (payload.containsKey("isolation") && payload.get("isolation") != null) {
                bed.setIsolation((Boolean) payload.get("isolation"));
            }

            if (bed.getStatus() == BedStatus.OCCUPIED) {
                bed.setAdmittedHoursAgo(0);
            } else if (bed.getStatus() == BedStatus.CLEANING || bed.getStatus() == BedStatus.AVAILABLE) {
                bed.setAdmittedHoursAgo(null);
            }

            bedRepository.save(bed);
            return ResponseEntity.ok(bed);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/beds/{id}/release")
    public ResponseEntity<?> releaseBed(@PathVariable String id) {
        return bedRepository.findById(id).map(bed -> {
            bed.setStatus(BedStatus.AVAILABLE);
            bed.setPatientName(null);
            bed.setAdmittedHoursAgo(null);
            bedRepository.save(bed);
            return ResponseEntity.ok(bed);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/beds/release-all")
    public ResponseEntity<?> releaseAllBeds() {
        List<Bed> beds = bedRepository.findAll();
        for (Bed bed : beds) {
            bed.setStatus(BedStatus.AVAILABLE);
            bed.setPatientName(null);
            bed.setAdmittedHoursAgo(null);
        }
        bedRepository.saveAll(beds);
        return ResponseEntity.ok(Map.of("message", "All beds cleared successfully."));
    }
}