package com.cerebro.api.shared;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Comparator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

/** The Flyway migrations as one text, in version order (for catalogue tests). */
public final class Migrations {

  private static final Pattern VERSION = Pattern.compile("^V(\\d+)__");

  private Migrations() {}

  public static String all() throws IOException {
    Resource[] files =
        new PathMatchingResourcePatternResolver().getResources("classpath:db/migration/V*.sql");
    StringBuilder sql = new StringBuilder();
    for (Resource file :
        Arrays.stream(files).sorted(Comparator.comparingInt(Migrations::version)).toList()) {
      sql.append(file.getContentAsString(StandardCharsets.UTF_8)).append('\n');
    }
    return sql.toString();
  }

  private static int version(Resource file) {
    Matcher matcher = VERSION.matcher(String.valueOf(file.getFilename()));
    return matcher.find() ? Integer.parseInt(matcher.group(1)) : Integer.MAX_VALUE;
  }
}
