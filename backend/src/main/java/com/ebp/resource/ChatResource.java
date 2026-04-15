package com.ebp.resource;

import com.ebp.service.OpenAIService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

@Path("/api/chat")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ChatResource {

    @Inject
    OpenAIService openAIService;

    public static class ChatRequest {
        public String message;
    }

    public static class ChatResponse {
        public String reply;
        public boolean fromLLM;

        public ChatResponse(String reply, boolean fromLLM) {
            this.reply = reply;
            this.fromLLM = fromLLM;
        }
    }

    @POST
    public ChatResponse chat(ChatRequest req) {
        if (req == null || req.message == null || req.message.isBlank()) {
            return new ChatResponse("Please ask a question.", false);
        }

        if (!openAIService.isAvailable()) {
            return new ChatResponse(
                "OpenAI is not configured. Please add your API key in application.properties.", false
            );
        }

        String reply = openAIService.ask(req.message);
        return new ChatResponse(reply, true);
    }
}
