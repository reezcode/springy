import type { Source } from './types.ts';

/** Primary references. Lesson content summarises these; always read the original for details. */
export const sources: Source[] = (
  [
    ['java', 'OOP: objects, classes, interfaces', 'Java · Oracle', 'https://dev.java/learn/oop/'],
    ['classes', 'Classes and Objects', 'Java · Oracle', 'https://dev.java/learn/language/oop/classes-objects/'],
    ['records', 'Using Record to Model Immutable Data', 'Java · Oracle', 'https://dev.java/learn/records/'],
    ['collections', 'Collections Framework', 'Java · Oracle', 'https://dev.java/learn/api/collections-framework/'],
    ['exceptions', 'Exceptions', 'Java · Oracle', 'https://dev.java/learn/exceptions/'],
    ['maven', 'Maven Getting Started', 'Apache Maven', 'https://maven.apache.org/guides/getting-started/'],
    ['solid', 'The SOLID Principles of Software Design', 'Robert C. Martin', 'https://cleancoder.com/files/solid.md'],
    ['req', 'Spring Boot System Requirements', 'Spring', 'https://docs.spring.io/spring-boot/system-requirements.html'],
    ['rest', 'Building a RESTful Web Service', 'Spring Guides', 'https://spring.io/guides/gs/rest-service/'],
    ['di', 'Dependency Injection', 'Spring Framework', 'https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html'],
    ['config', 'Externalized Configuration', 'Spring Boot', 'https://docs.spring.io/spring-boot/reference/features/external-config.html'],
    ['validation', 'MVC Validation', 'Spring Framework', 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html'],
    ['errors', 'Error Responses · ProblemDetail', 'Spring Framework', 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html'],
    ['jpa', 'Accessing Data with JPA', 'Spring Guides', 'https://spring.io/guides/gs/accessing-data-jpa/'],
    ['tx', 'Transactionality', 'Spring Data JPA', 'https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html'],
    ['migration', 'Database Initialization', 'Spring Boot', 'https://docs.spring.io/spring-boot/how-to/data-initialization.html'],
    ['test', 'Testing', 'Spring Boot', 'https://docs.spring.io/spring-boot/reference/testing/index.html'],
    ['tc', 'Testcontainers', 'Spring Boot', 'https://docs.spring.io/spring-boot/reference/testing/testcontainers.html'],
    ['security', 'OAuth 2.0 Resource Server JWT', 'Spring Security', 'https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html'],
    ['micro', 'Microservices · 2014', 'James Lewis & Martin Fowler', 'https://martinfowler.com/articles/microservices.html'],
    ['client', 'REST Clients', 'Spring Framework', 'https://docs.spring.io/spring-framework/reference/integration/rest-clients.html'],
    ['cb', 'CircuitBreaker', 'Resilience4j', 'https://resilience4j.readme.io/docs/circuitbreaker'],
    ['retry', 'Retry', 'Resilience4j', 'https://resilience4j.readme.io/docs/retry'],
    ['mq', 'Consumer Acknowledgements & Publisher Confirms', 'RabbitMQ', 'https://www.rabbitmq.com/docs/confirms'],
    ['outbox', 'Transactional Outbox', 'Chris Richardson', 'https://microservices.io/patterns/data/transactional-outbox.html'],
    ['saga', 'Saga', 'Chris Richardson', 'https://microservices.io/patterns/data/saga.html'],
    ['actuator', 'Actuator Endpoints', 'Spring Boot', 'https://docs.spring.io/spring-boot/reference/actuator/endpoints.html'],
    ['trace', 'Distributed Tracing', 'Spring Boot', 'https://docs.spring.io/spring-boot/reference/actuator/tracing.html'],
    ['image', 'What is a Container Image?', 'Docker', 'https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/'],
    ['dockerfile', 'Dockerfiles', 'Spring Boot', 'https://docs.spring.io/spring-boot/reference/packaging/container-images/dockerfiles.html'],
    ['compose', 'Control Startup Order in Compose', 'Docker', 'https://docs.docker.com/compose/how-tos/startup-order/'],
    ['podman', 'podman run', 'Podman', 'https://docs.podman.io/en/latest/markdown/podman-run.1.html'],
    ['deployment', 'Deployments', 'Kubernetes', 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/'],
    ['probe', 'Liveness, Readiness & Startup Probes', 'Kubernetes', 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/'],
    ['ocp', 'OpenShift Architecture · 4.20', 'Red Hat', 'https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/architecture/architecture'],
    ['ocimage', 'Creating Images · Arbitrary User IDs', 'Red Hat', 'https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/images/creating-images'],
    ['route', 'Configuring Ingress Cluster Traffic · 4.20', 'Red Hat', 'https://docs.redhat.com/en/documentation/openshift_container_platform/4.20/html/ingress_and_load_balancing/configuring-ingress-cluster-traffic'],
  ] as const
).map(([id, title, publisher, url]) => ({ id, title, publisher, url }));

const byId = new Map(sources.map((s) => [s.id, s]));

export function getSource(id: string): Source {
  const source = byId.get(id);
  if (!source) throw new Error(`Unknown source "${id}"`);
  return source;
}
