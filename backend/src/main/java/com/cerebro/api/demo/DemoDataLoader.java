package com.cerebro.api.demo;

import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Local development and demos: fills an empty database with the fictional organisation the
 * frontend mock uses ({@code demo/demo-data.sql}), so every screen has something to show. Never
 * touches a database that already has people or accounts. Enabled by {@code cerebro.demo-data}.
 */
@Component
@Order(0)
@ConditionalOnProperty(name = "cerebro.demo-data", havingValue = "true")
class DemoDataLoader implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(DemoDataLoader.class);

  private final JdbcClient jdbc;
  private final DataSource dataSource;

  DemoDataLoader(JdbcClient jdbc, DataSource dataSource) {
    this.jdbc = jdbc;
    this.dataSource = dataSource;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    boolean empty =
        jdbc.sql(
                "SELECT NOT EXISTS (SELECT 1 FROM people) AND NOT EXISTS (SELECT 1 FROM"
                    + " user_accounts)")
            .query(Boolean.class)
            .single();
    if (!empty) {
      return;
    }
    ResourceDatabasePopulator populator =
        new ResourceDatabasePopulator(new ClassPathResource("demo/demo-data.sql"));
    populator.setSqlScriptEncoding("UTF-8");
    populator.execute(dataSource);
    log.warn("Loaded the demo data set (cerebro.demo-data=true)");
  }
}
