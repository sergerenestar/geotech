package com.lab.geotech.project.service;

import com.lab.geotech.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProjectCodeService {

    private final ProjectRepository projectRepository;

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
