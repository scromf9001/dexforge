import time
import subprocess
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from pathlib import Path

REPO_PATH = Path(__file__).parent
DATA_PATH = REPO_PATH / "data"

class DataChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.is_directory:
            return

        if event.src_path.endswith(".json"):
            print(f"Detected change: {event.src_path}")
            commit_and_push()

def commit_and_push():
    try:
        subprocess.run(["git", "add", "data"], cwd=REPO_PATH, check=True)
        subprocess.run(
            ["git", "commit", "-m", "Update user Pokédex data"],
            cwd=REPO_PATH,
            check=True
        )
        subprocess.run(["git", "push"], cwd=REPO_PATH, check=True)
        print("Changes committed and pushed.")
    except subprocess.CalledProcessError as e:
        print("Git command failed:", e)

if __name__ == "__main__":
    observer = Observer()
    handler = DataChangeHandler()
    observer.schedule(handler, str(DATA_PATH), recursive=False)

    observer.start()
    print("Watching for Pokédex updates...")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()

    observer.join()
