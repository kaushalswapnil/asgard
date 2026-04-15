package com.ebp.resource;

import com.ebp.entity.Location;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.List;

@Path("/api/locations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LocationResource {

    @GET
    public List<Location> all() {
        return Location.listAll();
    }

    @GET
    @Path("/{id}")
    public Location get(@PathParam("id") Long id) {
        Location loc = Location.findById(id);
        if (loc == null) throw new NotFoundException("Location not found");
        return loc;
    }

    @GET
    @Path("/region/{region}")
    public List<Location> byRegion(@PathParam("region") String region) {
        return Location.list("region", region);
    }
}
