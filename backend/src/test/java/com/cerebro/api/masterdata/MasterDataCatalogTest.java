package com.cerebro.api.masterdata;

import static org.assertj.core.api.Assertions.assertThat;

import com.cerebro.api.shared.Migrations;
import java.io.IOException;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class MasterDataCatalogTest {

  @Test
  void everySeededListIsInTheCatalogueWithItsSystemCodes() throws IOException {
    MasterDataCatalog catalog = new MasterDataCatalog();
    String sql = Migrations.all();
    var seeded =
        Pattern.compile("INSERT INTO master_data_items .* VALUES \\('([A-Za-z]+)', '([^']+)'")
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
