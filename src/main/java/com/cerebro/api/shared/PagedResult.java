package com.cerebro.api.shared;

import java.util.List;

/** One page of a list; out-of-range pages are clamped to the last page, as the frontend expects. */
public record PagedResult<T>(List<T> items, int total, int page, int pageSize) {

  public static <T> PagedResult<T> of(List<T> rows, int page, int pageSize) {
    int size = Math.max(1, pageSize);
    int lastPage = Math.max(0, (int) Math.ceil(rows.size() / (double) size) - 1);
    int safePage = Math.min(Math.max(0, page), lastPage);
    int from = Math.min(rows.size(), safePage * size);
    int to = Math.min(rows.size(), from + size);
    return new PagedResult<>(List.copyOf(rows.subList(from, to)), rows.size(), safePage, size);
  }
}
