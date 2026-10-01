"""
Flask endpoints for the agent.

POST /agent/chat    {"message": "...", "thread_id": optional}
POST /agent/resume  {"thread_id": "...", "approved": true|false, "message": optional edited text}

Both require the same JWT the Node backend issues (Authorization: Bearer ...).
The patient's email is taken from the verified token, not the request body.
"""

import logging
import os
import threading
import uuid

import jwt
from flask import Blueprint, jsonify, request
from langgraph.errors import GraphRecursionError

from .graph import run_turn

log = logging.getLogger("labinsight.agent")

agent_bp = Blueprint("agent", __name__, url_prefix="/agent")

_state = {"graph": None}
_thread_owner = {}
_owner_lock = threading.Lock()


def set_graph(graph):
    _state["graph"] = graph


def _authenticated_email():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None, (jsonify({"error": "Sign in required"}), 401)
    secret = os.getenv("JWT_SECRET")
    if not secret:
        log.error("JWT_SECRET is not set on the AI service")
        return None, (jsonify({"error": "Agent is not configured"}), 500)
    try:
        claims = jwt.decode(header.split(" ", 1)[1], secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None, (jsonify({"error": "Session expired, please sign in again"}), 401)
    except jwt.InvalidTokenError:
        return None, (jsonify({"error": "Invalid session"}), 401)
    email = claims.get("email")
    if not email:
        return None, (jsonify({"error": "Invalid session"}), 401)
    return email, None


def _claim_thread(thread_id, email, create=True):
    """A thread belongs to the patient who started it; nobody else can read or resume it."""
    with _owner_lock:
        owner = _thread_owner.setdefault(thread_id, email) if create else _thread_owner.get(thread_id)
    return owner == email


def _run(thread_id, email, **kwargs):
    try:
        result = run_turn(_state["graph"], thread_id, email, **kwargs)
    except GraphRecursionError:
        log.warning("thread=%s hit recursion limit", thread_id)
        result = {"status": "done", "trace": [], "latency_ms": None,
                  "answer": "Sorry, I couldn't finish that one. Could you ask it a different way?"}
    except Exception:
        log.exception("thread=%s agent error", thread_id)
        return jsonify({"error": "The assistant hit an error. Please try again."}), 500
    result["thread_id"] = thread_id
    return jsonify(result)


@agent_bp.route("/chat", methods=["POST"])
def chat():
    email, err = _authenticated_email()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message is required"}), 400
    if len(message) > 2000:
        return jsonify({"error": "message is too long"}), 400

    thread_id = data.get("thread_id") or uuid.uuid4().hex
    if not _claim_thread(thread_id, email):
        return jsonify({"error": "Conversation not found"}), 404
    return _run(thread_id, email, message=message)


@agent_bp.route("/resume", methods=["POST"])
def resume():
    email, err = _authenticated_email()
    if err:
        return err
    data = request.get_json(silent=True) or {}
    thread_id = data.get("thread_id")
    if not thread_id or not _claim_thread(thread_id, email, create=False):
        return jsonify({"error": "Conversation not found"}), 404

    decision = {"approved": bool(data.get("approved"))}
    if data.get("message"):
        decision["message"] = str(data["message"])
    return _run(thread_id, email, resume=decision)
