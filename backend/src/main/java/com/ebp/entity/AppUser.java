package com.ebp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_user")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class AppUser extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    public String username;

    @JsonIgnore
    @Column(name = "password_hash")
    public String passwordHash;

    @Column(name = "user_role")
    public String userRole;           // MANAGER | ADMIN

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "location"})
    public Employee employee;

    @Column(name = "full_name")
    public String fullName;

    public String email;

    @Column(name = "is_active")
    @JsonProperty("isActive")
    public boolean isActive;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    public static AppUser findByUsername(String username) {
        return find("username", username).firstResult();
    }
}
