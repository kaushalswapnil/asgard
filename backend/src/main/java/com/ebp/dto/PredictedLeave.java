package com.ebp.dto;

import java.time.LocalDate;

public class PredictedLeave {
    public Long employeeId;
    public String employeeName;
    public String role;
    public LocalDate predictedDate;
    public String leaveType;
    public double confidence;   // 0.0 - 1.0
    public String reason;

    public PredictedLeave(Long employeeId, String employeeName, String role,
                          LocalDate predictedDate, String leaveType,
                          double confidence, String reason) {
        this.employeeId   = employeeId;
        this.employeeName = employeeName;
        this.role         = role;
        this.predictedDate = predictedDate;
        this.leaveType    = leaveType;
        this.confidence   = confidence;
        this.reason       = reason;
    }
}
