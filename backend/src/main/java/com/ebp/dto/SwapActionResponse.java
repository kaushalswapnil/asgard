package com.ebp.dto;

public class SwapActionResponse {
    public String status;   // APPROVED | OVERRIDDEN
    public String message;
    public Long   atRiskEmployeeId;
    public Long   replacementEmployeeId;
    public String managerNote;

    public SwapActionResponse(String status, String message,
                              Long atRiskEmployeeId, Long replacementEmployeeId,
                              String managerNote) {
        this.status               = status;
        this.message              = message;
        this.atRiskEmployeeId     = atRiskEmployeeId;
        this.replacementEmployeeId = replacementEmployeeId;
        this.managerNote          = managerNote;
    }
}
