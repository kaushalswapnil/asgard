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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Calls the OpenAI Embeddings API (text-embedding-3-small) to convert
 * text into a dense float vector for storage and similarity search in Milvus.
 */
@ApplicationScoped
public class EmbeddingService {

    private static final Logger log = Logger.getLogger(EmbeddingService.class);
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    @ConfigProperty(name = "openai.api.key", defaultValue = "")
    String apiKey;

    @ConfigProperty(name = "embedding.model", defaultValue = "text-embedding-3-small")
    String model;

    /**
     * Converts text into a 1536-dimension float vector.
     * Throws RuntimeException if the API call fails.
     */
    public List<Float> embed(String text) throws Exception {
        if (apiKey == null || apiKey.isBlank() || apiKey.equals("YOUR_OPENAI_API_KEY_HERE")) {
            throw new IllegalStateException("OpenAI API key not configured — cannot generate embeddings.");
        }

        String body = mapper.writeValueAsString(Map.of("model", model, "input", text));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.openai.com/v1/embeddings"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("OpenAI embeddings API returned HTTP " + response.statusCode()
                    + ": " + response.body());
        }

        JsonNode json   = mapper.readTree(response.body());
        JsonNode values = json.path("data").get(0).path("embedding");

        List<Float> vector = new ArrayList<>(values.size());
        for (JsonNode v : values) {
            vector.add((float) v.asDouble());
        }
        log.debugf("Generated embedding of dimension %d for text of length %d", vector.size(), text.length());
        return vector;
    }
}
