"""
In-memory session state — tracks adaptive difficulty per active session.

Each active interview session gets a SessionState, keyed by session_id.
On server restart, stale sessions are cleaned up by the startup routine.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class SessionState:
    """Tracks the adaptive difficulty state within a single interview session."""
    session_id: str
    user_id: str
    current_difficulty: int = 5
    # n+2 lookahead: difficulty already decided for the question 2 ahead
    pending_difficulties: dict[int, int] = field(default_factory=dict)
    used_question_ids: set[str] = field(default_factory=set)
    question_number: int = 0
    max_questions: int = 10
    topic: str | None = None
    mode: str = "interview"

    def advance(self) -> int:
        """
        Move to the next question and return the difficulty to use.
        If a pending difficulty was pre-calculated for this question number,
        use it; otherwise stick with current.
        """
        self.question_number += 1
        if self.question_number in self.pending_difficulties:
            self.current_difficulty = self.pending_difficulties.pop(
                self.question_number
            )
        return self.current_difficulty

    def set_future_difficulty(self, composite_score: float) -> None:
        """
        n+2 strategy: after scoring question `n`,
        determine the difficulty for question `n + 2`.
        """
        if composite_score >= 0.80:
            delta = 2
        elif composite_score >= 0.60:
            delta = 1
        elif composite_score >= 0.40:
            delta = 0
        elif composite_score >= 0.20:
            delta = -1
        else:
            delta = -2

        future_q = self.question_number + 2
        new_diff = max(1, min(20, self.current_difficulty + delta))
        self.pending_difficulties[future_q] = new_diff

    @property
    def is_complete(self) -> bool:
        return self.question_number >= self.max_questions


# ── Global session store ───────────────────────────────────────────

_sessions: dict[str, SessionState] = {}


def create_session_state(
    session_id: str,
    user_id: str,
    initial_difficulty: int,
    topic: str | None = None,
    mode: str = "interview",
    max_questions: int = 10,
) -> SessionState:
    state = SessionState(
        session_id=session_id,
        user_id=user_id,
        current_difficulty=initial_difficulty,
        topic=topic,
        mode=mode,
        max_questions=max_questions,
    )
    _sessions[session_id] = state
    return state


def get_session_state(session_id: str) -> SessionState | None:
    return _sessions.get(session_id)


def remove_session_state(session_id: str) -> None:
    _sessions.pop(session_id, None)


def difficulty_from_rating(rating: int) -> int:
    """Map user's ELO-like rating to an initial difficulty level."""
    if rating < 1000:
        return 3
    elif rating < 1400:
        return 6
    elif rating < 1800:
        return 9
    elif rating < 2200:
        return 12
    else:
        return 15
