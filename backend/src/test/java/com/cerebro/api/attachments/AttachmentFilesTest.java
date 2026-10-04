package com.cerebro.api.attachments;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AttachmentFilesTest {

  @Test
  void keepsOnlyTheBaseNameWithoutUnsafeCharacters() {
    assertThat(AttachmentService.sanitize("C:\\temp\\../Mimari <v2>.pdf")).isEqualTo("Mimari v2.pdf");
    assertThat(AttachmentService.sanitize("  Ödeme   planı.xlsx ")).isEqualTo("Ödeme planı.xlsx");
  }

  @Test
  void readsTheExtension() {
    assertThat(AttachmentService.extensionOf("rapor.PDF")).isEqualTo("pdf");
    assertThat(AttachmentService.extensionOf("arsiv")).isEmpty();
    assertThat(AttachmentService.ALLOWED_EXTENSIONS).doesNotContain("svg", "html", "exe");
  }
}
