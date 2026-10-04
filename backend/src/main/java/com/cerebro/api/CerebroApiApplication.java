package com.cerebro.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class CerebroApiApplication {

  public static void main(String[] args) {
    SpringApplication.run(CerebroApiApplication.class, args);
  }
}
