package com.cerebro.api.shared;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

/** The rules shared with the frontend behave the same way here. */
class TextsTest {

  @Test
  void foldsTurkishCaseForUniqueness() {
    assertThat(Texts.foldForCompare(" İŞ ")).isEqualTo(Texts.foldForCompare("iş"));
    assertThat(Texts.foldForCompare("IŞIK")).isEqualTo(Texts.foldForCompare("ışık"));
  }

  @Test
  void searchesWithoutCaseOrAccents() {
    assertThat(Texts.matchesSearch("ODE", List.of("Ödeme Geçidi"))).isTrue();
    assertThat(Texts.matchesSearch("gecidi", List.of("Ödeme Geçidi"))).isTrue();
    assertThat(Texts.matchesSearch("", List.of("x"))).isTrue();
    assertThat(Texts.matchesSearch("zz", List.of("Ödeme"))).isFalse();
  }

  @Test
  void spotsCredentials() {
    assertThat(Texts.looksLikeSecret("password: hunter2")).isTrue();
    assertThat(Texts.looksLikeSecret("API_KEY=abc")).isTrue();
    assertThat(Texts.looksLikeSecret("postgres://user:pass@db.example/x")).isTrue();
    assertThat(Texts.looksLikeSecret("Şifre politikasını gözden geçir")).isFalse();
  }

  @Test
  void acceptsOnlyHttpLinks() {
    assertThat(Texts.isHttpUrl("https://wiki.example/a b")).isTrue();
    assertThat(Texts.isHttpUrl("javascript:alert(1)")).isFalse();
    assertThat(Texts.isHttpUrl("ftp://x.example")).isFalse();
    assertThat(Texts.isHttpUrl("wiki")).isFalse();
  }

  @Test
  void formatsRangesLikeTheFrontend() {
    LocalDate oct1 = LocalDate.of(2026, 10, 1);
    assertThat(DisplayDates.range(oct1, LocalDate.of(2026, 10, 5))).isEqualTo("1–5 Eki 2026");
    assertThat(DisplayDates.range(LocalDate.of(2026, 9, 28), LocalDate.of(2026, 10, 3)))
        .isEqualTo("28 Eyl – 3 Eki 2026");
    assertThat(DisplayDates.range(LocalDate.of(2026, 12, 29), LocalDate.of(2027, 1, 2)))
        .isEqualTo("29 Ara 2026 – 2 Oca 2027");
    assertThat(DisplayDates.range(oct1, oct1)).isEqualTo("1 Eki 2026");
  }

  @Test
  void writesTimestampsLikeToIsoString() {
    assertThat(Times.timestamp(java.time.Instant.parse("2026-03-14T09:30:00Z")))
        .isEqualTo("2026-03-14T09:30:00.000Z");
    assertThat(Times.isIsoDate("2026-02-30")).isFalse();
    assertThat(Times.isIsoDate("2026-02-28")).isTrue();
  }

  @Test
  void clampsPages() {
    PagedResult<Integer> page = PagedResult.of(List.of(1, 2, 3, 4, 5), 9, 2);
    assertThat(page.page()).isEqualTo(2);
    assertThat(page.items()).containsExactly(5);
    assertThat(page.total()).isEqualTo(5);
  }
}
