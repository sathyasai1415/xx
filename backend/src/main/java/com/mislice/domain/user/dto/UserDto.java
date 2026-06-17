package com.mislice.domain.user.dto;

import com.mislice.domain.user.AccountStatus;
import com.mislice.domain.user.Role;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public record UserDto(
        UUID id,
        String email,
        String fullName,
        String phone,
        Set<Role> roles,
        AccountStatus accountStatus,
        boolean emailVerified,
        boolean vegetarian,
        String preferredCrust,
        List<AddressDto> addresses
) {}
