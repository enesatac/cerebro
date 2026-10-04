package com.cerebro.api.masterdata;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

class MasterDataCatalogTest {

  @Test
  void everySeededListIsInTheCatalogueWithItsSystemCodes() throws IOException {
    MasterDataCatalog catalog = new MasterDataCatalog();
    String sql =
        new ClassPathResource("db/migration/V3__master_data.sql")
            .getContentAsString(StandardCharsets.UTF_8);
    var seeded =
        Pattern.compile("\\('([A-Za-z]+)', '([^']+)'")
            .matcher(sql)
            .results()
            .collect(
                Collectors.groupingBy(
                    m -> m.group(1), Collectors.mapping(m -> m.group(2), Collectors.toSet())));
    assertThat(catalog.lists()).hasSize(seeded.size());
    for (MasterDataCatalog.ListDefinition list : catalog.lists()) {
      assertThat(seeded.get(list.key())).as(list.key()).containsAll(list.systemCodes());
    }
  }
}
