#!/usr/bin/env python3
"""
Script to retry generating AI feedback for question attempts that failed or are pending.
Run this via cron to ensure all attempts eventually get feedback.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).parent.parent.parent))

from bson import ObjectId
from server.db.mongo import connect_db, close_db, get_collection
from server.services.gemini_service import generate_feedback

async def run_retry():
    print("🔄 Starting AI Feedback Retry Job...")
    await connect_db()
    attempts_col = get_collection("question_attempts")
    bank_col = get_collection("question_bank")

    # Find attempts with missing/failed feedback
    query = {
        "feedback": {
            "$in": [
                "Generating AI feedback...", 
                "Feedback generation unavailable.",
                "",
                None
            ]
        }
    }
    cursor = attempts_col.find(query)
    attempts = await cursor.to_list(length=None)

    if not attempts:
        print("✅ No attempts missing feedback found. Everything is up to date.")
        await close_db()
        return

    print(f"⚠️ Found {len(attempts)} attempts missing feedback. Processing...")

    success_count = 0
    for attempt in attempts:
        attempt_id = attempt["_id"]
        question_id = attempt.get("question_id")
        transcript = attempt.get("user_answer_transcript", "")
        
        # Get question details from bank
        question_doc = None
        if question_id:
            try:
                question_doc = await bank_col.find_one({"_id": ObjectId(question_id)})
            except Exception:
                pass
            
            # Try to query by qid if it's a string not ObjectId
            if not question_doc and isinstance(question_id, str):
                question_doc = await bank_col.find_one({"qid": question_id})

        expected_answer = ""
        domain = "unknown"
        question_text = attempt.get("question_text", "Unknown question")

        if question_doc:
            expected_answer = question_doc.get("expected_answer", "")
            domain = question_doc.get("domain", "unknown")
            if not question_text or question_text == "Unknown question":
                question_text = question_doc.get("question_text", question_doc.get("question", ""))

        scores = attempt.get("scores", {})
        semantic_score = scores.get("semantic_similarity", 0.0)
        keyword_score = scores.get("keyword_coverage", 0.0)

        print(f"🤖 Generating feedback for attempt {attempt_id}...")
        try:
            feedback = await generate_feedback(
                question=question_text,
                user_answer=transcript,
                expected_answer=expected_answer,
                semantic_score=semantic_score,
                keyword_score=keyword_score,
                domain=domain
            )
            
            if feedback and feedback not in ["Generating AI feedback...", "Feedback generation unavailable."]:
                await attempts_col.update_one(
                    {"_id": attempt_id},
                    {"$set": {"feedback": feedback}}
                )
                print(f"  ✅ Success: Updated attempt {attempt_id}")
                success_count += 1
            else:
                print(f"  ❌ Failed: AI generated empty or fallback text for attempt {attempt_id}")
        except Exception as e:
            print(f"  ❌ Failed for attempt {attempt_id}: {e}")

    print(f"🏁 Finished processing. Successfully generated feedback for {success_count}/{len(attempts)} attempts.")
    await close_db()

if __name__ == "__main__":
    asyncio.run(run_retry())
