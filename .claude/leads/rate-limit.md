# Rate limit

Key: sha256(CONTACT_IP_HASH_SALT + ':' + ip) where ip = X-Real-IP, else last X-Forwarded-For hop, else 'unknown' (`lib/contact-client-ip.ts`, fix F-0002). Reference proxy sets X-Real-IP $remote_addr and appends XFF. Deployments behind another proxy must set X-Real-IP or be the last XFF hop. Window: 10 min, limit 5, response 429 PT-BR.
