package com.cerebro.api.search;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** {@code SearchRepository}. */
@RestController
@RequestMapping("/api/search")
@Tag(name = "Arama")
public class SearchController {

  private final SearchService service;

  public SearchController(SearchService service) {
    this.service = service;
  }

  @GetMapping
  public List<SearchResult> search(
      @RequestParam(defaultValue = "") String term,
      @RequestParam(required = false) List<String> kinds,
      @RequestParam(required = false) Integer limit) {
    return service.search(term, kinds, limit);
  }
}
