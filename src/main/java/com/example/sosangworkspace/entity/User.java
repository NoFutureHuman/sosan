package com.example.sosangworkspace.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String email;

    @Column(nullable = false, name = "password_hash", length = 100)
    private String passwordHash;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(name = "business_type", length = 80)
    private String businessType;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
