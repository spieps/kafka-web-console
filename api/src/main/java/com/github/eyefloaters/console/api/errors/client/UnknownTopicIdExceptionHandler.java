package com.github.eyefloaters.console.api.errors.client;

import jakarta.ws.rs.ext.Provider;

import org.apache.kafka.common.errors.UnknownTopicIdException;

@Provider
public class UnknownTopicIdExceptionHandler extends AbstractNotFoundExceptionHandler<UnknownTopicIdException> {
}