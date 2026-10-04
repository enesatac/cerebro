package com.cerebro.api.masterdata;

/**
 * One value of a list (a row of {@code master_data_items}). Records reference it by {@code code},
 * which never changes; everything else is presentation an administrator can edit. {@code id} is
 * {@code null} for a value being added.
 */
public record MasterDataItem(
    Long id, String code, String label, String description, String variant, boolean active) {

  public record List(String key, java.util.List<MasterDataItem> items) {}
}
