"""Answer verifier using NLI / cross-encoder models.

Attempts to verify whether an LLM-generated answer is supported by retrieved
passages. Uses transformers `roberta-large-mnli` pipeline when available, or
falls back to a sentence-transformers CrossEncoder if installed.

API:
 - verify_answer(answer: str, passages: list[str], threshold: float=0.7) -> dict
    returns a dict with overall 'supported' flag and per-sentence support info.
"""
from typing import List, Dict, Any
import math

try:
    from transformers import pipeline
    HF_AVAILABLE = True
except Exception:
    HF_AVAILABLE = False

try:
    from sentence_transformers import CrossEncoder
    ST_CE_AVAILABLE = True
except Exception:
    ST_CE_AVAILABLE = False


def _hf_nli_verify(hypothesis: str, premise: str):
    # Use transformers text-classification pipeline with MNLI model
    # Returns probability of entailment label if available
    try:
        clf = pipeline('text-classification', model='roberta-large-mnli')
        # pipeline returns label and score, but mapping needed: labels are 'ENTAILMENT', 'CONTRADICTION', 'NEUTRAL'
        out = clf(f"{premise} \n\n {hypothesis}")
        # `out` is a list with a dict containing label and score
        # We approximate entailment probability when label==ENTAILMENT
        for o in out:
            if o.get('label', '').upper().startswith('ENTAIL'):
                return float(o.get('score', 0.0))
        # if top label not entail, return 0
        return 0.0
    except Exception:
        return 0.0


def _crossencoder_score(hypothesis: str, premise: str):
    try:
        ce = CrossEncoder('cross-encoder/stsb-roberta-base')
        # CrossEncoder returns a relevance/regression score; higher means more related
        score = ce.predict([(hypothesis, premise)])[0]
        # Map score to [0,1] heuristic
        return 1.0 / (1.0 + math.exp(-score / 5.0))
    except Exception:
        return 0.0


def verify_answer(answer: str, passages: List[str], threshold: float = 0.7) -> Dict[str, Any]:
    """Verify answer support across passages.

    Splits the answer into sentences and checks for entailment against each
    passage. Returns an aggregate result and per-sentence info.
    """
    # Lightweight sentence split
    try:
        import nltk
        from nltk.tokenize import sent_tokenize
        sents = sent_tokenize(answer)
    except Exception:
        sents = [s.strip() for s in answer.split('.') if s.strip()]

    results = []
    overall_supported = False

    for sent in sents:
        best_score = 0.0
        best_passage_idx = None
        for i, p in enumerate(passages):
            score = 0.0
            if HF_AVAILABLE:
                score = _hf_nli_verify(sent, p)
            elif ST_CE_AVAILABLE:
                score = _crossencoder_score(sent, p)
            else:
                # no model available; cannot verify
                score = 0.0

            if score > best_score:
                best_score = score
                best_passage_idx = i

        supported = best_score >= threshold
        if supported:
            overall_supported = True

        results.append({
            'sentence': sent,
            'best_score': float(best_score),
            'best_passage_idx': best_passage_idx,
            'supported': supported
        })

    return {
        'supported': overall_supported,
        'details': results
    }
