FROM python:3.10-slim

WORKDIR /workspace

# Install system dependencies needed for compiling lightgbm, xgboost, shap
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Patch python-multipart and Marcel's multipart package conflict for FastAPI and Litestar
RUN python -c '\
from pathlib import Path; \
p = Path("/usr/local/lib/python3.10/site-packages/multipart/__init__.py"); \
content = """import sys\nimport importlib.util\nfrom pathlib import Path\n\nfrom python_multipart import *\nfrom python_multipart import __all__, __version__\n\nfor path in sys.path:\n    file_path = Path(path, "multipart.py")\n    try:\n        if file_path.is_file() and not path.endswith("multipart"):\n            spec = importlib.util.spec_from_file_location("_marcel_multipart", file_path)\n            if spec and spec.loader:\n                module = importlib.util.module_from_spec(spec)\n                spec.loader.exec_module(module)\n                for name, val in module.__dict__.items():\n                    if not name.startswith("_") and name not in globals():\n                        globals()[name] = val\n                break\n    except Exception:\n        pass\n"""; \
p.write_text(content) \
'

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
