package com.mislice.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "mislice.cors")
public record CorsProperties(List<String> allowedOrigins) {}
