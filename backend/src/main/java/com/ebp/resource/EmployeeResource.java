package com.ebp.resource;

import com.ebp.entity.Employee;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/employees")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EmployeeResource {

    @GET
    public List<Employee> all(@QueryParam("locationId") Long locationId) {
        if (locationId != null) {
            return Employee.list("location.id = ?1 and isActive = true", locationId);
        }
        return Employee.list("isActive = true");
    }

    @GET
    @Path("/{id}")
    public Employee get(@PathParam("id") Long id) {
        Employee emp = Employee.findById(id);
        if (emp == null) throw new NotFoundException("Employee not found");
        return emp;
    }
}
