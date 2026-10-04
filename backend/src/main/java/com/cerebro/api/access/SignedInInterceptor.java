package com.cerebro.api.access;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Every API call except the sign-in endpoints needs an active Cerebro account — an SSO identity
 * alone is not enough. Screen privileges are checked on top of this in each service.
 */
@Configuration
class SignedInInterceptor implements HandlerInterceptor, WebMvcConfigurer {

  private final CurrentUser currentUser;

  SignedInInterceptor(CurrentUser currentUser) {
    this.currentUser = currentUser;
  }

  @Override
  public boolean preHandle(
      HttpServletRequest request, HttpServletResponse response, Object handler) {
    currentUser.require();
    return true;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(this).addPathPatterns("/api/**").excludePathPatterns("/api/auth/**");
  }
}
