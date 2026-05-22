#!/usr/bin/env python3
import os
import json
import urllib3
import requests
from requests.exceptions import RequestException

# Suppress standard SSL warnings when verify=False is used as a fallback
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Standard desktop User-Agent to avoid blocking from state firewalls
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

def check_url(state_code, state_name, url):
    if not url:
        return False, "Missing URL"
    
    # Try with SSL verification first
    try:
        response = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        if response.status_code < 400:
            return True, f"OK ({response.status_code})"
        else:
            return False, f"HTTP Error {response.status_code}"
    except requests.exceptions.SSLError:
        # Fallback to verify=False if it's just an SSL/TLS cert issue
        try:
            response = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True, verify=False)
            if response.status_code < 400:
                return True, f"OK (SSL Warn, {response.status_code})"
            else:
                return False, f"HTTP Error {response.status_code} (Insecure)"
        except RequestException as e:
            return False, f"SSL Error & Connection Failed: {type(e).__name__}"
    except RequestException as e:
        return False, f"Connection Failed: {type(e).__name__}"

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "states.json")
    
    if not os.path.exists(json_path):
        print(f"[-] states.json not found at {json_path}!")
        return 1

    with open(json_path, "r", encoding="utf-8") as f:
        try:
            states_data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"[-] Failed to parse states.json: {e}")
            return 1

    print("=" * 60)
    print(f"Registry Route - SOS Link Verification Auditor")
    print(f"Auditing {len(states_data)} Secretary of State links...")
    print("=" * 60)

    success_count = 0
    failures = []

    for index, (abbr, config) in enumerate(sorted(states_data.items()), 1):
        name = config.get("name", abbr)
        url = config.get("sos", "")
        
        print(f"[{index:02d}/51] Checking {name} ({abbr})... ", end="", flush=True)
        
        success, message = check_url(abbr, name, url)
        if success:
            success_count += 1
            print(f"\033[92m{message}\033[0m")
        else:
            failures.append((abbr, name, url, message))
            print(f"\033[91mFAILED: {message}\033[0m")

    print("\n" + "=" * 60)
    print("AUDIT RESULTS SUMMARY")
    print("=" * 60)
    print(f"Total checked: {len(states_data)}")
    print(f"Successful:    {success_count}")
    print(f"Failures:      {len(failures)}")
    
    if failures:
        print("\nBroken/Warning Links:")
        for abbr, name, url, error in failures:
            print(f"  - {name} ({abbr}): {error}")
            print(f"    URL: {url}")
        print("\n[-] Some Secretary of State links returned errors. Please audit them!")
        return 1
    else:
        print("\n[+] All Secretary of State links are operational!")
        return 0

if __name__ == "__main__":
    import sys
    sys.exit(main())
