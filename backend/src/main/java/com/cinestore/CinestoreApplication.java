package com.cinestore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CinestoreApplication {
    public static void main(String[] args) {
        SpringApplication.run(CinestoreApplication.class, args);
    }
}
