package com.github.streamshub.console.api.v1alpha1.spec;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;

import io.sundr.builder.annotations.Buildable;

@Buildable
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Value {

    @JsonProperty("value")
    @JsonPropertyDescription("Literal string to be used for this value")
    private String value; // NOSONAR

    @JsonProperty("valueFrom")
    @JsonPropertyDescription("Reference to an external source to use for this value")
    private ValueReference valueFrom;

    public Value() {
    }

    private Value(String value) {
        this.value = value;
    }

    @JsonIgnore
    public static Value of(String value) {
        return value != null ? new Value(value) : null;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public ValueReference getValueFrom() {
        return valueFrom;
    }

    public void setValueFrom(ValueReference valueFrom) {
        this.valueFrom = valueFrom;
    }

}