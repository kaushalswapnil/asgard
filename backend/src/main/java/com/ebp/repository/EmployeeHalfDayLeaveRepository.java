package com.ebp.repository;

import com.ebp.entity.EmployeeHalfDayLeave;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class EmployeeHalfDayLeaveRepository implements PanacheRepository<EmployeeHalfDayLeave> {

    public List<EmployeeHalfDayLeave> findByEmployee(Long employeeId) {
        return list("employee.id = ?1 order by leaveDate desc", employeeId);
    }
}
