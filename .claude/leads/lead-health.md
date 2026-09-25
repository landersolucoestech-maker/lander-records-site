# Lead health

Healthy lead pipeline =
1. contact spec PASS on current build;
2. contact-outbox-delivery integration test PASS;
3. lead-reconciliation sensor PASS;
4. lead-delivery sensor: 0 dead_letter, 0 overdue failed;
5. receiver configured OR DEC-0001 answered (today: not configured → pipeline is "persisting, not delivering").
State: `state/leads.yml`.
