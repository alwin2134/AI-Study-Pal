import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, StoppingCriteria, StoppingCriteriaList, pipeline

# Try importing CTransformers for GGUF support
try:
    from ctransformers import AutoModelForCausalLM as GGUFModel
    CT_AVAILABLE = True
except ImportError:
    CT_AVAILABLE = False

# Abstract Base
class LLMProvider:
    def generate(self, prompt, max_tokens=200):
        raise NotImplementedError

# --- 1. Cloud Providers ---
class GeminiProvider(LLMProvider):
    def __init__(self, api_key):
        import google.generativeai as genai
        self.api_key = api_key
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    def generate(self, prompt, max_tokens=500):
        try:
            clean_prompt = prompt.replace("<|system|>", "").replace("</s>", "").replace("<|user|>", "").replace("<|assistant|>", "")
            response = self.model.generate_content(clean_prompt)
            return response.text
        except Exception as e:
            return f"Gemini Error: {str(e)}"

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key):
        self.api_key = api_key
        import openai
        self.client = openai.OpenAI(api_key=api_key)
    
    def generate(self, prompt, max_tokens=500):
        try:
            clean_prompt = prompt.replace("<|system|>", "").replace("</s>", "").replace("<|user|>", "").replace("<|assistant|>", "")
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": clean_prompt}
                ],
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        except Exception as e:
             return f"OpenAI Error: {str(e)}"

# --- 2. Local Optimized Providers ---

class CTransformersProvider(LLMProvider):
    def __init__(self, model_path, model_type="llama", gpu_layers=0):
        print(f"[SmartLoader] Initializing GGUF Backend (GPU Layers: {gpu_layers})...")
        self.llm = GGUFModel.from_pretrained(
            model_path, 
            model_type=model_type, 
            gpu_layers=gpu_layers,
            context_length=2048
        )
        print("[SmartLoader] GGUF Model Loaded.")

    def generate(self, prompt, max_tokens=200):
        # CTransformers prompt handling
        # It handles GenerationConfig inside the call
        try:
           # Clean prompt tags if needed, or keep them if model was trained on them
           # TinyLlama Chat expects ChatML/Standard format usually. 
           # CTransformers might need raw text completion style.
           
           # Ensure internal stopping criteria via generation args if possible
           # But for now, simple generation
           response = self.llm(
               prompt, 
               max_new_tokens=max_tokens, 
               temperature=0.3, 
               top_p=0.9,
               stop=["</s>", "<|user|>", "User:"]
           )
           return response
        except Exception as e:
            return f"GGUF Error: {e}"

class HFTransformersProvider(LLMProvider):
    def __init__(self):
        print("[SmartLoader] Initializing Standard Transformers Backend (CPU Fallback)...")
        self.model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForCausalLM.from_pretrained(self.model_name, torch_dtype=torch.float32)
        self.generator = pipeline(
            "text-generation", 
            model=self.model, 
            tokenizer=self.tokenizer,
            max_new_tokens=200
        )
        print("[SmartLoader] Standard Model Loaded.")

    def generate(self, prompt, max_tokens=200):
        try:
            outputs = self.generator(
                prompt, 
                max_new_tokens=max_tokens, 
                do_sample=True, 
                temperature=0.3,
                return_full_text=False
            )
            return outputs[0]['generated_text'].strip()
        except Exception as e:
            return f"HF Error: {e}"

# --- 3. Smart Auto-Loader ---

class SmartLoader:
    def __init__(self):
        self.provider = None
        self.model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'models', 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf')

    def _check_nvidia_smi(self):
        """Check for NVIDIA GPU via system command, independent of PyTorch"""
        import subprocess
        try:
            # Run nvidia-smi query to get GPU name
            result = subprocess.run(
                ['nvidia-smi', '--query-gpu=name', '--format=csv,noheader'], 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE, 
                text=True
            )
            if result.returncode == 0:
                return result.stdout.strip()
            return False
        except Exception:
            return False

    def load(self):
        if self.provider: return self.provider

        print("--- [Smart Auto-Pilot] Scanning Hardware ---")
        
        # 1. Check GGUF File
        has_gguf = os.path.exists(self.model_path)
        
        # 2. Check GPU (Robust Method)
        # First check via PyTorch
        has_cuda = torch.cuda.is_available()
        gpu_name = torch.cuda.get_device_name(0) if has_cuda else None
        
        # Fallback: Check via nvidia-smi if PyTorch says no (e.g. CPU-only torch installed)
        if not has_cuda:
            smi_gpu = self._check_nvidia_smi()
            if smi_gpu:
                print(f"[SmartLoader] PyTorch didn't see GPU, but 'nvidia-smi' found: {smi_gpu}")
                has_cuda = True
                gpu_name = smi_gpu
        
        print(f"GPU Detected: {gpu_name if gpu_name else 'None'}")
        
        if CT_AVAILABLE and has_gguf:
            if has_cuda:
                print(">> OPTIMIZATION: TURBO GPU MODE ACTIVATED")
                print(f"   Offloading layers to {gpu_name}")
                # Offload 50 layers (all) to GPU
                self.provider = CTransformersProvider(self.model_path, gpu_layers=50)
            else:
                print(">> OPTIMIZATION: FAST CPU AVX MODE ACTIVATED")
                # CPU optimized
                self.provider = CTransformersProvider(self.model_path, gpu_layers=0)
        else:
            print(">> MODE: STANDARD COMPATIBILITY (CPU)")
            if not has_gguf: print(f"   (GGUF model not found at {self.model_path})")
            if not CT_AVAILABLE: print("   (ctransformers lib not installed)")
            self.provider = HFTransformersProvider()
            
        return self.provider

    def generate(self, prompt, max_tokens=200):
        if not self.provider: self.load()
        
        # Consistent prompt formatting for all local backend
        if "<|system|>" not in prompt:
             prompt = (
                "<|system|>\n"
                "You are a helpful assistant.</s>\n"
                "<|user|>\n"
                f"{prompt}</s>\n"
                "<|assistant|>\n"
            )
            
        return self.provider.generate(prompt, max_tokens)

# Singleton
local_llm = SmartLoader()

def get_provider(provider_name, **kwargs):
    if provider_name == 'gemini':
        api_key = kwargs.get('api_key') or os.getenv("GEMINI_API_KEY")
        if not api_key: return "Error: No Gemini API Key found in env or request."
        return GeminiProvider(api_key)
    elif provider_name == 'openai':
        api_key = kwargs.get('api_key') or os.getenv("OPENAI_API_KEY")
        if not api_key: return "Error: No OpenAI API Key found in env or request."
        return OpenAIProvider(api_key)
    else:
        return local_llm
