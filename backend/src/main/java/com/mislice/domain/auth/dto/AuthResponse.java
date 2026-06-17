package com.mislice.domain.auth.dto;

import com.mislice.domain.user.dto.UserDto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        UserDto user
) {}
