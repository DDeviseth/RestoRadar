import { setServers } from 'node:dns';

// Optional resolver override for networks that refuse MongoDB SRV lookups.
// This affects this Node process only, not the computer's network settings.
const servers = process.env.MONGODB_DNS_SERVERS?.split(',')
  .map((server) => server.trim())
  .filter(Boolean);
if (servers?.length) setServers(servers);
