package com.ebp.service;

import com.ebp.dto.PredictedLeave;
import com.ebp.dto.StorePrediction;
import com.ebp.entity.Employee;
import com.ebp.entity.EmployeeLeave;
import com.ebp.entity.LocationHoliday;
import com.ebp.repository.EmployeeLeaveRepository;
import com.ebp.repository.LocationHolidayRepository;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDate;
import java.time.Month;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class PredictionService {

    @Inject EmployeeLeaveRepository leaveRepo;
    @Inject LocationHolidayRepository holidayRepo;

    // ---------------------------------------------------------------
    // Predict upcoming leaves for all employees in a store
    // Returns top N employees most likely to take leave in next windowDays
    // ---------------------------------------------------------------
    public StorePrediction predictForStore(Long locationId, int windowDays, int topN) {
        LocalDate today = LocalDate.now();
        LocalDate windowEnd = today.plusDays(windowDays);

        // Fetch all employees at this location
        List<Employee> employees = Employee.list("location.id = ?1 and isActive = true", locationId);

        // Upcoming holidays for context
        List<LocationHoliday> holidays = holidayRepo.findUpcoming(locationId, today, windowEnd);
        List<String> holidayLabels = holidays.stream()
                .map(h -> h.holidayDate + " - " + h.holidayName)
                .toList();

        List<PredictedLeave> predictions = new ArrayList<>();

        for (Employee emp : employees) {
            List<EmployeeLeave> history = leaveRepo.findApprovedByEmployee(emp.id);
            if (history.isEmpty()) continue;

            Optional<PredictedLeave> prediction = predictNextLeave(emp, history, today, windowEnd, holidays);
            prediction.ifPresent(predictions::add);
        }

        // Sort by confidence desc, take topN
        predictions.sort(Comparator.comparingDouble((PredictedLeave p) -> p.confidence).reversed());
        List<PredictedLeave> top = predictions.stream().limit(topN).toList();

        // Fetch location details
        com.ebp.entity.Location loc = com.ebp.entity.Location.findById(locationId);

        return new StorePrediction(locationId, loc.name, loc.city, loc.region,
                windowDays, top, holidayLabels);
    }

    // ---------------------------------------------------------------
    // Predict next leave for a single employee
    // ---------------------------------------------------------------
    public List<PredictedLeave> predictForEmployee(Long employeeId, int windowDays) {
        LocalDate today = LocalDate.now();
        LocalDate windowEnd = today.plusDays(windowDays);

        Employee emp = Employee.findById(employeeId);
        if (emp == null) return List.of();

        List<EmployeeLeave> history = leaveRepo.findApprovedByEmployee(employeeId);
        if (history.isEmpty()) return List.of();

        List<LocationHoliday> holidays = holidayRepo.findUpcoming(emp.location.id, today, windowEnd);

        return predictNextLeave(emp, history, today, windowEnd, holidays)
                .map(List::of)
                .orElse(List.of());
    }

    // ---------------------------------------------------------------
    // Core prediction logic — pattern-based heuristic
    // Signals used:
    //   1. Same month tendency (how often employee takes leave in this month)
    //   2. Average gap between leaves (is next leave due soon?)
    //   3. Pre/post holiday bridge pattern
    //   4. Day-of-week preference
    // ---------------------------------------------------------------
    private Optional<PredictedLeave> predictNextLeave(Employee emp,
                                                       List<EmployeeLeave> history,
                                                       LocalDate today,
                                                       LocalDate windowEnd,
                                                       List<LocationHoliday> upcomingHolidays) {
        double score = 0.0;
        List<String> reasons = new ArrayList<>();

        // --- Signal 1: Month tendency ---
        Month currentMonth = today.getMonth();
        long leavesThisMonth = history.stream()
                .filter(l -> l.leaveDate.getMonth() == currentMonth)
                .count();
        double monthRate = (double) leavesThisMonth / Math.max(history.size(), 1);
        if (monthRate > 0.2) {
            score += 0.3;
            reasons.add("frequently takes leave in " + currentMonth.name().toLowerCase());
        }

        // --- Signal 2: Average gap between leaves ---
        List<LocalDate> dates = history.stream().map(l -> l.leaveDate).sorted().toList();
        if (dates.size() >= 2) {
            long totalGapDays = 0;
            for (int i = 1; i < dates.size(); i++) {
                totalGapDays += dates.get(i - 1).until(dates.get(i)).getDays();
            }
            double avgGap = (double) totalGapDays / (dates.size() - 1);
            LocalDate lastLeave = dates.get(dates.size() - 1);
            long daysSinceLast = lastLeave.until(today).getDays();

            if (daysSinceLast >= avgGap * 0.8) {
                score += 0.35;
                reasons.add(String.format("avg leave gap %.0f days, last leave was %d days ago",
                        avgGap, daysSinceLast));
            }
        }

        // --- Signal 3: Pre/post holiday bridge ---
        for (LocationHoliday holiday : upcomingHolidays) {
            LocalDate hDate = holiday.holidayDate;
            // Check if employee has historically taken leave adjacent to holidays
            boolean bridgePattern = history.stream().anyMatch(l ->
                    Math.abs(l.leaveDate.until(hDate).getDays()) <= 2);
            if (bridgePattern) {
                score += 0.25;
                reasons.add("bridge leave pattern around " + holiday.holidayName);
                break;
            }
        }

        // --- Signal 4: Day-of-week preference ---
        Map<Integer, Long> dowCounts = history.stream()
                .collect(Collectors.groupingBy(l -> l.leaveDate.getDayOfWeek().getValue(), Collectors.counting()));
        int preferredDow = dowCounts.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(1);

        // Minimum threshold to surface a prediction
        if (score < 0.25) return Optional.empty();

        // Predict the most likely date within the window
        LocalDate predictedDate = findNextPreferredDate(today, windowEnd, preferredDow);

        // Most common leave type
        String likelyType = history.stream()
                .collect(Collectors.groupingBy(l -> l.leaveType, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("CASUAL");

        double confidence = Math.min(score, 1.0);
        String reason = String.join("; ", reasons);

        return Optional.of(new PredictedLeave(
                emp.id, emp.name, emp.role,
                predictedDate, likelyType,
                Math.round(confidence * 100.0) / 100.0,
                reason));
    }

    private LocalDate findNextPreferredDate(LocalDate from, LocalDate to, int preferredDow) {
        LocalDate date = from.plusDays(1);
        while (!date.isAfter(to)) {
            if (date.getDayOfWeek().getValue() == preferredDow) return date;
            date = date.plusDays(1);
        }
        return from.plusDays(7); // fallback
    }
}
