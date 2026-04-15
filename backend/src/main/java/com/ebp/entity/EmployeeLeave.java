package com.ebp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee_leave")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class EmployeeLeave extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "location"})
    public Employee employee;

    @Column(name = "leave_date")
    public LocalDate leaveDate;

    @Column(name = "leave_type")
    public String leaveType;

    public String status;

    @Column(name = "created_at")
    public LocalDateTime createdAt;
}
