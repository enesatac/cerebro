package com.cerebro.api.shared;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.function.Function;

/**
 * Turkish alphabetical order for names and titles, the same as the browser's {@code
 * localeCompare(…, 'tr')}: Ç after C, I before İ, Ö after O…; spaces and punctuation sort before
 * digits and letters (the JDK collator would ignore them, putting "E-Ticaret" after "Entegrasyon").
 * Letters compare case- and accent-insensitively first; case breaks ties, lower case first.
 */
public final class Collation {

  private static final String ALPHABET = "abcçdefgğhıijklmnoöpqrsştuüvwxyz";

  private Collation() {}

  public static int compare(String a, String b) {
    String x = a == null ? "" : a;
    String y = b == null ? "" : b;
    int length = Math.min(x.length(), y.length());
    for (int i = 0; i < length; i++) {
      int result = Integer.compare(primary(x.charAt(i)), primary(y.charAt(i)));
      if (result != 0) {
        return result;
      }
    }
    if (x.length() != y.length()) {
      return Integer.compare(x.length(), y.length());
    }
    for (int i = 0; i < length; i++) {
      int result = Integer.compare(tertiary(x.charAt(i)), tertiary(y.charAt(i)));
      if (result != 0) {
        return result;
      }
    }
    return x.compareTo(y);
  }

  public static <T> Comparator<T> by(Function<T, String> key) {
    return (a, b) -> compare(key.apply(a), key.apply(b));
  }

  /** Spaces, then punctuation and symbols, then digits, then letters in Turkish order. */
  private static int primary(char c) {
    if (Character.isWhitespace(c)) {
      return 0;
    }
    if (Character.isDigit(c)) {
      return 100_000 + Character.digit(c, 10);
    }
    if (Character.isLetter(c)) {
      int index = ALPHABET.indexOf(lower(c));
      if (index < 0) {
        index = ALPHABET.indexOf(base(lower(c)));
      }
      return index < 0 ? 300_000 + c : 200_000 + index;
    }
    return 1 + c;
  }

  /** Lower case before upper case, as ICU does. */
  private static int tertiary(char c) {
    return Character.isUpperCase(c) ? 1 : 0;
  }

  private static char lower(char c) {
    return switch (c) {
      case 'I' -> 'ı';
      case 'İ' -> 'i';
      default -> Character.toLowerCase(c);
    };
  }

  /** The letter without accents (é → e), for letters outside the Turkish alphabet. */
  private static char base(char c) {
    String stripped =
        Normalizer.normalize(String.valueOf(c), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    return stripped.isEmpty() ? c : stripped.charAt(0);
  }
}
