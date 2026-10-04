# BOUNDARY

Hard rules for every app built on this spine.

## Dependency direction

```
application/  ──►  frontend/ | backend/ | contracts/ | shared/
frontend/     ──►  contracts/ | shared/
backend/      ──►  contracts/ | shared/
contracts/    ──►  shared/
shared/       ──►  (nothing)
```

**Never** reverse an arrow.  
**Never** import `application/*` from inside `frontend/*` or `backend/*`.

## What each layer may know

### shared/
- Pure utilities, Result/Outcome, geometry primitives, opaque IDs
- No product names, no business rules

### contracts/
- Shapes, events, enums, config interfaces for motion / cognition / communications / authority / evidence
- No implementations, no product logic

### frontend/* & backend/* runtimes
- Generic concepts: intent, target, message, policy, evidence, session, route token, presence, ranking
- Config objects and host-pushed data
- **Must not know:** product names, customer names, site selectors, hard-coded routes, business rules, tour scripts, branding copy

### application/
- Everything domain-specific: product names, routes, selectors, policies, templates, provider SDKs, feature logic
- This is the only place product language is allowed

## How domain knowledge enters a runtime

1. Via **config objects** defined in contracts and filled in `application/config`
2. Via **host/adapter calls** that push measured geometry, opaque tokens, or ranked items
3. Via **events** the application listens to and maps onto product UI / APIs

Never via direct imports of product modules into a runtime.

## Checklist for every new feature

- [ ] Does this need a product name or site rule? → put it in `application/`
- [ ] Is this a generic capability? → put it in the matching frontend/ or backend/ runtime
- [ ] Does the interface need to be shared? → add or extend a contract
- [ ] Did I import `application/` from a runtime? → remove it
- [ ] Did I hard-code a selector or route inside a runtime? → move it to an adapter
