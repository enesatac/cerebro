package com.cerebro.api.shared;

import java.net.URI;
import java.net.URISyntaxException;
import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/** Text rules shared with the frontend ({@code lib/search.ts}, {@code lib/validation.ts}). */
public final class Texts {

  private static final Locale TURKISH = Locale.forLanguageTag("tr-TR");
  private static final Pattern COMBINING_MARKS = Pattern.compile("[\\u0300-\\u036f]");

  private static final List<Pattern> SECRET_PATTERNS =
      List.of(
          Pattern.compile("\\bpass(word|wd)?\\s*[:=]", Pattern.CASE_INSENSITIVE),
          Pattern.compile(
              "\\b(api[_-]?key|secret|token|client[_-]?secret)\\s*[:=]", Pattern.CASE_INSENSITIVE),
          Pattern.compile("-----BEGIN [A-Z ]*PRIVATE KEY-----"),
          Pattern.compile("\\b[a-z][a-z0-9+.-]*://[^/\\s:@]+:[^/\\s@]+@", Pattern.CASE_INSENSITIVE));

  public static final String NO_SECRETS_MESSAGE =
      "Bu bir kimlik bilgisine benziyor. Cerebro asla şifre, token veya anahtar saklamamalı —"
          + " bunun yerine secrets manager'a referans verin.";

  private Texts() {}

  /**
   * Case-insensitive comparison key for uniqueness checks: Turkish I/İ/ı/i compare equal ("İŞ" and
   * "iş" are the same name).
   */
  public static String foldForCompare(String value) {
    return value == null ? "" : value.trim().toLowerCase(TURKISH).replace('ı', 'i');
  }

  /** Search key: case-insensitive (Turkish-aware) and accent-free, as {@code foldForSearch}. */
  public static String foldForSearch(String value) {
    if (value == null) {
      return "";
    }
    String withoutMarks =
        COMBINING_MARKS.matcher(Normalizer.normalize(value, Normalizer.Form.NFD)).replaceAll("");
    return withoutMarks.toLowerCase(TURKISH).replace('ı', 'i').trim();
  }

  /** "Contains" search across fields; an empty term matches everything. */
  public static boolean matchesSearch(String term, List<String> fields) {
    String needle = foldForSearch(term);
    if (needle.isEmpty()) {
      return true;
    }
    return fields.stream().anyMatch(field -> field != null && foldForSearch(field).contains(needle));
  }

  /** Cerebro never stores credentials: passwords, tokens, keys or URLs with embedded logins. */
  public static boolean looksLikeSecret(String value) {
    return value != null && SECRET_PATTERNS.stream().anyMatch(p -> p.matcher(value).find());
  }

  /** Only http(s) links are stored — never {@code javascript:}, {@code data:} or other schemes. */
  public static boolean isHttpUrl(String value) {
    if (value == null || value.isBlank()) {
      return false;
    }
    try {
      URI uri = new URI(value.trim().replace(" ", "%20"));
      String scheme = uri.getScheme();
      return scheme != null
          && (scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))
          && uri.getHost() != null;
    } catch (URISyntaxException e) {
      return false;
    }
  }
}
