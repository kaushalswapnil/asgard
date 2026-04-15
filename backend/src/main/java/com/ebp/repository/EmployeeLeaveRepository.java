package com.ebp.repository;

import com.ebp.entity.EmployeeLeave;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class EmployeeLeaveRepository implements PanacheRepository<EmployeeLeave> {

    public List<EmployeeLeave> findByEmployee(Long employeeId) {
        return list("employee.id = ?1 order by leaveDate desc", employeeId);
    }

    public List<EmployeeLeave> findByLocationAndDateRange(Long locationId, LocalDate from, LocalDate to) {
        return list("""
            select l from EmployeeLeave l
            where l.employee.location.id = ?1
            and l.leaveDate between ?2 and ?3
            and l.status = 'APPROVED'
            order by l.leaveDate
            """, locationId, from, to);
    }

    public List<EmployeeLeave> findApprovedByEmployee(Long employeeId) {
        return list("employee.id = ?1 and status = 'APPROVED' order by leaveDate", employeeId);
    }
}
