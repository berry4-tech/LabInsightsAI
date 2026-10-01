"""
LangGraph agent for LabInsight.

    START -> safety_check --(emergency wording)--> END   (fixed reply, no LLM call)
                 |
                 v
               agent <--> tools      (model picks tools until it can answer)
                 |
                 v
                END

request_doctor_review pauses the graph with interrupt() so the patient can
approve, edit, or cancel before anything is written to MongoDB. The paused
state is kept by the checkpointer under the conversation's thread_id.
"""

import logging
import os
import time
from contextlib import contextmanager
from typing import Optional

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, trim_messages
from langchain_core.rate_limiters import InMemoryRateLimiter
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, MessagesState, StateGraph
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.types import Command, interrupt

from . import tools_impl
from .prompts import EMERGENCY_PATTERN, EMERGENCY_REPLY, SYSTEM_PROMPT

log = logging.getLogger("labinsight.agent")

# Set once by init_agent(); tools read from here.
_ctx = {"db": None, "encode": None, "base_dir": None}

MAX_HISTORY_MESSAGES = 30


def configure(db, encode, base_dir):
    _ctx.update(db=db, encode=encode, base_dir=base_dir)


def _patient(config: RunnableConfig) -> str:
    email = (config or {}).get("configurable", {}).get("patient_email")
    if not email:
        raise ValueError("No authenticated patient on this run.")
    return email


@contextmanager
def _timed(name):
    start = time.perf_counter()
    try:
        yield
    finally:
        log.info("tool=%s latency_ms=%.0f", name, (time.perf_counter() - start) * 1000)


# ------------------------------------------------------------------
# tools (patient identity comes from config, never from model arguments)
# ------------------------------------------------------------------

@tool
def get_latest_report(config: RunnableConfig) -> dict:
    """Get the patient's most recent lab report: overall summary, severity, every test with its value, unit, normal range and status, and which tests are flagged."""
    with _timed("get_latest_report"):
        return tools_impl.get_latest_report(_ctx["db"], _patient(config))


@tool
def get_test_history(test_name: str, config: RunnableConfig) -> dict:
    """Get every past reading of one test (for example 'glucose', 'hemoglobin' or 'vitamin D') across all of the patient's reports, oldest first, plus whether it is increasing, decreasing or stable."""
    with _timed("get_test_history"):
        return tools_impl.get_test_history(_ctx["db"], _patient(config), test_name)


@tool
def search_report_text(query: str, config: RunnableConfig) -> dict:
    """Semantic search over the full text of the patient's latest report. Use it for details the structured results may miss, such as lab notes, comments, methods or extra tests."""
    with _timed("search_report_text"):
        return tools_impl.search_report_text(
            _ctx["db"], _patient(config), query, _ctx["encode"], _ctx["base_dir"]
        )


@tool
def find_doctors(config: RunnableConfig, specialization: Optional[str] = None) -> dict:
    """List doctors available on LabInsight, optionally filtered by specialization (for example 'endocrinology' for glucose or thyroid results, 'cardiology' for cholesterol, 'hematology' for blood counts). Shows which doctor, if any, the patient is already connected to."""
    with _timed("find_doctors"):
        return tools_impl.find_doctors(_ctx["db"], _patient(config), specialization)


@tool
def request_doctor_review(doctor_email: str, message: str, config: RunnableConfig) -> dict:
    """Send a doctor a request to connect with the patient and review their reports. The patient sees the doctor and message and must approve, edit or cancel before it is sent. Only call this after the patient has said they want a doctor to review their results, using an email returned by find_doctors."""
    patient = _patient(config)
    db = _ctx["db"]

    # Validation runs before the pause. LangGraph re-runs this tool from the
    # top when it resumes, so everything above interrupt() must be read-only.
    check = tools_impl.prepare_doctor_request(db, patient, doctor_email)
    if not check["ok"]:
        return check

    decision = interrupt({
        "type": "doctor_request",
        "doctor": check["doctor"],
        "message": (message or "").strip()[: tools_impl.MAX_MESSAGE_CHARS],
        "warning": check.get("warning"),
    })

    if not isinstance(decision, dict) or not decision.get("approved"):
        return {"sent": False, "reason": "patient_cancelled",
                "message": "The patient chose not to send this request. Do not retry unless they ask."}

    final_message = (decision.get("message") or message or "").strip()
    with _timed("request_doctor_review.write"):
        return tools_impl.create_doctor_request(db, patient, check["doctor"]["email"], final_message)


TOOLS = [get_latest_report, get_test_history, search_report_text, find_doctors, request_doctor_review]


# ------------------------------------------------------------------
# graph
# ------------------------------------------------------------------

def make_llm():
    limiter = InMemoryRateLimiter(
        requests_per_second=float(os.getenv("AGENT_REQUESTS_PER_SECOND", "0.5")),
        check_every_n_seconds=0.1,
        max_bucket_size=2,
    )
    return ChatGroq(
        model=os.getenv("AGENT_MODEL", "llama-3.3-70b-versatile"),
        temperature=0,
        max_retries=2,
        rate_limiter=limiter,
    )


def safety_check(state: MessagesState):
    last = state["messages"][-1]
    if isinstance(last, HumanMessage) and EMERGENCY_PATTERN.search(str(last.content)):
        log.warning("guardrail=emergency_reply")
        return {"messages": [AIMessage(content=EMERGENCY_REPLY)]}
    return {}


def _after_safety(state: MessagesState):
    return END if isinstance(state["messages"][-1], AIMessage) else "agent"


def build_graph(llm=None, checkpointer=None):
    llm = llm or make_llm()
    # One tool call at a time keeps the approval step simple to reason about.
    model = llm.bind_tools(TOOLS, parallel_tool_calls=False)

    def agent(state: MessagesState):
        # Context window control: keep recent turns, always starting on a
        # patient message so no tool result is left without its tool call.
        history = trim_messages(
            state["messages"], max_tokens=MAX_HISTORY_MESSAGES, token_counter=len,
            strategy="last", start_on="human",
        )
        messages = [SystemMessage(SYSTEM_PROMPT)] + history
        try:
            reply = model.invoke(messages)
        except Exception as e:
            # Llama on Groq occasionally emits a malformed tool call (400
            # tool_use_failed). One retry almost always succeeds.
            if "tool_use_failed" not in str(e):
                raise
            log.warning("retrying after malformed tool call")
            reply = model.invoke(messages)
        return {"messages": [reply]}

    g = StateGraph(MessagesState)
    g.add_node("safety_check", safety_check)
    g.add_node("agent", agent)
    g.add_node("tools", ToolNode(TOOLS))
    g.add_edge(START, "safety_check")
    g.add_conditional_edges("safety_check", _after_safety, {"agent": "agent", END: END})
    g.add_conditional_edges("agent", tools_condition)  # "tools" or END
    g.add_edge("tools", "agent")
    return g.compile(checkpointer=checkpointer or MemorySaver())


# ------------------------------------------------------------------
# running one turn
# ------------------------------------------------------------------

def _pending_interrupt(snapshot):
    for task in snapshot.tasks or ():
        for intr in getattr(task, "interrupts", ()) or ():
            return intr.value
    return None


def _trace(messages):
    return [
        {"tool": call["name"], "args": call.get("args", {})}
        for m in messages if isinstance(m, AIMessage)
        for call in (m.tool_calls or [])
    ]


def run_turn(graph, thread_id, patient_email, message=None, resume=None, recursion_limit=12):
    """
    Run one patient turn: either a new message or a resume after approval.

    Returns {"status": "done", "answer", "trace", "latency_ms"} or
            {"status": "awaiting_approval", "pending_action", "trace", "latency_ms"}.
    """
    config = {
        "configurable": {"thread_id": thread_id, "patient_email": patient_email},
        "recursion_limit": recursion_limit,
    }
    snapshot = graph.get_state(config)
    start = time.perf_counter()

    if resume is not None and _pending_interrupt(snapshot) is None:
        return {"status": "done", "answer": "There's nothing waiting for your approval.",
                "trace": [], "latency_ms": 0}

    if resume is None and _pending_interrupt(snapshot) is not None:
        # The patient typed something new instead of answering the approval
        # card. Treat that as a cancel so the tool call gets a result.
        graph.invoke(Command(resume={"approved": False}), config)
        snapshot = graph.get_state(config)

    before = len(snapshot.values.get("messages", []))
    graph.invoke(Command(resume=resume) if resume is not None
                 else {"messages": [HumanMessage(content=message)]}, config)

    snapshot = graph.get_state(config)
    new_messages = snapshot.values.get("messages", [])[before:]
    latency_ms = round((time.perf_counter() - start) * 1000)
    trace = _trace(new_messages)
    log.info("thread=%s tools=%s latency_ms=%d", thread_id, [t["tool"] for t in trace], latency_ms)

    pending = _pending_interrupt(snapshot)
    if pending is not None:
        return {"status": "awaiting_approval", "pending_action": pending, "trace": trace, "latency_ms": latency_ms}

    answer = next((m.content for m in reversed(new_messages)
                   if isinstance(m, AIMessage) and m.content), "")
    return {"status": "done", "answer": answer, "trace": trace, "latency_ms": latency_ms}
