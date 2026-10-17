#!/bin/bash
# Start een lokale webserver op poort 8765 in de map van de repository (als hij nog niet draait).
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
curl -s -o /dev/null http://localhost:8765/ || (cd "$ROOT" && nohup python3 -m http.server 8765 >/dev/null 2>&1 & sleep 1)
