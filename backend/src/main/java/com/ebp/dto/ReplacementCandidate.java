package com.ebp.dto;

public class ReplacementCandidate {
    public Long   employeeId;
    public String employeeName;
    public String role;
    public String storeAlignment;   // PRIMARY or SECONDARY
    public double leaveRisk;        // 0.0 - 1.0 (lower = safer replacement)
    public int    leaveCountLast90Days;
    public String matchReason;

    public ReplacementCandidate(Long employeeId, String employeeName, String role,
                                String storeAlignment, double leaveRisk,
                                int leaveCountLast90Days, String matchReason) {
        this.employeeId          = employeeId;
        this.employeeName        = employeeName;
        this.role                = role;
        this.storeAlignment      = storeAlignment;
        this.leaveRisk           = leaveRisk;
        this.leaveCountLast90Days = leaveCountLast90Days;
        this.matchReason         = matchReason;
    }
}
