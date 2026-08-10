package com.hospital.bedflow.repository;

import com.hospital.bedflow.model.Bed;
import com.hospital.bedflow.model.BedStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BedRepository extends JpaRepository<Bed, String> {
    
    // Custom query method: finds beds by department ID
    List<Bed> findByDept(String dept);
    
    // Custom query method: finds beds by status (e.g., AVAILABLE)
    List<Bed> findByStatus(BedStatus status);
}