# Routing Worker

A simple Cloudflare Worker that routes incoming requests to different workers based on configurable rules using service bindings.

## Overview

This routing worker acts as an intelligent proxy that:
- Receives requests on your zone
- Evaluates routing rules based on hostname and pathname
- Forwards requests to the appropriate worker using service bindings
- Returns responses from the target workers

## Project Structure

```
routing-worker/
├── wrangler.jsonc          # Wrangler configuration with service bindings
├── routes.json             # Routing rules configuration
├── src/
│   └── index.js            # Main routing logic
├── package.json            # Node dependencies
└── README.md              # This file
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Service Bindings

Edit `wrangler.jsonc` and update the `services` array with your actual worker names:

```jsonc
"services": [
  {
    "binding": "WORKER_A",
    "service": "your-first-worker-name"
  },
  {
    "binding": "WORKER_B",
    "service": "your-second-worker-name"
  }
]
```

### 3. Configure Routing Rules

Edit `routes.json` to define your routing rules. Each rule is evaluated in order (first match wins):

```json
{
  "rules": [
    {
      "name": "App subdomain routes to Worker A",
      "hostname": "app.example.com",
      "worker": "WORKER_A"
    },
    {
      "name": "Default fallback to Worker A",
      "default": true,
      "worker": "WORKER_A"
    }
  ]
}
```

### 4. Optional: Configure Routes

If you want to bind this worker to specific zones, uncomment and configure the `routes` section in `wrangler.jsonc`:

```jsonc
"routes": [
  {
    "pattern": "example.com/*",
    "zone_name": "example.com"
  }
]
```

## Development

Run the worker locally:

```bash
npm run dev
```

The worker will be available at `http://localhost:8787`

## Deployment

Deploy to Cloudflare:

```bash
npm run deploy
```

## How It Works

1. **Request Reception**: The routing worker receives an incoming request
2. **Rule Evaluation**: It extracts the hostname and pathname, then evaluates routing rules in order
3. **First Match Wins**: The first rule whose condition is true determines the target worker
4. **Request Forwarding**: The request is forwarded to the target worker via service binding
5. **Response Return**: The target worker's response is returned to the client

## Routing Rule Examples

All rules are defined in `routes.json`. Here are the available matching options:

### Route by exact hostname:
```json
{
  "name": "App subdomain",
  "hostname": "app.example.com",
  "worker": "WORKER_A"
}
```

### Route by hostname pattern (ends with):
```json
{
  "name": "API subdomains",
  "hostnameEndsWith": ".api.example.com",
  "worker": "WORKER_B"
}
```

### Route by hostname pattern (starts with):
```json
{
  "name": "Staging environments",
  "hostnameStartsWith": "staging-",
  "worker": "WORKER_A"
}
```

### Route by path prefix:
```json
{
  "name": "API endpoints",
  "pathnameStartsWith": "/api/",
  "worker": "WORKER_A"
}
```

### Route by path suffix:
```json
{
  "name": "Image files",
  "pathnameEndsWith": ".jpg",
  "worker": "WORKER_B"
}
```

### Route by exact path:
```json
{
  "name": "Health check",
  "pathname": "/health",
  "worker": "WORKER_A"
}
```

### Combined hostname and path:
```json
{
  "name": "Admin section",
  "hostname": "www.example.com",
  "pathnameStartsWith": "/admin",
  "worker": "WORKER_B"
}
```

### Default fallback (always matches):
```json
{
  "name": "Default route",
  "default": true,
  "worker": "WORKER_A"
}
```

## Troubleshooting

### Check logs during development:
```bash
wrangler tail
```

### Common issues:

1. **Service binding not found**: Make sure the worker names in `wrangler.jsonc` match your deployed workers
2. **404 No matching route**: Check your routing rules and ensure there's a default fallback
3. **500 Routing error**: Check the console logs for detailed error messages

## Adding More Workers

To add more target workers:

1. Add a new service binding in `wrangler.jsonc`:
   ```jsonc
   {
     "binding": "WORKER_C",
     "service": "worker-c-name"
   }
   ```

2. Add routing rules in `routes.json` that use the new binding:
   ```json
   {
     "name": "New service",
     "hostname": "new.example.com",
     "worker": "WORKER_C"
   }
   ```

## Rule Matching Logic

- Rules are evaluated in order from top to bottom
- First matching rule wins
- Multiple conditions in a single rule must ALL match (AND logic)
- Missing conditions are ignored (no constraint)
- Always include a default fallback rule at the end

## Best Practices

- Keep routing rules simple and readable
- Add descriptive names to each rule for easier troubleshooting
- Use a default fallback rule at the end
- Order rules from most specific to least specific
- Test locally before deploying
- Monitor logs to see which rules are matching
- Keep `routes.json` in version control
