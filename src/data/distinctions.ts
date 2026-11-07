import type { Distinction } from '../types'

export const DISTINCTIONS: Distinction[] = [
  {
    id: 'hashing-encryption-encoding',
    title: 'Hashing vs encryption vs encoding',
    topic: 'Security',
    summary: 'Three transformations that are constantly confused in vivas, code reviews, and interview answers.',
    items: [
      {
        term: 'Hashing',
        label: 'One-way digest',
        text: 'Maps data to a fixed-size value. You verify by recomputing; you do not decrypt.',
      },
      {
        term: 'Encryption',
        label: 'Reversible with a key',
        text: 'Protects confidentiality. The right key recovers the plaintext.',
      },
      {
        term: 'Encoding',
        label: 'Representation only',
        text: 'Changes format for transport or storage. It provides no secrecy.',
      },
    ],
    rule: 'Hash to verify, encrypt to hide, encode to represent.',
  },
  {
    id: 'authentication-authorization',
    title: 'Authentication vs authorization',
    topic: 'Security',
    summary: 'Identity and permission are separate decisions, and both must be enforced in the right place.',
    items: [
      {
        term: 'Authentication',
        label: 'Who are you?',
        text: 'Establishes identity: password, passkey, certificate, SSO.',
      },
      {
        term: 'Authorization',
        label: 'What may you do?',
        text: 'Evaluates permissions for an already authenticated identity.',
      },
    ],
    rule: 'Authentication comes first, but authorization must still be checked on every protected operation.',
  },
  {
    id: 'concurrency-parallelism',
    title: 'Concurrency vs parallelism',
    topic: 'Concurrency',
    summary: 'Concurrency is a structuring property; parallelism is simultaneous execution.',
    items: [
      {
        term: 'Concurrency',
        label: 'Overlapping progress',
        text: 'Multiple tasks are in flight during overlapping periods, even on one core.',
      },
      {
        term: 'Parallelism',
        label: 'Simultaneous execution',
        text: 'Multiple tasks literally run at the same instant on multiple execution units.',
      },
    ],
    rule: 'All parallel programs are concurrent; not all concurrent programs are parallel.',
  },
  {
    id: 'process-thread',
    title: 'Process vs thread',
    topic: 'Operating systems',
    summary: 'The boundary between separate address spaces and shared memory explains most of the trade-off.',
    items: [
      {
        term: 'Process',
        label: 'Isolated',
        text: 'Own virtual address space and OS resources. Strong isolation, higher creation cost.',
      },
      {
        term: 'Thread',
        label: 'Shared',
        text: 'Execution unit inside a process sharing its memory. Cheaper communication, more race risk.',
      },
    ],
    rule: 'Processes isolate; threads share. Choose based on fault isolation versus communication cost.',
  },
  {
    id: 'deadlock-starvation',
    title: 'Deadlock vs starvation',
    topic: 'Concurrency',
    summary: 'Both prevent progress, but only one is a permanent circular wait.',
    items: [
      {
        term: 'Deadlock',
        label: 'Nobody progresses',
        text: 'Participants wait in a cycle for resources that can never be released.',
      },
      {
        term: 'Starvation',
        label: 'Someone never gets a turn',
        text: 'The system progresses, but one task is continually passed over.',
      },
    ],
    rule: 'Deadlock is a cycle; starvation is unfairness. A system can be live and still starve a task.',
  },
  {
    id: 'race-condition-data-race',
    title: 'Race condition vs data race',
    topic: 'Concurrency',
    summary: 'A data race is a memory-safety violation; a race condition is a broader timing-dependent correctness bug.',
    items: [
      {
        term: 'Race condition',
        label: 'Timing changes behavior',
        text: 'The result depends on interleaving, even if individual accesses are synchronized.',
      },
      {
        term: 'Data race',
        label: 'Unsynchronized conflicting access',
        text: 'Two accesses to one memory location, at least one write, with no synchronization. In Go, behavior is undefined.',
      },
    ],
    rule: 'Every data race is a race risk, but not every race condition is a data race.',
  },
  {
    id: 'latency-throughput-bandwidth',
    title: 'Latency vs throughput vs bandwidth',
    topic: 'Performance',
    summary: 'How long, how much per second, and how much could fit — three different measurements.',
    items: [
      {
        term: 'Latency',
        label: 'How long?',
        text: 'Time for one operation or message to complete.',
      },
      {
        term: 'Throughput',
        label: 'How much per unit time?',
        text: 'Actual work or data processed per second.',
      },
      {
        term: 'Bandwidth',
        label: 'What is the capacity?',
        text: 'The maximum possible transfer rate of a channel.',
      },
    ],
    rule: 'A high-bandwidth link can still have terrible latency — and batching can raise throughput while hurting latency.',
  },
  {
    id: 'replication-partitioning-sharding',
    title: 'Replication vs partitioning vs sharding',
    topic: 'Distributed systems',
    summary: 'Replication copies data; partitioning splits it; sharding is horizontal database partitioning.',
    items: [
      {
        term: 'Replication',
        label: 'Copies',
        text: 'Maintains multiple copies for durability, availability, or read scale.',
      },
      {
        term: 'Partitioning',
        label: 'Split work or data',
        text: 'Divides a workload or dataset across nodes.',
      },
      {
        term: 'Sharding',
        label: 'Horizontal split',
        text: 'A specific kind of partitioning that places subsets of rows on independent database shards.',
      },
    ],
    rule: 'Replication improves redundancy; partitioning improves scale; sharding is partitioning a database horizontally.',
  },
  {
    id: 'transaction-consistency-replica-consistency',
    title: 'Transaction consistency vs replica consistency',
    topic: 'Databases',
    summary: 'The same word means different things in ACID and in replication.',
    items: [
      {
        term: 'Transaction consistency',
        label: 'ACID “C”',
        text: 'A transaction moves the database from one valid state to another according to constraints.',
      },
      {
        term: 'Replica consistency',
        label: 'Distributed “C”',
        text: 'How closely replicas agree on the data clients observe, modeled as strong, eventual, causal, etc.',
      },
    ],
    rule: 'Always ask: consistency of a transaction, or consistency across copies?',
  },
  {
    id: 'normalization-denormalization',
    title: 'Normalization vs denormalization',
    topic: 'Databases',
    summary: 'Redundancy is either removed to protect correctness or added to improve read performance.',
    items: [
      {
        term: 'Normalization',
        label: 'Remove redundancy',
        text: 'Structure data to avoid duplicate facts and update anomalies.',
      },
      {
        term: 'Denormalization',
        label: 'Add redundancy deliberately',
        text: 'Duplicate data or precompute aggregates to speed reads, accepting a consistency obligation.',
      },
    ],
    rule: 'Normalize by default; denormalize when a measured access pattern justifies the consistency cost.',
  },
  {
    id: 'monolith-modular-microservices',
    title: 'Monolith vs modular monolith vs microservices',
    topic: 'Architecture',
    summary: 'Deployment boundaries and code boundaries are related but not identical.',
    items: [
      {
        term: 'Monolith',
        label: 'One deployable unit',
        text: 'The whole application ships as a single logical unit.',
      },
      {
        term: 'Modular monolith',
        label: 'One deployable, clear modules',
        text: 'A monolith with enforced internal boundaries and interfaces.',
      },
      {
        term: 'Microservices',
        label: 'Independent deployables',
        text: 'Functionality split into separately deployable services, adding distributed-system costs.',
      },
    ],
    rule: 'You can have clean architecture inside a monolith. Microservices are an operational trade-off, not a maturity badge.',
  },
  {
    id: 'testing-doubles',
    title: 'Mock vs stub vs fake vs spy',
    topic: 'Testing',
    summary: 'Test doubles differ by whether they supply behavior, record interactions, or verify them.',
    items: [
      {
        term: 'Stub',
        label: 'Canned responses',
        text: 'Returns predetermined values; does not verify how it was called.',
      },
      {
        term: 'Mock',
        label: 'Interaction expectations',
        text: 'Verifies that specific calls happened with specific arguments.',
      },
      {
        term: 'Fake',
        label: 'Simplified working implementation',
        text: 'Has real behavior, such as an in-memory repository.',
      },
      {
        term: 'Spy',
        label: 'Records calls',
        text: 'Records interactions for later inspection, often while wrapping real behavior.',
      },
    ],
    rule: 'Prefer a stub or fake for state-based tests; use a mock only when the interaction itself is the contract.',
  },
  {
    id: 'rendering-modes',
    title: 'SSR vs CSR vs SSG vs ISR',
    topic: 'Web',
    summary: 'Rendering is about where and when HTML is produced, not which framework you use.',
    items: [
      {
        term: 'SSR',
        label: 'Per request, on the server',
        text: 'HTML is rendered when a request arrives.',
      },
      {
        term: 'CSR',
        label: 'In the browser',
        text: 'A shell loads, then client JavaScript renders the view.',
      },
      {
        term: 'SSG',
        label: 'At build time',
        text: 'Pages are pre-rendered once and served statically.',
      },
      {
        term: 'ISR',
        label: 'Static with revalidation',
        text: 'Static pages are regenerated incrementally after the build.',
      },
    ],
    rule: 'Start with the freshness and personalization requirements, then choose where rendering happens.',
  },
  {
    id: 'ci-cd-delivery-deployment',
    title: 'CI vs continuous delivery vs continuous deployment',
    topic: 'DevOps',
    summary: 'The same “CD” acronym hides a crucial human decision: automatic release or not?',
    items: [
      {
        term: 'CI',
        label: 'Integrate continuously',
        text: 'Frequently merge, build, and test changes on a shared mainline.',
      },
      {
        label: 'Continuous delivery',
        text: 'Every validated change is deployable, but a human or business process decides when to release.',
        term: 'CD',
      },
      {
        label: 'Continuous deployment',
        text: 'Every change that passes automated checks is released automatically.',
        term: 'CD',
      },
    ],
    rule: 'Continuous delivery = always releasable. Continuous deployment = automatically released.',
  },
  {
    id: 'liveness-readiness',
    title: 'Liveness vs readiness',
    topic: 'Reliability',
    summary: 'One decides whether to restart a process; the other decides whether to send it traffic.',
    items: [
      {
        term: 'Liveness',
        label: 'Should I restart it?',
        text: 'Checks whether the process is alive and making progress.',
      },
      {
        term: 'Readiness',
        label: 'Should I route to it?',
        text: 'Checks whether the instance can serve traffic right now.',
      },
    ],
    rule: 'A stuck process fails liveness; a starting or draining process fails readiness. Mixing them up causes restart loops or dropped traffic.',
  },
  {
    id: 'test-levels',
    title: 'Unit vs integration vs end-to-end',
    topic: 'Testing',
    summary: 'Test levels trade speed and isolation for confidence in real system behavior.',
    items: [
      {
        term: 'Unit test',
        label: 'One behavior',
        text: 'Fast, isolated, no network or database.',
      },
      {
        term: 'Integration test',
        label: 'Components together',
        text: 'Verifies contracts and real infrastructure interactions.',
      },
      {
        term: 'End-to-end test',
        label: 'Whole workflow',
        text: 'Exercises the system through its user-facing boundaries.',
      },
    ],
    rule: 'Use many unit tests, focused integration tests, and a small critical E2E suite. Each level catches different failures.',
  },
  {
    id: 'linearizability-serializability',
    title: 'Linearizability vs serializability',
    topic: 'Distributed systems',
    summary: 'Both sound like “behaves as if sequential,” but they constrain different things.',
    items: [
      {
        term: 'Linearizability',
        label: 'Single operations, real time',
        text: 'Each operation appears to take effect atomically at one instant between invocation and response, respecting real-time order.',
      },
      {
        term: 'Serializability',
        label: 'Transactions, equivalent order',
        text: 'Concurrent transaction execution is equivalent to some serial execution order.',
      },
    ],
    rule: 'Linearizability orders individual operations in real time; serializability orders transactions. Strict serializability combines both.',
  },
  {
    id: 'cache-stampede-thundering-herd',
    title: 'Cache stampede vs thundering herd',
    topic: 'Caching',
    summary: 'A stampede is a herd caused by one expired key; a thundering herd can arise from many synchronized events.',
    items: [
      {
        term: 'Cache stampede',
        label: 'One missing key',
        text: 'Many concurrent requests recompute the same expired or missing value.',
      },
      {
        term: 'Thundering herd',
        label: 'Synchronized demand',
        text: 'Many clients or processes become active at once and overwhelm a shared resource.',
      },
    ],
    rule: 'Every cache stampede is a thundering herd; the stampede is the cache-specific form. Fix it with coalescing, locks, jitter, or stale-while-revalidate.',
  },
  {
    id: 'proxy-reverse-proxy-load-balancer',
    title: 'Proxy vs reverse proxy vs load balancer',
    topic: 'Networking',
    summary: 'Who is the intermediary acting for — the client, the server, or the fleet?',
    items: [
      {
        term: 'Proxy',
        label: 'Forward proxy',
        text: 'Acts on behalf of clients, forwarding their requests outward.',
      },
      {
        term: 'Reverse proxy',
        label: 'Acts for servers',
        text: 'Receives client requests on behalf of backend servers and forwards them.',
      },
      {
        term: 'Load balancer',
        label: 'Distributes across backends',
        text: 'Chooses among multiple servers or resources based on health and policy.',
      },
    ],
    rule: 'A reverse proxy hides servers; a load balancer distributes across them. Products often do both, but the concepts differ.',
  },
  {
    id: 'oauth-oidc',
    title: 'OAuth vs OpenID Connect',
    topic: 'Security',
    summary: 'Delegated authorization and authentication are related, but not interchangeable.',
    items: [
      {
        term: 'OAuth',
        label: 'Authorization',
        text: 'Grants a client scoped access to a resource on behalf of a user, without the user’s password.',
      },
      {
        term: 'OpenID Connect',
        label: 'Authentication layer',
        text: 'Adds an ID token and standard identity claims on top of OAuth 2.0.',
      },
    ],
    rule: 'OAuth gets access; OIDC proves identity. “Login with OAuth” is usually OIDC.',
  },
  {
    id: 'sli-slo-sla',
    title: 'SLI vs SLO vs SLA',
    topic: 'Reliability',
    summary: 'Measure it, target it, then contract it.',
    items: [
      {
        term: 'SLI',
        label: 'Measurement',
        text: 'A quantitative indicator of service behavior, such as success rate or latency.',
      },
      {
        term: 'SLO',
        label: 'Internal target',
        text: 'The target range for an SLI, used to guide operational decisions.',
      },
      {
        term: 'SLA',
        label: 'External contract',
        text: 'A legal or business commitment with consequences if missed.',
      },
    ],
    rule: 'SLI = what happened; SLO = what we aim for; SLA = what we promise with consequences.',
  },
  {
    id: 'deployment-release',
    title: 'Deployment vs release',
    topic: 'DevOps',
    summary: 'Getting code onto infrastructure and exposing behavior to users are separate events.',
    items: [
      {
        term: 'Deployment',
        label: 'Code is running',
        text: 'A version is installed and running in an environment.',
      },
      {
        term: 'Release',
        label: 'Users can see it',
        text: 'The behavior is made available to a group of users or environments.',
      },
    ],
    rule: 'Feature flags let you deploy without releasing. This decoupling makes rollout and rollback safer.',
  },
  {
    id: 'vulnerability-exploit-threat',
    title: 'Vulnerability vs exploit vs threat',
    topic: 'Security',
    summary: 'The flaw, the action that abuses it, and the potential cause of harm.',
    items: [
      {
        term: 'Vulnerability',
        label: 'The weakness',
        text: 'A flaw that could violate a security property.',
      },
      {
        term: 'Exploit',
        label: 'The action',
        text: 'A technique or input that takes advantage of the weakness.',
      },
      {
        term: 'Threat model',
        label: 'The analysis',
        text: 'A structured look at assets, actors, trust boundaries, threats, and mitigations.',
      },
    ],
    rule: 'A vulnerability can exist without an exploit; a threat model decides which risks deserve mitigation.',
  },
]
