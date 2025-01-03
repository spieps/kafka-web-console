package com.github.streamshub.console.dependents;

import jakarta.enterprise.context.ApplicationScoped;

import com.github.streamshub.console.dependents.discriminators.PrometheusLabelDiscriminator;

import io.javaoperatorsdk.operator.api.reconciler.Constants;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.KubernetesDependent;

@ApplicationScoped
@KubernetesDependent(
        namespaces = Constants.WATCH_ALL_NAMESPACES,
        labelSelector = ConsoleResource.MANAGEMENT_SELECTOR,
        resourceDiscriminator = PrometheusLabelDiscriminator.class)
public class PrometheusClusterRole extends BaseClusterRole {

    public static final String NAME = "prometheus-clusterrole";

    public PrometheusClusterRole() {
        super("prometheus", "prometheus.clusterrole.yaml", NAME);
    }

}
