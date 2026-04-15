package com.ebp.dto;

import java.util.List;

public class StorePrediction {
    public Long locationId;
    public String storeName;
    public String city;
    public String region;
    public int windowDays;
    public List<PredictedLeave> predictions;
    public List<String> upcomingHolidays;

    public StorePrediction(Long locationId, String storeName, String city, String region,
                           int windowDays, List<PredictedLeave> predictions,
                           List<String> upcomingHolidays) {
        this.locationId       = locationId;
        this.storeName        = storeName;
        this.city             = city;
        this.region           = region;
        this.windowDays       = windowDays;
        this.predictions      = predictions;
        this.upcomingHolidays = upcomingHolidays;
    }
}
