package com.ebp.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "store_secondary_schedule")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class StoreSecondarySchedule extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "location_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    public Location location;

    @Column(name = "schedule_date")
    public LocalDate scheduleDate;

    @Column(name = "day_of_week")
    public Integer dayOfWeek;

    @Column(name = "start_time")
    public LocalTime startTime;

    @Column(name = "end_time")
    public LocalTime endTime;

    public String notes;
}
