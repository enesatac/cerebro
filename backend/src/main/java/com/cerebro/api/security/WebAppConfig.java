package com.cerebro.api.security;

import java.io.IOException;
import java.time.Duration;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Serves the web app built into {@code classpath:/static} (the frontend's {@code dist}). Hashed
 * files under {@code /assets} are cached for a year; any other path that is not a file and not the
 * API gets {@code index.html}, never cached, so client-side routes survive a reload and a deploy is
 * picked up at once.
 */
@Configuration
class WebAppConfig implements WebMvcConfigurer {

  private static final String STATIC = "classpath:/static/";

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    registry
        .addResourceHandler("/assets/**")
        .addResourceLocations(STATIC + "assets/")
        .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());
    registry
        .addResourceHandler("/**")
        .addResourceLocations(STATIC)
        .setCacheControl(CacheControl.noCache())
        .resourceChain(false)
        .addResolver(new SpaResolver());
  }

  /** Files as they are; client-side routes fall back to {@code index.html}. */
  private static final class SpaResolver extends PathResourceResolver {

    @Override
    protected Resource getResource(String path, Resource location) throws IOException {
      Resource file = location.createRelative(path);
      if (file.exists() && file.isReadable()) {
        return file;
      }
      boolean route =
          !path.startsWith("api/")
              && !path.startsWith("actuator/")
              && !path.startsWith("oauth2/")
              && !path.startsWith("login/")
              && !path.substring(path.lastIndexOf('/') + 1).contains(".");
      Resource index = new ClassPathResource("/static/index.html");
      return route && index.exists() ? index : null;
    }
  }
}
