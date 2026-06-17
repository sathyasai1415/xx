package com.mislice.domain.auth.dto;

import com.mislice.domain.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 30) String phone,
        // Optional: defaults to CUSTOMER if null. RESTAURANT_OWNER/DELIVERY_PARTNER allowed; ADMIN is never self-assignable.
        Role requestedRole
) {}
