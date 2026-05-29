package com.lab.geotech.auth.dto;

import java.time.Instant;
import java.util.List;

public record PagedResponse<T>(
        List<T> data,
        long total,
        int page,
        int pageSize,
        String timestamp
) {
    public static <T> PagedResponse<T> of(List<T> data, long total, int page, int pageSize) {
        return new PagedResponse<>(data, total, page, pageSize, Instant.now().toString());
    }
}
