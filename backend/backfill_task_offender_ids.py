from database import SessionLocal
from models import Task, SupervisionEpisode

def backfill_offender_ids():
    session = SessionLocal()
    try:
        # Get tasks with missing offender_id
        tasks = session.query(Task).filter(Task.offender_id.is_(None)).all()
        print(f"Found {len(tasks)} tasks needing backfill.")
        
        updated_count = 0
        for task in tasks:
            if task.episode_id:
                # Find episode to get offender_id
                episode = session.query(SupervisionEpisode).filter(SupervisionEpisode.episode_id == task.episode_id).first()
                if episode and episode.offender_id:
                    task.offender_id = episode.offender_id
                    updated_count += 1
            
            if updated_count % 100 == 0:
                print(f"Processed {updated_count}...")

        session.commit()
        print(f"Successfully backfilled {updated_count} tasks with offender_id.")

    except Exception as e:
        session.rollback()
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    backfill_offender_ids()
