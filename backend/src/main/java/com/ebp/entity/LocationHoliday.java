package com.ebp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "location_holiday")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class LocationHoliday extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "location_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    public Location location;

    @Column(name = "holiday_date")
    public LocalDate holidayDate;

    @Column(name = "holiday_name")
    public String holidayName;
}
