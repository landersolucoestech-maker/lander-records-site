# Delivery controller

`dispatchOutboxEvent(id)`: requires URL+secret else marks disabled; builds envelope from the stored row (payload immutable after insert); signs; POST with 4s timeout; 2xx → delivered (attempts+1, delivered_at); otherwise failure → `outboxFailureTransition`.
