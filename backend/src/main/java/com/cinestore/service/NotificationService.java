package com.cinestore.service;

import com.cinestore.dto.MovieEventDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final List<SseEmitter> sseEmitters = new CopyOnWriteArrayList<>();

    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public SseEmitter createSseConnection() {
        SseEmitter emitter = new SseEmitter(180_000L); // 3 minutes timeout
        sseEmitters.add(emitter);

        emitter.onCompletion(() -> sseEmitters.remove(emitter));
        emitter.onTimeout(() -> sseEmitters.remove(emitter));
        emitter.onError((e) -> sseEmitters.remove(emitter));

        // Envoi d'un message d'initialisation
        try {
            emitter.send(SseEmitter.event().name("INIT").data("Connected to CinéStore real-time notifications"));
        } catch (IOException e) {
            sseEmitters.remove(emitter);
        }

        return emitter;
    }

    public void broadcastMovieEvent(MovieEventDto event) {
        // 1. Diffusion via WebSocket STOMP
        try {
            messagingTemplate.convertAndSend("/topic/movie-updates", event);
        } catch (Exception e) {
            log.warn("Erreur diffusion WebSocket: {}", e.getMessage());
        }

        // 2. Diffusion via Server-Sent Events (SSE)
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : sseEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("MOVIE_UPDATE")
                        .data(event));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }
        sseEmitters.removeAll(deadEmitters);
    }
}
