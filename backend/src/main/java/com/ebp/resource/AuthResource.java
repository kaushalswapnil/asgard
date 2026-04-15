package com.ebp.resource;

import com.ebp.dto.LoginRequest;
import com.ebp.dto.LoginResponse;
import com.ebp.entity.AppUser;
import com.ebp.service.AuthService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject AuthService authService;

    @POST
    @Path("/login")
    public LoginResponse login(LoginRequest req) {
        return authService.login(req);
    }

    @POST
    @Path("/logout")
    public Response logout(@Context HttpHeaders headers) {
        String token = headers.getHeaderString(HttpHeaders.AUTHORIZATION);
        if (token != null) authService.logout(token.replace("Bearer ", ""));
        return Response.ok().build();
    }

    @GET
    @Path("/me")
    public AppUser me(@Context HttpHeaders headers) {
        String token = headers.getHeaderString(HttpHeaders.AUTHORIZATION);
        AppUser user = authService.validate(token);
        if (user == null) throw new NotAuthorizedException("Invalid or expired session");
        return user;
    }
}
