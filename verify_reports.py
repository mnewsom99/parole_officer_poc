from backend import reports
import os

def verify_reports():
    print("Verifying PDF Report Generation...")
    try:
        # Generate report
        buffer = reports.generate_monthly_report("June")
        
        # Check if buffer has content
        content = buffer.getvalue()
        if len(content) > 0:
            print(f"Success: Generated PDF with {len(content)} bytes.")
            
            # Save to disk for manual inspection (optional)
            with open("test_report.pdf", "wb") as f:
                f.write(content)
            print("Saved 'test_report.pdf' for inspection.")
            
            # Check for PDF header
            if content.startswith(b"%PDF"):
                print("Verification Passed: Valid PDF header found.")
            else:
                print("Verification Failed: Invalid PDF header.")
        else:
            print("Verification Failed: Empty buffer.")
            
    except Exception as e:
        print(f"Verification Failed: {e}")

if __name__ == "__main__":
    verify_reports()
