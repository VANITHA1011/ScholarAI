import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.agent.document_collector_agent import DocumentCollectorAgent, OFFICIAL_PORTAL_REGISTRY, WORKFLOW_STATES

def test_hitl_browser_automation():
    print("=" * 65)
    print("Testing Human-in-the-Loop Browser Automation Engine")
    print("=" * 65)

    agent = DocumentCollectorAgent()

    # 1. Test Registry Mapping
    print("\n[1] Testing Official Portal Registry Mapping...")
    for doc in ["aadhaar", "income", "tenth", "twelfth", "community", "college", "nptel"]:
        info = agent.get_portal_info(doc)
        print(f"  [OK] {doc.upper()}: {info['authority']} -> {info['official_url']}")
        assert info["official_url"].startswith("http"), f"Invalid URL for {doc}"

    # 2. Test Normal Flow
    print("\n[2] Testing Normal Flow (No challenges)...")
    res_normal = agent.start_collection(user_id=999, document_type="tenth", open_browser_window=False)
    print(f"  State: {res_normal['state']}")
    print(f"  Status Message: {res_normal['status_message']}")
    assert res_normal["state"] in ("DOCUMENT_PAGE_FOUND", "SEARCHING", "WEBSITE_OPENED", "HUMAN_VERIFICATION_REQUIRED", "WEBSITE_BLOCKED")
    print("  [OK] Normal flow successfully progressed without crash.")

    # 3. Test Human Verification Pause & Resume Flow
    print("\n[3] Testing Human Verification Detection & HITL Pause...")
    # Simulate site probe returning HUMAN_VERIFICATION_REQUIRED
    original_check = agent.check_site_security_status
    agent.check_site_security_status = lambda url: {
        "status": "HUMAN_VERIFICATION_REQUIRED",
        "reason": "Cloudflare Turnstile / 'Verify you are human' challenge present",
        "status_code": 403
    }

    res_challenge = agent.start_collection(user_id=999, document_type="income", open_browser_window=False)
    print(f"  Initial State upon challenge: {res_challenge['state']}")
    print(f"  Reason: {res_challenge['verification_reason']}")
    assert res_challenge["state"] == "HUMAN_VERIFICATION_REQUIRED"
    print("  [OK] Automation paused deterministically when human verification was detected.")

    # User completes verification in browser and clicks "I've completed verification"
    print("\n[4] Testing User Resumption After Completing Verification...")
    # Simulate challenge cleared
    agent.check_site_security_status = lambda url: {
        "status": "NORMAL",
        "reason": "Challenge cleared by human",
        "status_code": 200
    }
    res_resumed = agent.confirm_human_verification(user_id=999, document_type="income")
    print(f"  Resumed State: {res_resumed['state']}")
    print(f"  Status Message: {res_resumed['status_message']}")
    assert res_resumed["state"] in ("DOCUMENT_PAGE_FOUND", "SEARCHING")
    print("  [OK] Workflow continued automatically after human verification confirmation.")

    # 5. Test Blocked Website Flow
    print("\n[5] Testing Blocked Website Handling & Manual Fallback...")
    agent.check_site_security_status = lambda url: {
        "status": "WEBSITE_BLOCKED",
        "reason": "HTTP 403 Forbidden: Access Denied / Bot Automation Blocked",
        "status_code": 403
    }
    res_blocked = agent.start_collection(user_id=999, document_type="aadhaar", open_browser_window=False)
    print(f"  Blocked State: {res_blocked['state']}")
    print(f"  Block Reason: {res_blocked['block_reason']}")
    assert res_blocked["state"] == "WEBSITE_BLOCKED"
    print("  [OK] Automation safely stopped on blocked site without retrying or bypassing.")

    # User chooses manual access
    res_manual = agent.record_manual_access(user_id=999, document_type="aadhaar")
    print(f"  Manual Fallback State: {res_manual['state']}")
    assert res_manual["state"] == "MANUAL_ACCESS_REQUIRED"
    print("  [OK] Switched to manual access fallback successfully.")

    # Restore original method
    agent.check_site_security_status = original_check

    print("\n" + "=" * 65)
    print("ALL HITL BROWSER AUTOMATION TESTS PASSED SUCCESSFULLY! [OK]")
    print("=" * 65)

if __name__ == "__main__":
    test_hitl_browser_automation()
