# integrations-policy

## Policy
HTTP 200 is not health. Every provider call has a timeout; errors persisted; retries bounded; permanent failures not retried.

## Enforcement
integration gate, provider-timeouts sensor.
