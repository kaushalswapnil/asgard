package com.ebp.dto;

public class LoginResponse {
    public String token;
    public String userRole;
    public String fullName;
    public String email;
    public Long   userId;
    public Long   locationId;    // set for MANAGER, null for ADMIN
    public String locationName;  // set for MANAGER, null for ADMIN

    public LoginResponse(String token, String userRole, String fullName,
                         String email, Long userId, Long locationId, String locationName) {
        this.token        = token;
        this.userRole     = userRole;
        this.fullName     = fullName;
        this.email        = email;
        this.userId       = userId;
        this.locationId   = locationId;
        this.locationName = locationName;
    }
}
