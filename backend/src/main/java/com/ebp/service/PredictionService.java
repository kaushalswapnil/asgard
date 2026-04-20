package com.ebp.service;

import com.ebp.dto.PredictedLeave;
import com.ebp.dto.StorePrediction;
import com.ebp.entity.Employee;
import com.ebp.entity.EmployeeLeave;
import com.ebp.entity.LocationHoliday;
import com.ebp.repository.EmployeeLeaveRepository;
import com.ebp.repository.LocationHolidayRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDate;
import java.time.Month;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Locale;

@ApplicationScoped
public class PredictionService {

    @Inject EmployeeLeaveRepository leaveRepo;
    @Inject LocationHolidayRepository holidayRepo;

    // ---------------------------------------------------------------
    // Predict upcoming leaves for all employees in a store
    // Returns top N employees most likely to take leave in next windowDays
    // ---------------------------------------------------------------
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    public StorePrediction predictForStore(Long locationId, int windowDays, int topN) {
        LocalDate today = LocalDate.now(IST);
        LocalDate windowEnd = today.plusDays(windowDays);

        List<Employee> employees = Employee.list("location.id = ?1 and isActive = true", locationId);

        List<LocationHoliday> holidays = holidayRepo.findUpcoming(locationId, today, windowEnd);
        List<String> holidayLabels = holidays.stream()
                .map(h -> h.holidayDate + " - " + h.holidayName)
                .toList();

        // Step 1: get the first (soonest) prediction per employee to rank them
        List<PredictedLeave> firstPredictions = new ArrayList<>();
        Map<Long, List<PredictedLeave>> allByEmployee = new LinkedHashMap<>();

        for (Employee emp : employees) {
            List<EmployeeLeave> history = leaveRepo.findApprovedByEmployee(emp.id);
            if (history.isEmpty()) continue;
            List<PredictedLeave> empPredictions = predictAllLeaves(emp, history, today, windowEnd, holidays);
            if (empPredictions.isEmpty()) continue;
            // Sort each employee's predictions by date
            empPredictions.sort(Comparator.comparing(p -> p.predictedDate));
            allByEmployee.put(emp.id, empPredictions);
            firstPredictions.add(empPredictions.get(0));
        }

        // Step 2: rank employees by their first prediction's confidence desc, take topN employees
        firstPredictions.sort(Comparator.comparingDouble((PredictedLeave p) -> p.confidence).reversed());
        List<Long> topEmployeeIds = firstPredictions.stream()
                .limit(topN)
                .map(p -> p.employeeId)
                .toList();

        // Step 3: collect ALL predictions for the top N employees, sorted by confidence desc then date
        List<PredictedLeave> result = topEmployeeIds.stream()
                .flatMap(id -> allByEmployee.get(id).stream())
                .sorted(Comparator.comparingDouble((PredictedLeave p) -> p.confidence).reversed()
                        .thenComparing(p -> p.predictedDate))
                .toList();

        // Step 4: Bradford Factor — compute for each employee using full sick leave history
        for (PredictedLeave p : result) {
            List<EmployeeLeave> history = leaveRepo.findApprovedByEmployee(p.employeeId);
            int[] bradford = computeBradford(history);
            p.bradfordScore = bradford[0];
            p.bradfordBand  = bradford[1] == 0 ? "GREEN" : bradford[1] == 1 ? "AMBER" : "RED";
        }

        // Step 5: Collision detection — flag predictions where 2+ employees share the same predicted date
        Map<LocalDate, Long> dateCounts = result.stream()
                .collect(Collectors.groupingBy(p -> p.predictedDate, Collectors.counting()));
        result.forEach(p -> p.collisionRisk = dateCounts.getOrDefault(p.predictedDate, 0L) > 1);

        com.ebp.entity.Location loc = com.ebp.entity.Location.findById(locationId);
        return new StorePrediction(locationId, loc.name, loc.city, loc.region,
                windowDays, result, holidayLabels);
    }

    // ---------------------------------------------------------------
    // Predict next leave for a single employee
    // ---------------------------------------------------------------
    public List<PredictedLeave> predictForEmployee(Long employeeId, int windowDays) {
        LocalDate today     = LocalDate.now(IST);
        LocalDate windowEnd = today.plusDays(windowDays);

        Employee emp = Employee.findById(employeeId);
        if (emp == null) return List.of();

        List<EmployeeLeave> history = leaveRepo.findApprovedByEmployee(employeeId);
        if (history.isEmpty()) return List.of();

        // Merge holidays from primary store + secondary store (if mapped)
        // so bridge patterns are detected correctly for both assignments
        List<LocationHoliday> holidays = new ArrayList<>(
                holidayRepo.findUpcoming(emp.location.id, today, windowEnd));
        if (emp.secondaryLocation != null) {
            List<LocationHoliday> secondaryHolidays =
                    holidayRepo.findUpcoming(emp.secondaryLocation.id, today, windowEnd);
            // Add secondary holidays not already present (deduplicate by date)
            Set<LocalDate> existing = holidays.stream()
                    .map(h -> h.holidayDate).collect(Collectors.toSet());
            secondaryHolidays.stream()
                    .filter(h -> !existing.contains(h.holidayDate))
                    .forEach(holidays::add);
        }

        List<PredictedLeave> predictions = predictAllLeaves(emp, history, today, windowEnd, holidays);

        // Populate store context on each prediction
        String primaryName   = emp.location.name;
        String secondaryName = emp.secondaryLocation != null ? emp.secondaryLocation.name : null;
        predictions.forEach(p -> {
            p.primaryStore   = primaryName;
            p.secondaryStore = secondaryName;
            // Bradford Factor
            int[] bradford = computeBradford(history);
            p.bradfordScore = bradford[0];
            p.bradfordBand  = bradford[1] == 0 ? "GREEN" : bradford[1] == 1 ? "AMBER" : "RED";
        });

        return predictions;
    }

    // ---------------------------------------------------------------
    // Bradford Factor: B = S² × D
    // S = number of separate sick spells in rolling 52 weeks
    // D = total sick days in rolling 52 weeks
    // Bands: GREEN < 51, AMBER 51-199, RED >= 200
    // Returns [score, band] where band: 0=GREEN, 1=AMBER, 2=RED
    // ---------------------------------------------------------------
    private int[] computeBradford(List<EmployeeLeave> history) {
        LocalDate oneYearAgo = LocalDate.now(IST).minusYears(1);
        List<LocalDate> sickDates = history.stream()
                .filter(l -> "SICK".equals(l.leaveType))
                .filter(l -> l.leaveDate.isAfter(oneYearAgo))
                .map(l -> l.leaveDate)
                .sorted()
                .toList();
        if (sickDates.isEmpty()) return new int[]{0, 0};
        int spells = 1;
        for (int i = 1; i < sickDates.size(); i++) {
            if (sickDates.get(i - 1).until(sickDates.get(i)).getDays() > 1) spells++;
        }
        int totalDays = sickDates.size();
        int score     = spells * spells * totalDays;
        int band      = score < 51 ? 0 : score < 200 ? 1 : 2;
        return new int[]{score, band};
    }

    // ── Signal helpers (extracted to reduce cyclomatic complexity) ──

    private double scoreMonthTendency(List<EmployeeLeave> planned, Month month, List<String> reasons) {
        long count = planned.stream().filter(l -> l.leaveDate.getMonth() == month).count();
        double rate = (double) count / Math.max(planned.size(), 1);
        if (rate > 0.2) {
            reasons.add("frequently takes leave in " + month.name().toLowerCase(Locale.ROOT));
            return 0.30;
        }
        return 0.0;
    }

    private double scoreHolidayBridge(List<EmployeeLeave> planned, LocalDate predictedDate,
                                       List<LocationHoliday> holidays, List<String> reasons) {
        for (LocationHoliday holiday : holidays) {
            boolean near = Math.abs(predictedDate.until(holiday.holidayDate).getDays()) <= 5;
            boolean bridge = planned.stream().anyMatch(l ->
                    Math.abs(l.leaveDate.until(holiday.holidayDate).getDays()) <= 2);
            if (near && bridge) {
                reasons.add("bridge leave pattern around " + holiday.holidayName);
                return 0.25;
            }
        }
        return 0.0;
    }

    private double scoreConsecutiveYears(List<EmployeeLeave> planned, Month month, List<String> reasons) {
        long years = planned.stream()
                .filter(l -> l.leaveDate.getMonth() == month)
                .map(l -> l.leaveDate.getYear()).distinct().count();
        if (years >= 3) {
            reasons.add("consistent leave in " + month.name().toLowerCase(Locale.ROOT) + " across " + years + " years");
            return 0.20;
        } else if (years == 2) {
            reasons.add("repeated leave in " + month.name().toLowerCase(Locale.ROOT) + " across 2 years");
            return 0.10;
        }
        return 0.0;
    }

    private double scoreOverdue(double overdueRatio, List<String> reasons) {
        if (overdueRatio > 1.1) {
            reasons.add(String.format("overdue by %.0f%%", (overdueRatio - 1.0) * 100));
            return Math.min((overdueRatio - 1.0) * 0.10, 0.10);
        }
        return 0.0;
    }

    // Only projects PLANNED leave types (EARNED, CASUAL, UNPAID)
    // SICK leave is excluded from gap projection — it is unplanned
    // ---------------------------------------------------------------
    private List<PredictedLeave> predictAllLeaves(Employee emp,
                                                   List<EmployeeLeave> history,
                                                   LocalDate today,
                                                   LocalDate windowEnd,
                                                   List<LocationHoliday> upcomingHolidays) {
        List<LocalDate> dates = history.stream().map(l -> l.leaveDate).sorted().toList();

        // --- Base rate: personal leave frequency (leaves per day of tenure) ---
        long tenureDays = Math.max(emp.hireDate.until(today).getDays(), 1);
        double annualLeaveRate = (double) history.size() / tenureDays * 365;
        // Low base rate employees get a confidence penalty
        double baseRateMultiplier = Math.min(annualLeaveRate / 4.0, 1.0); // 4 leaves/yr = full score

        // --- Separate planned vs unplanned leave ---
        List<EmployeeLeave> plannedHistory = history.stream()
                .filter(l -> !"SICK".equals(l.leaveType))
                .toList();
        List<LocalDate> plannedDates = plannedHistory.stream()
                .map(l -> l.leaveDate).sorted().toList();

        // Need at least 2 planned leaves to project a gap
        if (plannedDates.size() < 2) return List.of();

        // --- Avg gap computed only on PLANNED leaves ---
        long totalGapDays = 0;
        for (int i = 1; i < plannedDates.size(); i++)
            totalGapDays += plannedDates.get(i - 1).until(plannedDates.get(i)).getDays();
        double avgGap = (double) totalGapDays / (plannedDates.size() - 1);

        // Clamp gap
        long windowLength = today.until(windowEnd).getDays();
        double minGap = Math.max(windowLength / 24.0, 14);
        avgGap = Math.max(avgGap, minGap);

        // Skip if last planned leave was too recent
        LocalDate lastPlanned = plannedDates.get(plannedDates.size() - 1);
        long daysSinceLastPlanned = lastPlanned.until(today).getDays();
        if (daysSinceLastPlanned < 3) return List.of();

        // --- Project cursor from last PLANNED leave ---
        LocalDate cursor = lastPlanned.plusDays((long) avgGap);
        while (cursor.isBefore(today)) cursor = cursor.plusDays((long) avgGap);

        // Most common PLANNED leave type
        String likelyType = plannedHistory.stream()
                .collect(Collectors.groupingBy(l -> l.leaveType, Collectors.counting()))
                .entrySet().stream().max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("CASUAL");

        // Per-employee factors computed once
        double overdueRatio = avgGap > 0 ? daysSinceLastPlanned / avgGap : 1.0;

        // Frequency bonus based on planned leave count
        double freqBonus = plannedHistory.size() >= 10 ? 0.15
                         : plannedHistory.size() >= 8  ? 0.10
                         : plannedHistory.size() >= 5  ? 0.05
                         : 0.0;

        // Weekend extender pattern: does employee frequently take Mon or Fri?
        long monFriCount = plannedHistory.stream()
                .filter(l -> l.leaveDate.getDayOfWeek().getValue() == 1
                          || l.leaveDate.getDayOfWeek().getValue() == 5)
                .count();
        double monFriRate = (double) monFriCount / Math.max(plannedHistory.size(), 1);
        boolean weekendExtender = monFriRate >= 0.5;

        // UNPAID leave concern: high ratio of UNPAID leaves is an absence management flag
        long unpaidCount = plannedHistory.stream().filter(l -> "UNPAID".equals(l.leaveType)).count();
        double unpaidRatio = (double) unpaidCount / Math.max(plannedHistory.size(), 1);
        boolean highUnpaid = unpaidRatio >= 0.5;

        List<PredictedLeave> results = new ArrayList<>();
        int occurrenceIndex = 0;

        while (!cursor.isAfter(windowEnd)) {
            LocalDate predictedDate = cursor;
            occurrenceIndex++;

            double score = 0.0;
            List<String> reasons = new ArrayList<>();

            // Signal 1: month tendency
            Month predictedMonth = predictedDate.getMonth();
            score += scoreMonthTendency(plannedHistory, predictedMonth, reasons);

            // Signal 2: gap proximity
            if (occurrenceIndex == 1 && daysSinceLastPlanned >= avgGap * 0.8) {
                score += 0.35;
                reasons.add(String.format("avg planned leave gap %.0f days, last was %d days ago",
                        avgGap, daysSinceLastPlanned));
            } else if (occurrenceIndex > 1) {
                score += 0.25 * Math.pow(0.85, occurrenceIndex - 1);
                reasons.add(String.format("recurring planned leave every ~%.0f days", avgGap));
            }

            // Signal 3: holiday bridge
            score += scoreHolidayBridge(plannedHistory, predictedDate, upcomingHolidays, reasons);

            // Signal 4: frequency bonus
            score += freqBonus;

            // Signal 5: consecutive year pattern
            score += scoreConsecutiveYears(plannedHistory, predictedMonth, reasons);

            // Signal 6: weekend extender
            if (weekendExtender) {
                score += 0.10;
                reasons.add("frequent Monday/Friday leave pattern");
            }

            // Signal 7: overdue boost
            score += scoreOverdue(overdueRatio, reasons);

            // Signal 8: high UNPAID ratio — absence management concern, boosts risk
            if (highUnpaid) {
                score += 0.15;
                reasons.add("high proportion of unpaid leave — absence management concern");
            }

            if (score < 0.25) {
                cursor = cursor.plusDays((long) avgGap);
                continue;
            }

            // Apply base rate normalisation — low-frequency employees get confidence penalty
            double confidence = Math.min(score, 1.0) * (0.6 + 0.4 * baseRateMultiplier);
            confidence = Math.round(Math.min(Math.max(confidence, 0.25), 1.0) * 100.0) / 100.0;

            results.add(new PredictedLeave(
                    emp.id, emp.name, emp.role,
                    predictedDate, likelyType,
                    confidence,
                    String.join("; ", reasons)));

            cursor = cursor.plusDays((long) avgGap);
        }

        return results;
    }
}
