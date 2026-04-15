package com.ebp.repository;

import com.ebp.entity.LocationHoliday;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.util.List;

@ApplicationScoped
public class LocationHolidayRepository implements PanacheRepository<LocationHoliday> {

    public List<LocationHoliday> findUpcoming(Long locationId, LocalDate from, LocalDate to) {
        return list("location.id = ?1 and holidayDate between ?2 and ?3 order by holidayDate",
                locationId, from, to);
    }
}
