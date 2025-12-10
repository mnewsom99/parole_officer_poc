import subprocess
import time
import sys
import os
import signal
import socket
import threading

# Configuration
BACKEND_CMD = [sys.executable, "-m", "uvicorn", "backend.main:app", "--reload", "--port", "8000"]
FRONTEND_CMD = ["npm", "run", "dev"]
BACKEND_PORT = 8000
FRONTEND_PORT = 5173 

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def kill_process_on_port(port):
    """
    Kills any process listening on the specified port.
    Windows only implementation using netstat and taskkill.
    """
    try:
        # Find PID
        result = subprocess.run(f"netstat -ano | findstr :{port}", shell=True, capture_output=True, text=True)
        lines = result.stdout.strip().split('\n')
        
        for line in lines:
            parts = line.split()
            if len(parts) >= 5:
                # Basic check to ensure it's LISTENING or relevant state
                pid = parts[-1]
                if pid and pid != "0":
                    print(f"⚠️  Killing zombie process {pid} on port {port}...")
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL)
    except Exception as e:
        print(f"Error cleaning port {port}: {e}")

def run_process(cmd, name, color_code):
    """
    Runs a subprocess and monitors it. Auto-restarts on failure.
    """
    while True:
        print(f"\n{color_code}* Starting {name}...{RESET}")
        
        # Use shell=True for npm compatibility on Windows
        use_shell = "npm" in cmd[0]
        
        try:
            process = subprocess.Popen(
                cmd, 
                shell=use_shell,
                cwd=os.getcwd(),
                # Stdout/stderr could be piped if we want to prefix logs, 
                # but inheriting them is simpler for now to see output directly.
            )
            
            return_code = process.wait()
            
            if return_code != 0:
                print(f"\n{color_code}! {name} crashed with code {return_code}. Restarting in 3 seconds...{RESET}")
                time.sleep(3)
            else:
                print(f"\n{color_code}* {name} stopped gracefully.{RESET}")
                break

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error running {name}: {e}")
            time.sleep(3)

# ANSI Colors
GREEN = "\033[92m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RESET = "\033[0m"

def main():
    print(f"{YELLOW}* Starting Parole Officer POC System Manager...{RESET}")
    print(f"{YELLOW}   - Auto-restart enabled{RESET}")
    print(f"{YELLOW}   - Port cleaning enabled{RESET}")

    # 1. Clean Ports
    if is_port_in_use(BACKEND_PORT):
        kill_process_on_port(BACKEND_PORT)
    
    # Frontend port is less critical to kill as Vite handles it, but good practice
    # if is_port_in_use(FRONTEND_PORT):
    #     kill_process_on_port(FRONTEND_PORT)

    # 2. Start Threads
    backend_thread = threading.Thread(target=run_process, args=(BACKEND_CMD, "Backend (API)", GREEN), daemon=True)
    frontend_thread = threading.Thread(target=run_process, args=(FRONTEND_CMD, "Frontend (Vite)", BLUE), daemon=True)

    backend_thread.start()
    frontend_thread.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}🛑 Shutting down system...{RESET}")
        sys.exit(0)

if __name__ == "__main__":
    main()
