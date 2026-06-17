package com.mislice.security;

import com.mislice.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/** Convenience accessors for the authenticated principal (the user's email). */
public final class SecurityUtils {

    private SecurityUtils() {}

    public static String currentUserEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "No authenticated user");
        }
        return auth.getName();
    }
}
