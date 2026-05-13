package com.project.backend.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
public class User {
    @Id
    private UUID id;
    private String username;
    private String email;
    private String displayName;
    private LocalDateTime createdAt;
}

