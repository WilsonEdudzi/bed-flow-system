package com.hospital.bedflow.service;

import com.hospital.bedflow.dto.AllocationRequest;
import com.hospital.bedflow.dto.ScoredBed;
import com.hospital.bedflow.model.Bed;
import com.hospital.bedflow.model.BedStatus;
import com.hospital.bedflow.model.Department;
import com.hospital.bedflow.repository.BedRepository;
import com.hospital.bedflow.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AllocationService {

    private final BedRepository bedRepository;
    private final DepartmentRepository departmentRepository;

    private static final Map<String, List<String>> COMPATIBLE = Map.of(
        "er", List.of("icu", "sur"),
        "icu", List.of("er", "sur"),
        "gen", List.of("sur", "ped", "mat"),
        "ped", List.of("gen"),
        "mat", List.of("gen"),
        "sur", List.of("gen", "icu")
    );

    public AllocationService(BedRepository bedRepository, DepartmentRepository departmentRepository) {
        this.bedRepository = bedRepository;
        this.departmentRepository = departmentRepository;
    }

    public List<ScoredBed> recommendBeds(AllocationRequest req) {
        List<Bed> allBeds = bedRepository.findAll();
        List<Department> departments = departmentRepository.findAll();

        String targetDeptCode = mapCategoryToDeptCode(req.getClinicalCategory(), req.getAcuity());
        Integer patientAge = req.getAge() != null ? req.getAge() : 30;

        List<Bed> candidates = allBeds.stream()
            .filter(b -> b.getStatus() == BedStatus.AVAILABLE)
            .filter(b -> {
                // Pediatric age constraint
                if (b.getDept().equalsIgnoreCase("ped") && patientAge >= 18) {
                    return false;
                }
                // Critical Acuity 4-5 constraint: Standard general/maternity wards shouldn't take critical patients unless surge
                if (req.getAcuity() >= 4 && (b.getDept().equalsIgnoreCase("gen") || b.getDept().equalsIgnoreCase("mat")) && !req.getSurgeMode()) {
                    return false;
                }
                // Isolation constraint check
                if (Boolean.TRUE.equals(req.getIsolation())) {
                    Department dept = departments.stream()
                        .filter(d -> d.getId().equals(b.getDept()))
                        .findFirst().orElse(null);
                    return dept != null && dept.getIsolationCapable() > 0;
                }
                return true;
            })
            .collect(Collectors.toList());

        List<ScoredBed> scored = new ArrayList<>();
        boolean isSurge = Boolean.TRUE.equals(req.getSurgeMode());

        for (Bed bed : candidates) {
            Department dept = departments.stream()
                .filter(d -> d.getId().equals(bed.getDept()))
                .findFirst().orElse(null);

            if (dept == null) continue;

            int specialty;
            if (bed.getDept().equalsIgnoreCase(targetDeptCode)) {
                specialty = 40; 
            } else if (COMPATIBLE.getOrDefault(targetDeptCode, List.of()).contains(bed.getDept().toLowerCase())) {
                specialty = 22; 
            } else {
                specialty = 5;
            }

            double mid = (dept.getMinAcuity() + dept.getMaxAcuity()) / 2.0;
            int acuityVal = req.getAcuity() != null ? req.getAcuity() : 3;
            double distance = Math.abs(acuityVal - mid);
            
            int acuityFit;
            if (acuityVal < dept.getMinAcuity() || acuityVal > dept.getMaxAcuity()) {
                acuityFit = -25; 
            } else {
                if (isSurge) {
                    acuityFit = Math.max(0, (int) Math.round(50 - distance * 12));
                } else {
                    acuityFit = Math.max(0, (int) Math.round(30 - distance * 9));
                }
            }

            // Boost ICU score automatically if patient is critical (Acuity 5)
            if (acuityVal == 5 && bed.getDept().equalsIgnoreCase("icu")) {
                acuityFit += 15;
            }

            List<Bed> deptBeds = allBeds.stream().filter(b -> b.getDept().equals(bed.getDept())).collect(Collectors.toList());
            long occupied = deptBeds.stream().filter(b -> b.getStatus() != BedStatus.AVAILABLE).count();
            double occPct = deptBeds.isEmpty() ? 0 : (double) occupied / deptBeds.size();
            
            int loadBalance = isSurge ? (int) Math.round((1 - occPct) * 5) : (int) Math.round((1 - occPct) * 20);

            // Fixed: Returns 0 bonus when isolation is not requested instead of defaulting to 7
            int bonus = Boolean.TRUE.equals(req.getIsolation()) ? (dept.getIsolationCapable() >= 1.0 ? 10 : 5) : 0;

            int rawTotal = specialty + acuityFit + loadBalance + bonus;
            int total = Math.max(0, Math.min(100, rawTotal));

            scored.add(new ScoredBed(bed, total, Math.max(0, specialty), Math.max(0, acuityFit), loadBalance, bonus));
        }

        scored.sort((a, b) -> Integer.compare(b.getTotal(), a.getTotal()));
        return scored.stream().limit(5).collect(Collectors.toList());
    }

    private String mapCategoryToDeptCode(String category, int acuity) {
        // Critical override: if acuity is 4 or 5, automatically target ICU regardless of minor category choice
        if (acuity >= 4) {
            return "icu";
        }
        if (category == null) return "gen";
        String lower = category.toLowerCase();
        if (lower.contains("emer") || lower.contains("trauma")) return "er";
        if (lower.contains("icu") || lower.contains("critical")) return "icu";
        if (lower.contains("ped")) return "ped";
        if (lower.contains("mat") || lower.contains("obstetric")) return "mat";
        if (lower.contains("surg")) return "sur";
        return "gen";
    }
}