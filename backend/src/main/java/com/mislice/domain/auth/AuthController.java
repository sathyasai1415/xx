package com.mislice.domain.auth;

import com.mislice.domain.auth.dto.AuthResponse;
import com.mislice.domain.auth.dto.LoginRequest;
import com.mislice.domain.auth.dto.RefreshRequest;
import com.mislice.domain.auth.dto.RegisterRequest;
import com.mislice.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Registration, login, token refresh, logout")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new account (CUSTOMER, RESTAURANT_OWNER or DELIVERY_PARTNER)")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @Operation(summary = "Authenticate and receive access + refresh tokens")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @Operation(summary = "Exchange a valid refresh token for a new token pair (rotating)")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(authService.refresh(request));
    }

    @Operation(summary = "Revoke all refresh tokens for the current user")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        authService.logoutByEmail(SecurityUtils.currentUserEmail());
        return ResponseEntity.noContent().build();
    }
}
