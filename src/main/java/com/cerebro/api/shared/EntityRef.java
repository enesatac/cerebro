package com.cerebro.api.shared;

/** A resolved reference to another record, used inside read models. */
public record EntityRef(long id, String name) {}
