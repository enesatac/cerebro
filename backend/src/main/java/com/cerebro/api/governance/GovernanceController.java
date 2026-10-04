package com.cerebro.api.governance;

import com.cerebro.api.governance.GovernanceModels.ApplicationHealthRow;
import com.cerebro.api.governance.GovernanceModels.PortfolioOverview;
import com.cerebro.api.governance.GovernanceModels.PortfolioTrends;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** {@code GovernanceRepository}: dashboard and report aggregates. */
@RestController
@RequestMapping("/api/governance")
@Tag(name = "Gösterge paneli ve raporlar")
public class GovernanceController {

  private final GovernanceService service;

  public GovernanceController(GovernanceService service) {
    this.service = service;
  }

  @GetMapping("/overview")
  public PortfolioOverview overview() {
    return service.overview();
  }

  @GetMapping("/application-health")
  public List<ApplicationHealthRow> applicationHealth() {
    return service.healthReport();
  }

  /** {@code months} whole months starting at {@code from} (a 1st); {@code today} for "now". */
  @GetMapping("/trends")
  public PortfolioTrends trends(
      @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate from,
      @RequestParam int months,
      @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate today) {
    return service.trends(from, Math.min(months, 60), today);
  }
}
