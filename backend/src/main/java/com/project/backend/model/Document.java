package com.project.backend.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "documents")
@Getter @Setter
public class Document {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 500)
    private String title;
    
    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;
    
    @Column(columnDefinition = "jsonb", nullable = false)
    private String content = "{}";
    
    @Column(name = "content_snapshot", columnDefinition = "text")
    private String contentSnapshot;
    
    @Column(nullable = false)
    private Long version = 0L;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
}
