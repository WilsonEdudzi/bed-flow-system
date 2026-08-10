package com.hospital.bedflow.config;

import com.hospital.bedflow.model.Bed;
import com.hospital.bedflow.model.BedStatus;
import com.hospital.bedflow.model.Department;
import com.hospital.bedflow.repository.BedRepository;
import com.hospital.bedflow.repository.DepartmentRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final BedRepository bedRepository;

    public DataSeeder(DepartmentRepository departmentRepository, BedRepository bedRepository) {
        this.departmentRepository = departmentRepository;
        this.bedRepository = bedRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Departments using explicit setters
        if (departmentRepository.count() == 0) {
            List<Department> departments = new ArrayList<>();

            departments.add(createDepartment("er", "Emergency", "ER", 16, 3, 5, 0.5));
            departments.add(createDepartment("icu", "Intensive Care", "ICU", 12, 4, 5, 1.0));
            departments.add(createDepartment("gen", "General Ward", "GEN", 40, 1, 3, 0.1));
            departments.add(createDepartment("ped", "Pediatrics", "PED", 12, 1, 3, 0.3));
            departments.add(createDepartment("mat", "Maternity", "MAT", 10, 1, 2, 0.0));
            departments.add(createDepartment("sur", "Surgical Recovery", "SUR", 10, 2, 4, 0.2));

            departmentRepository.saveAll(departments);
        }

        // 2. Generate exactly 100 Beds across departments
        if (bedRepository.count() == 0) {
            generateBedsForDept("er", 16);
            generateBedsForDept("icu", 12);
            generateBedsForDept("gen", 40);
            generateBedsForDept("ped", 12);
            generateBedsForDept("mat", 10);
            generateBedsForDept("sur", 10);
        }
    }

    private Department createDepartment(String id, String name, String shortName, int totalBeds, int minAcuity, int maxAcuity, double isolationCapable) {
        Department dept = new Department();
        dept.setId(id);
        dept.setName(name);
        dept.setShortName(shortName);
        dept.setTotalBeds(totalBeds);
        dept.setMinAcuity(minAcuity);
        dept.setMaxAcuity(maxAcuity);
        dept.setIsolationCapable(isolationCapable);
        return dept;
    }

    private void generateBedsForDept(String deptId, int count) {
        List<Bed> beds = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            String bedId = deptId.toUpperCase() + "-" + String.format("%02d", i);
            
            Bed bed = new Bed();
            bed.setId(bedId);
            bed.setDept(deptId);
            bed.setStatus(BedStatus.AVAILABLE);
            bed.setAcuity(1);
            bed.setIsolation(false);
            bed.setPatientName(null);
            bed.setAdmittedHoursAgo(null);
            
            beds.add(bed);
        }
        bedRepository.saveAll(beds);
    }
}