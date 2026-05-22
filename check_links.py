#!/usr/bin/env python3
import os
import json
import urllib3
import requests
from requests.exceptions import RequestException
from urllib.parse import urlparse

# Suppress standard SSL warnings when verify=False is used as a fallback
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Standard desktop User-Agent to avoid blocking from state firewalls
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def check_base_domain(url):
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            return False, None
        base_url = f"{parsed.scheme}://{parsed.netloc}/"
        response = requests.get(base_url, headers=HEADERS, timeout=8, allow_redirects=True, verify=False)
        # Any response below 500 (even a 403 or 404 on the home page) means the server is online
        if response.status_code < 500:
            return True, base_url
    except Exception:
        pass
    return False, None

def check_url(state_code, state_name, url):
    if not url:
        return False, "Missing URL"
    
    status_msg = ""
    
    # Try with SSL verification first
    try:
        response = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        if response.status_code < 400:
            return True, f"OK ({response.status_code})"
        elif response.status_code in [403, 405, 429]:
            return True, f"OK (Blocked: {response.status_code})"
        else:
            status_msg = f"HTTP Error {response.status_code}"
    except requests.exceptions.SSLError:
        # Fallback to verify=False if it's just an SSL/TLS cert issue
        try:
            response = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True, verify=False)
            if response.status_code < 400:
                return True, f"OK (SSL Warn, {response.status_code})"
            elif response.status_code in [403, 405, 429]:
                return True, f"OK (Blocked: SSL Warn, {response.status_code})"
            else:
                status_msg = f"HTTP Error {response.status_code} (Insecure)"
        except RequestException as e:
            status_msg = f"SSL Error & Connection Failed: {type(e).__name__}"
    except RequestException as e:
        status_msg = f"Connection Failed: {type(e).__name__}"

    # If the deep-link has failed, check if the base portal is active
    is_base_ok, base_url = check_base_domain(url)
    if is_base_ok:
        return False, f"{status_msg} (Portal changed? Base Domain {base_url} is active)"
    
    return False, status_msg

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
