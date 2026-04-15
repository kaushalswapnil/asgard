package com.ebp.service;

import com.ebp.dto.LoginRequest;
import com.ebp.dto.LoginResponse;
import com.ebp.entity.AppUser;
import com.ebp.entity.UserSession;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotAuthorizedException;
import org.mindrot.jbcrypt.BCrypt;

import java.time.LocalDateTime;
import java.util.UUID;

@ApplicationScoped
public class AuthService {

    @Transactional
    public LoginResponse login(LoginRequest req) {
        AppUser user = AppUser.findByUsername(req.username);
        if (user == null || !user.isActive)
            throw new NotAuthorizedException("Invalid credentials");

        if (!BCrypt.checkpw(req.password, user.passwordHash))
            throw new NotAuthorizedException("Invalid credentials");

        // Invalidate existing sessions for this user
        UserSession.<UserSession>list("user.id", user.id)
                .forEach(s -> s.delete());

        // Create new 24h session
        UserSession session = new UserSession();
        session.user      = user;
        session.token     = UUID.randomUUID().toString().replace("-", "");
        session.expiresAt = LocalDateTime.now().plusHours(24);
        session.createdAt = LocalDateTime.now();
        session.persist();

        Long   locationId   = null;
        String locationName = null;
        if ("MANAGER".equals(user.userRole) && user.employee != null
                && user.employee.location != null) {
            locationId   = user.employee.location.id;
            locationName = user.employee.location.name;
        }

        return new LoginResponse(session.token, user.userRole, user.fullName,
                user.email, user.id, locationId, locationName);
    }

    @Transactional
    public void logout(String token) {
        UserSession session = UserSession.findByToken(token);
        if (session != null) session.delete();
    }

    public AppUser validate(String token) {
        if (token == null) return null;
        String raw = token.startsWith("Bearer ") ? token.substring(7) : token;
        UserSession session = UserSession.findByToken(raw);
        return session != null ? session.user : null;
    }
}
