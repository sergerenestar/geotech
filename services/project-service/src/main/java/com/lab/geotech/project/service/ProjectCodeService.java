package com.lab.geotech.project.service;

import com.lab.geotech.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.Optional;

/**
 * Generates sequential project codes in the format {@code GT-YYYY-NNNN}.
 *
 * <p>The sequence restarts at 0001 each calendar year. The underlying query uses a native SQL
 * {@code SELECT ... LIKE 'GT-YYYY-%' ORDER BY project_code DESC LIMIT 1} which intentionally
 * bypasses the {@code @Where(is_deleted = false)} Hibernate filter, ensuring that soft-deleted
 * project codes are never reassigned to a new project.
 */
@Service
@RequiredArgsConstructor
public class ProjectCodeService {

    private final ProjectRepository projectRepository;

    /**
     * Returns the next available project code for the current calendar year.
     *
     * <p>Thread-safety note: the sequence increment is not atomic. Under concurrent project
     * creation a race condition could produce duplicate codes, which would be caught by the
     * {@code UNIQUE} constraint on {@code project_code}. Callers should handle the resulting
     * {@code DataIntegrityViolationException} and retry if necessary.
     */
    public String nextCode() {
        int year = Year.now().getValue();
        String prefix = "GT-" + year + "-%";
        Optional<String> lastCode = projectRepository.findLastCodeByPrefix(prefix);
        if (lastCode.isEmpty()) {
            return String.format("GT-%d-%04d", year, 1);
        }
        String last = lastCode.get();
        int seq = Integer.parseInt(last.substring(last.lastIndexOf('-') + 1));
        return String.format("GT-%d-%04d", year, seq + 1);
    }
}
