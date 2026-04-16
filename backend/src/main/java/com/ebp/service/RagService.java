package com.ebp.service;

import com.ebp.entity.Employee;
import com.ebp.entity.EmployeeLeave;
import com.ebp.repository.EmployeeLeaveRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.LocalDate;
import java.time.Month;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Orchestrates the full RAG pipeline:
 *  1. Build a descriptive text profile for an employee from their leave history
 *  2. Embed that text via OpenAI
 *  3. Store the vector in Milvus
 *  4. At query time: embed the query, search Milvus, return context strings
 *  5. Augment a user message with retrieved context before sending to GPT
 */
@ApplicationScoped
public class RagService {

    private static final Logger log = Logger.getLogger(RagService.class);

    @Inject EmbeddingService embeddingService;
    @Inject MilvusService    milvusService;
    @Inject EmployeeLeaveRepository leaveRepo;

    @ConfigProperty(name = "rag.top.k",                defaultValue = "3")
    int topK;

    @ConfigProperty(name = "rag.similarity.threshold",  defaultValue = "0.5")
    double similarityThreshold;

    // ── Training ─────────────────────────────────────────────────────────────

    /**
     * Builds a leave-pattern text for the employee, embeds it,
     * and upserts the vector into Milvus.
     * Returns the text that was embedded so callers can log/display it.
     */
    public String trainEmployee(Long employeeId) throws Exception {
        Employee emp = Employee.findById(employeeId);
        if (emp == null) throw new IllegalArgumentException("Employee " + employeeId + " not found.");

        String context = buildEmployeeContext(emp);
        List<Float> vector = embeddingService.embed(context);
        milvusService.upsert(employeeId, vector, context);

        log.infof("Trained employee %d (%s) — %d-dim vector stored.", employeeId, emp.name, vector.size());
        return context;
    }

    // ── Retrieval ────────────────────────────────────────────────────────────

    /**
     * Embeds the query, searches Milvus for the closest employee profiles,
     * and returns the matching context strings.
     * Returns an empty list when Milvus is not connected or no embeddings exist.
     */
    public List<String> retrieve(String query) {
        if (!milvusService.isConnected()) return List.of();
        if (milvusService.count() == 0)   return List.of();
        try {
            List<Float> queryVector = embeddingService.embed(query);
            return milvusService.search(queryVector, topK);
        } catch (Exception e) {
            log.warnf("RAG retrieval failed: %s", e.getMessage());
            return List.of();
        }
    }

    /**
     * Wraps the user's message with RAG context retrieved from Milvus.
     * Falls back to the original message when no context is available.
     */
    public String augmentWithContext(String userMessage) {
        List<String> contexts = retrieve(userMessage);
        if (contexts.isEmpty()) return userMessage;

        String contextBlock = contexts.stream()
                .map(c -> "---\n" + c)
                .collect(Collectors.joining("\n"));

        return "You are a professional retail workforce assistant for EBP (Employee & Branch Portal), "
                + "a UK retail leave management system.\n\n"
                + "The following employee leave profiles were retrieved from the knowledge base "
                + "as relevant context. Use them where applicable:\n\n"
                + contextBlock
                + "\n---\n\n"
                + "Now answer this question from a store manager:\n"
                + userMessage;
    }

    // ── Employee context builder ─────────────────────────────────────────────

    /**
     * Converts an employee's leave history into a rich descriptive text string
     * that encodes the patterns the embedding model should capture:
     * preferred month, gap cadence, holiday bridging, leave type, weekday preference.
     */
    String buildEmployeeContext(Employee emp) {
        List<EmployeeLeave> history = leaveRepo.findApprovedByEmployee(emp.id);

        StringBuilder sb = new StringBuilder();
        sb.append("Employee: ").append(emp.name).append("\n");
        sb.append("Role: ").append(emp.role).append("\n");
        if (emp.location != null) {
            sb.append("Store: ").append(emp.location.name)
              .append(" (").append(emp.location.city)
              .append(", ").append(emp.location.region).append(")\n");
        }
        sb.append("Hire Date: ").append(emp.hireDate).append("\n");
        sb.append("Active: ").append(emp.isActive).append("\n\n");

        if (history.isEmpty()) {
            sb.append("Leave history: none recorded.\n");
            return sb.toString();
        }

        sb.append("Leave Summary:\n");
        sb.append("- Total approved leaves: ").append(history.size()).append("\n");

        // Most common month
        Map<Month, Long> byMonth = history.stream()
                .collect(Collectors.groupingBy(l -> l.leaveDate.getMonth(), Collectors.counting()));
        byMonth.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .ifPresent(e -> {
                    double pct = (double) e.getValue() / history.size() * 100;
                    sb.append(String.format("- Most frequent leave month: %s (%d of %d = %.0f%%)\n",
                            e.getKey().name().toLowerCase(), e.getValue(), history.size(), pct));
                });

        // Average gap between consecutive leaves
        List<LocalDate> dates = history.stream()
                .map(l -> l.leaveDate).sorted().toList();
        if (dates.size() >= 2) {
            long totalGap = 0;
            for (int i = 1; i < dates.size(); i++) {
                totalGap += dates.get(i - 1).until(dates.get(i)).getDays();
            }
            double avgGap = (double) totalGap / (dates.size() - 1);
            LocalDate lastLeave = dates.get(dates.size() - 1);
            long daysSinceLast = lastLeave.until(LocalDate.now()).getDays();
            sb.append(String.format("- Average gap between leaves: %.0f days\n", avgGap));
            sb.append("- Last leave: ").append(lastLeave).append("\n");
            sb.append("- Days since last leave: ").append(daysSinceLast).append("\n");
            if (daysSinceLast >= avgGap * 0.8) {
                sb.append("- Status: OVERDUE — next leave likely imminent\n");
            }
        }

        // Preferred day of week
        history.stream()
                .collect(Collectors.groupingBy(l -> l.leaveDate.getDayOfWeek(), Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .ifPresent(e -> sb.append("- Preferred leave day: ").append(e.getKey()).append("\n"));

        // Leave type breakdown
        Map<String, Long> byType = history.stream()
                .collect(Collectors.groupingBy(l -> l.leaveType, Collectors.counting()));
        String typeBreakdown = byType.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> e.getKey() + "(" + e.getValue() + ")")
                .collect(Collectors.joining(", "));
        sb.append("- Leave type breakdown: ").append(typeBreakdown).append("\n");

        // Most common leave type
        byType.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .ifPresent(e -> sb.append("- Most used leave type: ").append(e.getKey()).append("\n"));

        // Recent 5 leave dates
        List<LocalDate> recent = new ArrayList<>(dates);
        Collections.reverse(recent);
        String recentDates = recent.stream().limit(5)
                .map(LocalDate::toString)
                .collect(Collectors.joining(", "));
        sb.append("- Recent leave dates: ").append(recentDates).append("\n");

        // Holiday bridging signal (any leave within ±2 days of the same date each year implies bridging)
        long bridgeCount = history.stream()
                .filter(l -> {
                    int dom = l.leaveDate.getDayOfMonth();
                    int mon = l.leaveDate.getMonthValue();
                    // Approximate: near common UK bank holiday months (Jan, Apr, May, Aug, Dec)
                    return mon == 1 || mon == 4 || mon == 5 || mon == 8 || mon == 12;
                }).count();
        if (bridgeCount >= 2) {
            sb.append("- Holiday bridge pattern: takes leave around UK bank holidays (")
              .append(bridgeCount).append(" occurrences)\n");
        }

        return sb.toString();
    }
}
