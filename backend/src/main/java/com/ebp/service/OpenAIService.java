package com.ebp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * OpenAIService - Calls OpenAI GPT API to enhance leave prediction reasoning
 * Falls back to base heuristic reason if API is unavailable
 */
@ApplicationScoped
public class OpenAIService {

    private static final Logger log = Logger.getLogger(OpenAIService.class);
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @ConfigProperty(name = "openai.api.key", defaultValue = "")
    String apiKey;

    @ConfigProperty(name = "openai.model", defaultValue = "gpt-4o-mini")
    String model;

    @ConfigProperty(name = "openai.temperature", defaultValue = "0.5")
    double temperature;

    @ConfigProperty(name = "openai.max.tokens", defaultValue = "200")
    int maxTokens;

    @ConfigProperty(name = "openai.enabled", defaultValue = "true")
    boolean enabled;

    public boolean isAvailable() {
        return enabled && apiKey != null && !apiKey.isBlank() && !apiKey.equals("YOUR_OPENAI_API_KEY_HERE");
    }

    /**
     * Enhance prediction reason using GPT
     * Returns base reason if OpenAI is unavailable
     */
    public String enhancePredictionReason(String employeeName, String role,
                                          String baseReason, double confidence) {
        if (!isAvailable()) return baseReason;

        String prompt = String.format(
                "You are an HR analytics assistant. Given this employee leave prediction data, " +
                "write a concise 1-2 sentence professional explanation:\n" +
                "Employee: %s | Role: %s\n" +
                "Prediction signals: %s\n" +
                "Confidence: %.0f%%\n" +
                "Write only the explanation, no extra text.",
                employeeName, role, baseReason, confidence * 100
        );

        try {
            String responseText = callOpenAI(prompt);
            return responseText == null || responseText.isBlank() ? baseReason : responseText.trim();
        } catch (Exception e) {
            log.warn("OpenAI call failed, using base reason: " + e.getMessage());
            return baseReason;
        }
    }

    /**
     * Ask GPT a free-form question directly
     */
    public String ask(String question) {
        if (!isAvailable()) return "OpenAI is not configured.";
        try {
            String response = callOpenAI(question);
            return response == null || response.isBlank() ? "No response from GPT." : response.trim();
        } catch (Exception e) {
            log.warn("OpenAI ask failed: " + e.getMessage());
            return "Sorry, I could not reach OpenAI. Please try again.";
        }
    }

    private String callOpenAI(String prompt) throws Exception {
        String requestBody = mapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("model", model);
            put("temperature", temperature);
            put("max_tokens", maxTokens);
            put("messages", java.util.List.of(
                    java.util.Map.of("role", "user", "content", prompt)
            ));
        }});

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("OpenAI API returned status: " + response.statusCode());
            return null;
        }

        JsonNode json = mapper.readTree(response.body());
        return json.path("choices").get(0).path("message").path("content").asText();
    }
}
