package com.mislice.domain.user.dto;

import java.util.UUID;

public record AddressDto(
        UUID id,
        String label,
        String line1,
        String line2,
        String city,
        String state,
        String postalCode,
        Double latitude,
        Double longitude,
        boolean defaultAddress
) {}
