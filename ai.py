from flask import Flask
from flask_cors import CORS
import torch
import transformers
import sentencepiece
import accelerate
import safetensors