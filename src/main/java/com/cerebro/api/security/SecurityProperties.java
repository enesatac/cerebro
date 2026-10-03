package com.cerebro.api.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param devAccountEmail local profile only: every request is authenticated as this account
 * @param bootstrapAdminEmail when no active user holds the system role, this email gets an account
 *     with it on startup (first deployment); ignored afterwards
 */
@ConfigurationProperties("cerebro.security")
public record SecurityProperties(String devAccountEmail, String bootstrapAdminEmail) {}
