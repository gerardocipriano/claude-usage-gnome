#!/usr/bin/env python3
# Prints JSON {h, s, till} using the Claude Code OAuth token.
import json, os, urllib.request
from datetime import datetime
tok = json.load(open(os.path.expanduser('~/.claude/.credentials.json')))['claudeAiOauth']['accessToken']
req = urllib.request.Request('https://api.anthropic.com/api/oauth/usage', headers={
    'Authorization': f'Bearer {tok}', 'anthropic-beta': 'oauth-2025-04-20'})
d = json.load(urllib.request.urlopen(req, timeout=15))
till = datetime.fromisoformat(d['five_hour']['resets_at']).astimezone().strftime('%H:%M')
print(json.dumps({'h': round(d['five_hour']['utilization']), 's': round(d['seven_day']['utilization']), 'till': till}))
