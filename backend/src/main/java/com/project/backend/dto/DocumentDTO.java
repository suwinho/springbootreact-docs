package com.project.backend.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record DocumentDTO(
    UUID id,
    String title,
    String ownerUsername,   
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}