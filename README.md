# Application_Template

Clean architectural spine for every product.

```
APPLICATION
│
├── frontend/          Client-side capability runtimes
│   ├── motion/
│   ├── cognition/
│   ├── communications/
│   └── governance/
│
├── backend/           Server-side capability runtimes
│   ├── motion/
│   ├── cognition/
│   ├── communications/
│   └── governance/
│
├── contracts/         The only shared language between layers
│   ├── motion.contract.ts
│   ├── cognition.contract.ts
│   ├── communications.contract.ts
│   ├── authority.contract.ts
│   └── evidence.contract.ts
│
├── application/       Domain-specific product code ONLY
│   ├── config/
│   ├── adapters/
│   └── product/
│
└── shared/            Tiny cross-cutting primitives (no domain knowledge)
```

## Boundary rules

| Layer | May know | Must not know |
|-------|----------|---------------|
| **frontend/\*** & **backend/\*** | Generic concepts: intent, target, message, policy, evidence, viewport, route token, session, capability | Product names, customer names, site selectors, business rules, hard-coded routes |
| **contracts/** | Shapes, events, permissions, evidence schemas | Implementation, product logic |
| **application/** | Everything domain-specific | — (this is the only place it lives) |
| **shared/** | Pure utilities, result types, IDs | Any product or site knowledge |

```
     APPLICATION CONFIG + DOMAIN CODE
                   │
                   │ contracts + governed inputs
                   ▼
     ┌─────────────────────────────┐
     │  FRONTEND / BACKEND RUNTIMES │
     │  motion · cognition         │
     │  communications · governance│
     └──────────────┬──────────────┘
                    │
              snapshots / events
```

## How to use for a new product

1. Copy this tree.
2. Put all product names, routes, selectors, business rules, and branding in `application/`.
3. Wire domain knowledge into the runtimes only through contracts and adapters.
4. Never import `application/*` from inside `frontend/*` or `backend/*` runtimes.
5. Runtimes import only from `contracts/` and `shared/`.

## Language

TypeScript throughout. Contracts are TypeScript types (easily mirrored to JSON Schema / OpenAPI later if needed).

## Copyright and license

Copyright (c) 2026 Spruked. All rights reserved.

This repository is proprietary software. Use, copying, modification,
distribution, and derivative works are prohibited unless expressly authorized
in a written agreement signed by Spruked. See [LICENSE](LICENSE) for the full
proprietary license and disclaimer.
