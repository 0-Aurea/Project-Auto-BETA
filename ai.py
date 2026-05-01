import time
import datetime
import re
from github import Github, GithubException
import requests
import logging
import random
import os
import json
from openai import OpenAI

PUTER_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0IjoiZ3VpIiwidiI6IjAuMC4wIiwidSI6ImJHbFJmN2hYU2NLOHlsM2hLNk56NkE9PSIsInV1IjoiU05HbURxd1JSb1c1anpKUlFVbThHZz09IiwiaWF0IjoxNzc0Mjk3NzU5fQ.K_Q7N6vfYV2_oUkleubJXzdsWBdgYsdZcwzjjq6iA8"
REPO_NAME = "0-Aurea/Project-Auto-Tester"
DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1499872461259276480/HrDhnq-IOZlyx5-T0y9CYrEUFyZWBbUVmEr_Js8szeYqNLv4UMoKXmKZv1l8puHAlfaZ"
GITHUB_TOKEN = "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"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("automation.log", mode='a'), logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

github_client = Github(GITHUB_TOKEN)
puter_client = OpenAI(
    base_url="https://api.puter.com/puterai/openai/v1/",
    api_key=PUTER_API_KEY,
)

def log_discord(msg, level="INFO"):
    levels = {
        "INFO": f"> ℹ️ INFO: {msg}",
        "SUCCESS": f"> ✅ SUCCESS: {msg}",
        "ERROR": f"> ❌ ERROR: {msg}",
        "WARN": f"> ⚠️ WARN: {msg}",
        "MISC": f"> 💡 {msg}"
    }
    payload = {"content": levels.get(level, msg)}
    try:
        r = requests.post(DISCORD_WEBHOOK_URL, json=payload, timeout=10)
        r.raise_for_status()
        logger.info(f"Discord log sent: {level} - {msg}")
    except Exception as e:
        logger.error(f"Failed to log to Discord: {e}")

def get_repo():
    try:
        repo = github_client.get_repo(REPO_NAME)
        user = github_client.get_user().login
        log_discord(f"Authenticated as {user}", "SUCCESS")
        logger.info(f"Successfully authenticated as {user} and connected to {REPO_NAME}")
        return repo
    except GithubException as e:
        log_discord(f"GitHub API error: {e.status} - {e.data.get('message', 'Unknown error')}", "ERROR")
        logger.error(f"GitHub API error: {e.status} - {e.data.get('message', 'Unknown error')}")
        exit(1)
    except Exception as e:
        log_discord(f"Accessing repository failed: {str(e)}", "ERROR")
        logger.error(f"Accessing repository failed: {str(e)}")
        exit(1)

def get_file_content(repo, file_path):
    try:
        file_content = repo.get_contents(file_path)
        return file_content.decoded_content.decode("utf-8"), file_content.sha
    except GithubException as e:
        if e.status == 404:
            log_discord(f"File {file_path} does not exist. It will be created.", "WARN")
            logger.warning(f"File {file_path} does not exist. It will be created.")
            return None, None
        else:
            log_discord(f"GitHub error accessing {file_path}: {e.data.get('message', 'Unknown error')}", "ERROR")
            logger.error(f"GitHub error accessing {file_path}: {e.data.get('message', 'Unknown error')}")
            return None, None
    except Exception as e:
        log_discord(f"Error accessing {file_path}: {str(e)}", "ERROR")
        logger.error(f"Error accessing {file_path}: {str(e)}")
        return None, None

def update_file(repo, file_path, new_content, sha, commit_message):
    try:
        repo.update_file(file_path, commit_message, new_content, sha)
        log_discord(f"Updated {file_path} | Commit: '{commit_message}'", "SUCCESS")
        logger.info(f"Updated {file_path} | Commit: '{commit_message}'")
    except GithubException as e:
        if e.status == 409:
            log_discord(f"SHA conflict for {file_path}. Retrying with latest SHA.", "WARN")
            logger.warning(f"SHA conflict for {file_path}. Retrying with latest SHA.")
            latest_content, latest_sha = get_file_content(repo, file_path)
            if latest_sha:
                update_file(repo, file_path, new_content, latest_sha, commit_message)
            else:
                log_discord(f"Failed to resolve SHA conflict for {file_path}. Skipping update.", "ERROR")
                logger.error(f"Failed to resolve SHA conflict for {file_path}. Skipping update.")
        else:
            log_discord(f"GitHub error updating {file_path}: {e.data.get('message', 'Unknown error')}", "ERROR")
            logger.error(f"GitHub error updating {file_path}: {e.data.get('message', 'Unknown error')}")
    except Exception as e:
        log_discord(f"Failed to update {file_path}: {str(e)}", "ERROR")
        logger.error(f"Failed to update {file_path}: {str(e)}")

def create_file(repo, file_path, content, commit_message):
    try:
        repo.create_file(file_path, commit_message, content)
        log_discord(f"Created {file_path} | Commit: '{commit_message}'", "SUCCESS")
        logger.info(f"Created {file_path} | Commit: '{commit_message}'")
    except GithubException as e:
        if e.status == 422:
            log_discord(f"File {file_path} already exists. Updating instead.", "WARN")
            logger.warning(f"File {file_path} already exists. Updating instead.")
            latest_content, latest_sha = get_file_content(repo, file_path)
            if latest_sha:
                update_file(repo, file_path, content, latest_sha, commit_message)
        else:
            log_discord(f"GitHub error creating {file_path}: {e.data.get('message', 'Unknown error')}", "ERROR")
            logger.error(f"GitHub error creating {file_path}: {e.data.get('message', 'Unknown error')}")
    except Exception as e:
        log_discord(f"Failed to create {file_path}: {str(e)}", "ERROR")
        logger.error(f"Failed to create {file_path}: {str(e)}")

def validate_ai_content(file_path, content):
    if len(content) < 10:
        return False, "Content too short"
    if "" in content:
        return False, "Content contains markdown code blocks"
    return True, "Content valid"

def clean_ai_response(response_text):
    response_text = re.sub(r"[a-zA-Z]*", "", response_text)
    response_text = response_text.replace("", "").strip()
    return response_text

def get_repo_structure(repo):
    structure = {
        "timestamp": datetime.datetime.now().isoformat(),
        "current_files": [],
        "directories": [],
        "file_extensions": {},
        "all_files": []
    }
    
    try:
        def traverse_directory(path=""):
            try:
                contents = repo.get_contents(path)
                for content in contents:
                    if content.type == "dir":
                        structure["directories"].append(content.path)
                        traverse_directory(content.path)
                    else:
                        if content.path.lower() != "readme.md":
                            structure["current_files"].append(content.path)
                            structure["all_files"].append(content.path)
                            
                            extension = content.path.split(".")[-1].lower() if "." in content.path else "unknown"
                            if extension not in structure["file_extensions"]:
                                structure["file_extensions"][extension] = []
                            structure["file_extensions"][extension].append(content.path)
            except Exception as e:
                logger.error(f"Error accessing {path}: {e}")
        
        traverse_directory()
        return structure
    except Exception as e:
        log_discord(f"Error building repository structure: {str(e)}", "ERROR")
        logger.error(f"Error building repository structure: {str(e)}")
        return structure

def generate_ai_directive(file_path, file_content, repo_structure):
    model = "google/gemini-2.5-flash"
    
    prompt = f"""
You are an expert AI developer. Your task is to build a complete, self-contained local AI system that runs entirely without external API calls.

**Project Goal:** Build a powerful AI with a web UI that users can chat with, using ONLY open-source models and local resources.

**Requirements:**

1. **Backend (Python/Flask or FastAPI):**
   - Integrate and manage open-source AI models locally (e.g., Llama.cpp, Transformers, or custom fine-tuned models)
   - Provide chat endpoint that processes user messages locally
   - No external API calls whatsoever
   - Support for downloading and managing open-source models

2. **Frontend (HTML/CSS/JS):**
   - Modern, dark-themed chat interface
   - Message history
   - Model selection dropdown (different open-source models)
   - Settings panel for model parameters (temperature, context length)
   - Streaming response support

3. **Model Integration:**
   - Integrate open-source models (e.g., from Hugging Face)
   - Support for quantized models (e.g., GGUF, ONNX)
   - Automatic model downloading and caching
   - CPU/GPU inference support

4. **File Structure:**
   - `app.py` - Main Flask/FastAPI server
   - `models/model_manager.py` - Handles model loading and inference
   - `static/index.html` - Web UI
   - `static/style.css` - Styling
   - `static/script.js` - Frontend logic
   - `requirements.txt` - Python dependencies
   - `config.json` - Model configurations

5. **Specific Features:**
   - Conversation memory/context
   - System prompt customization
   - Response streaming
   - Model switching without restart
   - Download progress for new models

**File Path**: {file_path}
**Current Content**:
{file_content}

**Response Format (STRICTLY FOLLOW)**:
edit filepath: {file_path}
content: [Your improved code here]