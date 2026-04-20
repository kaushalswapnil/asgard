package com.ebp.dto;

import java.time.LocalDate;

public class PredictedLeave {
    public Long employeeId;
    public String employeeName;
    public String role;
    public LocalDate predictedDate;
    public LocalDate predictedDateStart;
    public LocalDate predictedDateEnd;
    public String leaveType;
    public double confidence;
    public String reason;
    public int bradfordScore;
    public String bradfordBand;
    public boolean collisionRisk;
    public String primaryStore;      // employee's primary store name
    public String secondaryStore;    // employee's secondary store name, null if unmapped

    public PredictedLeave(Long employeeId, String employeeName, String role,
                          LocalDate predictedDate, String leaveType,
                          double confidence, String reason) {
        this.employeeId        = employeeId;
        this.employeeName      = employeeName;
        this.role              = role;
        this.predictedDate     = predictedDate;
        this.predictedDateStart = predictedDate.minusDays(1);
        this.predictedDateEnd   = predictedDate.plusDays(1);
        this.leaveType         = leaveType;
        this.confidence        = confidence;
        this.reason            = reason;
        this.primaryStore      = null;
        this.secondaryStore    = null;
    }
}
