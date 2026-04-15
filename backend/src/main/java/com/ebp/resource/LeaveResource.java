package com.ebp.resource;

import com.ebp.entity.EmployeeHalfDayLeave;
import com.ebp.entity.EmployeeLeave;
import com.ebp.entity.LocationHoliday;
import com.ebp.repository.EmployeeHalfDayLeaveRepository;
import com.ebp.repository.EmployeeLeaveRepository;
import com.ebp.repository.LocationHolidayRepository;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.time.LocalDate;
import java.util.List;

@Path("/api/leaves")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LeaveResource {

    @Inject EmployeeLeaveRepository leaveRepo;
    @Inject EmployeeHalfDayLeaveRepository halfLeaveRepo;
    @Inject LocationHolidayRepository holidayRepo;

    @GET
    @Path("/employee/{employeeId}")
    public List<EmployeeLeave> byEmployee(@PathParam("employeeId") Long employeeId) {
        return leaveRepo.findByEmployee(employeeId);
    }

    @GET
    @Path("/employee/{employeeId}/half-day")
    public List<EmployeeHalfDayLeave> halfDayByEmployee(@PathParam("employeeId") Long employeeId) {
        return halfLeaveRepo.findByEmployee(employeeId);
    }

    @GET
    @Path("/store/{locationId}")
    public List<EmployeeLeave> byStore(
            @PathParam("locationId") Long locationId,
            @QueryParam("from") String from,
            @QueryParam("to")   String to) {
        LocalDate dateFrom = from != null ? LocalDate.parse(from) : LocalDate.now().minusMonths(3);
        LocalDate dateTo   = to   != null ? LocalDate.parse(to)   : LocalDate.now().plusMonths(1);
        return leaveRepo.findByLocationAndDateRange(locationId, dateFrom, dateTo);
    }

    @GET
    @Path("/holidays/{locationId}")
    public List<LocationHoliday> holidays(
            @PathParam("locationId") Long locationId,
            @QueryParam("from") String from,
            @QueryParam("to")   String to) {
        LocalDate dateFrom = from != null ? LocalDate.parse(from) : LocalDate.now();
        LocalDate dateTo   = to   != null ? LocalDate.parse(to)   : LocalDate.now().plusMonths(3);
        return holidayRepo.findUpcoming(locationId, dateFrom, dateTo);
    }
}
