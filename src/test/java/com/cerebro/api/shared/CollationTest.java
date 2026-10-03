package com.cerebro.api.shared;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class CollationTest {

  @Test
  void sortsLikeTheBrowsersTurkishCollation() {
    List<String> names =
        new ArrayList<>(
            List.of(
                "Veri Platformu",
                "Entegrasyon Servisleri",
                "Ödeme",
                "E-Ticaret Mühendisliği",
                "Çalışma Ortamı",
                "Işık",
                "İnsan",
                "Cep",
                "Odak",
                "ali",
                "Ali"));
    names.sort(Collation::compare);
    assertThat(names)
        .containsExactly(
            "ali",
            "Ali",
            "Cep",
            "Çalışma Ortamı",
            "E-Ticaret Mühendisliği",
            "Entegrasyon Servisleri",
            "Işık",
            "İnsan",
            "Odak",
            "Ödeme",
            "Veri Platformu");
  }
}
