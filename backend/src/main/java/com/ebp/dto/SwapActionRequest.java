package com.ebp.dto;

public class SwapActionRequest {
    public Long   atRiskEmployeeId;
    public Long   selectedReplacementId;  // null = override (manager handles manually)
    public String action;                 // APPROVE | OVERRIDE
    public String managerNote;
}
