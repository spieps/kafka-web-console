package com.github.streamshub.console.api.model;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Base class for all JSON API request and response bodies.
 *
 * @see <a href="https://jsonapi.org/format/#document-structure">JSON API Document Structure, 7.1 Top Level</a>
 */
@JsonInclude(value = Include.NON_NULL)
public abstract class JsonApiDocument implements HasLinks<JsonApiDocument>, HasMeta<JsonApiDocument> {

    private JsonApiMeta meta;
    private Map<String, String> links;

    @JsonProperty
    public JsonApiMeta meta() {
        return meta;
    }

    public void meta(JsonApiMeta meta) {
        this.meta = meta;
    }

    @JsonProperty
    public Map<String, String> links() {
        return links;
    }

    public void links(Map<String, String> links) {
        this.links = links;
    }
}
