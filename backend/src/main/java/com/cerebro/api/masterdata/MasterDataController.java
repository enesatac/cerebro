package com.cerebro.api.masterdata;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** {@code MasterDataRepository}. */
@RestController
@RequestMapping("/api/master-data")
@Tag(name = "Ana veriler")
public class MasterDataController {

  private final MasterDataService service;

  public MasterDataController(MasterDataService service) {
    this.service = service;
  }

  @GetMapping
  public List<MasterDataItem.List> listAll() {
    return service.listAll();
  }

  @GetMapping("/{key}/usage")
  public Map<String, Integer> usage(@PathVariable String key) {
    return service.usage(key);
  }

  @PutMapping("/{key}")
  public MasterDataItem.List update(
      @PathVariable String key, @RequestBody List<MasterDataItem> items) {
    return service.update(key, items);
  }
}
