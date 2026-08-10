package com.hospital.bedflow.repository;

import com.hospital.bedflow.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, String> {
    // Basic CRUD operations are inherited automatically from JpaRepository!
}