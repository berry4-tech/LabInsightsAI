"""
LabInsight agent: a LangGraph tool-calling assistant with human-in-the-loop
approval, mounted on the existing Flask app under /agent.

Usage in ai_service.py:
    from agent import init_agent
    init_agent(app, db, embedding_model)
"""

import logging
import os


def init_agent(app, db, embedding_model):
    # Imported here so the rest of the service still starts if agent
    # dependencies are missing; the agent endpoints just won't be mounted.
    try:
        from .graph import build_graph, configure
        from .routes import agent_bp, set_graph
    except ImportError as e:
        print(f"⚠️  Agent disabled, missing dependency: {e}")
        return None

    log = logging.getLogger("labinsight.agent")
    log.setLevel(logging.INFO)
    if not log.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
        log.addHandler(handler)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    configure(db=db, encode=embedding_model.encode, base_dir=base_dir)

    graph = build_graph()
    set_graph(graph)
    app.register_blueprint(agent_bp)
    print("✅ Agent endpoints mounted at /agent/chat and /agent/resume")
    return graph
