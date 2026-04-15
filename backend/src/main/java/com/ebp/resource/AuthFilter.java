package com.ebp.resource;

import com.ebp.entity.AppUser;
import com.ebp.service.AuthService;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Provider
public class AuthFilter implements ContainerRequestFilter {

    @Inject AuthService authService;
    
    @ConfigProperty(name = "quarkus.profile", defaultValue = "prod")
    String profile;

    @Override
    public void filter(ContainerRequestContext ctx) {
        String path = ctx.getUriInfo().getPath();

        // Allow auth endpoints and OPTIONS preflight through
        if (path.contains("auth/login") || path.contains("auth/logout") || path.contains("auth/me") || ctx.getMethod().equals("OPTIONS")) return;

        // Skip auth in dev mode for testing
        if ("dev".equals(profile)) return;

        String header = ctx.getHeaderString(HttpHeaders.AUTHORIZATION);
        AppUser user  = authService.validate(header);
        if (user == null) throw new NotAuthorizedException("Missing or invalid token");

        // Inject user into request properties for downstream use if needed
        ctx.setProperty("currentUser", user);
    }
}
