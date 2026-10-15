#!/bin/bash
cd "$(dirname "$0")"
(sleep 1; open "http://127.0.0.1:8800/") &
exec python3 server.py 8800
