package com.lab.geotech.project.dto;

import java.time.Instant;
import java.util.List;

/**
 * Generic paginated response envelope used by all list endpoints.
 *
 * <p>Front-end consumers can use {@code total} to calculate the number of pages and render
 * pagination controls. The {@code timestamp} field is included for cache-busting and
 * debugging purposes.
 *
 * @param <T> The type of items in {@code data}.
 */
public record PagedResponse<T>(
        List<T> data,
        /** Total number of matching records across all pages. */
        long total,
        /** Zero-based current page index. */
        int page,
        int pageSize,
        String timestamp
) {
    public static <T> PagedResponse<T> of(List<T> data, long total, int page, int pageSize) {
        return new PagedResponse<>(data, total, page, pageSize, Instant.now().toString());
    }
}
