package com.ebp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_session")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class UserSession extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    public AppUser user;

    public String token;

    @Column(name = "expires_at")
    public LocalDateTime expiresAt;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    public static UserSession findByToken(String token) {
        return find("token = ?1 and expiresAt > ?2", token, LocalDateTime.now()).firstResult();
    }
}
