package com.mislice.domain.auth;

import com.mislice.common.exception.ApiException;
import com.mislice.common.exception.DuplicateResourceException;
import com.mislice.domain.auth.dto.AuthResponse;
import com.mislice.domain.auth.dto.LoginRequest;
import com.mislice.domain.auth.dto.RefreshRequest;
import com.mislice.domain.auth.dto.RegisterRequest;
import com.mislice.domain.user.AccountStatus;
import com.mislice.domain.user.Role;
import com.mislice.domain.user.User;
import com.mislice.domain.user.UserMapper;
import com.mislice.domain.user.UserRepository;
import com.mislice.security.JwtProperties;
import com.mislice.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final UserMapper userMapper;
    private final AuthenticationManager authenticationManager;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new DuplicateResourceException("Email already registered: " + req.email());
        }
        Role role = resolveSelfAssignableRole(req.requestedRole());

        User user = User.builder()
                .email(req.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(req.password()))
                .fullName(req.fullName())
                .phone(req.phone())
                .roles(Set.of(role))
                // In production, ACTIVE only after email verification; kept ACTIVE here for the MVP flow.
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(false)
                .build();
        userRepository.save(user);

        return issueTokens(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.email(), req.password()));
        } catch (BadCredentialsException e) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email or password");
        }
        User user = userRepository.findByEmailIgnoreCaseAndDeletedFalse(req.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid email or password"));
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest req) {
        String hash = sha256(req.refreshToken());
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "Refresh token not recognized"));
        if (!stored.isActive()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "EXPIRED_REFRESH_TOKEN", "Refresh token expired or revoked");
        }
        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "User no longer exists"));

        // Rotate: revoke the used token, issue a fresh pair.
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        return issueTokens(user);
    }

    @Transactional
    public void logout(UUID userId) {
        refreshTokenRepository.revokeAllForUser(userId);
    }

    @Transactional
    public void logoutByEmail(String email) {
        userRepository.findByEmailIgnoreCaseAndDeletedFalse(email)
                .ifPresent(u -> refreshTokenRepository.revokeAllForUser(u.getId()));
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private AuthResponse issueTokens(User user) {
        List<String> roleAuthorities = user.getRoles().stream().map(r -> "ROLE_" + r.name()).toList();
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), roleAuthorities);

        String rawRefresh = generateRawRefreshToken();
        RefreshToken refresh = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(sha256(rawRefresh))
                .expiresAt(Instant.now().plus(jwtProperties.refreshTokenTtlDays(), ChronoUnit.DAYS))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refresh);

        return new AuthResponse(
                accessToken,
                rawRefresh,
                "Bearer",
                jwtProperties.accessTokenTtlMinutes() * 60,
                userMapper.toDto(user));
    }

    private Role resolveSelfAssignableRole(Role requested) {
        if (requested == null || requested == Role.ADMIN) {
            return Role.CUSTOMER; // ADMIN is provisioned out-of-band, never via public registration
        }
        return requested;
    }

    private String generateRawRefreshToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
